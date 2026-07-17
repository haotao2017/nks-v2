package no.nks.service.impl;

import lombok.extern.slf4j.Slf4j;
import no.nks.dto.RequestResponse;
import no.nks.dto.third.tripletex.*;
import no.nks.dto.third.tripletex.auth.SessionToken;
import no.nks.dto.third.tripletex.auth.SessionTokenResponseDto;
import no.nks.dto.workflow.ProjectInvoiceDataDto;
import no.nks.dto.workflow.WrapperProjectInvoiceDataDto;
import no.nks.entity.ContactBook;
import no.nks.entity.Project;
import no.nks.entity.Service;
import no.nks.repository.ContactRepository;
import no.nks.repository.ProjectRepository;
import no.nks.repository.ServiceRepository;
import no.nks.service.TripletexService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.atomic.AtomicReference;

@Component
@Slf4j
public class TripletexServiceImpl implements TripletexService {

    private final RestTemplate restTemplate;
    private final ProjectRepository projectRepository;
    private final ContactRepository contactRepository;
    private final ServiceRepository serviceRepository;
    private final String baseUrl;
    private final String consumerToken;
    private final String employeeToken;
    private final String companyId;

    // 业务默认常量：原旧代码硬编码，现由 application.yml 注入（默认值保持行为不变）。
    private final Integer defaultAccountManagerId;
    private final Integer defaultVatTypeId;
    private final Integer defaultProductUnitId;
    private final Integer defaultCurrencyId;
    private final Integer defaultInvoicesDueInDays;
    private final int sessionExpirationDays;
    private final long sessionSafetyMarginMinutes;

    /**
     * 带 TTL 的 session token 缓存。
     * 旧代码把 sessionToken 存为可变实例字段，既非线程安全，也永不刷新。
     * 现改为不可变快照 + AtomicReference，配合 synchronized 双检，保证并发安全并按过期时间刷新。
     */
    private record CachedSessionToken(String token, Instant expiresAt) {
        boolean isValid() {
            return token != null && Instant.now().isBefore(expiresAt);
        }
    }

    private final AtomicReference<CachedSessionToken> sessionTokenCache = new AtomicReference<>();
    private final Object sessionLock = new Object();

    public TripletexServiceImpl(RestTemplate restTemplate,
                                ProjectRepository projectRepository,
                                ContactRepository contactRepository,
                                ServiceRepository serviceRepository,
                                @Value("${tripletex.api.base-url}") String baseUrl,
                                @Value("${tripletex.api.consumer-token}") String consumerToken,
                                @Value("${tripletex.api.employee-token}") String employeeToken,
                                @Value("${tripletex.api.company-id}") String companyId,
                                @Value("${tripletex.defaults.account-manager:1180852}") Integer defaultAccountManagerId,
                                @Value("${tripletex.defaults.vat-type:3}") Integer defaultVatTypeId,
                                @Value("${tripletex.defaults.product-unit:448331}") Integer defaultProductUnitId,
                                @Value("${tripletex.defaults.currency:1}") Integer defaultCurrencyId,
                                @Value("${tripletex.defaults.invoices-due-in-days:10}") Integer defaultInvoicesDueInDays,
                                @Value("${tripletex.session.expiration-days:1}") int sessionExpirationDays,
                                @Value("${tripletex.session.safety-margin-minutes:60}") long sessionSafetyMarginMinutes) {
        this.restTemplate = restTemplate;
        this.projectRepository = projectRepository;
        this.contactRepository = contactRepository;
        this.serviceRepository = serviceRepository;
        this.baseUrl = baseUrl;
        this.consumerToken = consumerToken;
        this.employeeToken = employeeToken;
        this.companyId = companyId;
        this.defaultAccountManagerId = defaultAccountManagerId;
        this.defaultVatTypeId = defaultVatTypeId;
        this.defaultProductUnitId = defaultProductUnitId;
        this.defaultCurrencyId = defaultCurrencyId;
        this.defaultInvoicesDueInDays = defaultInvoicesDueInDays;
        this.sessionExpirationDays = sessionExpirationDays;
        this.sessionSafetyMarginMinutes = sessionSafetyMarginMinutes;
    }

    @Override
    @Transactional
    public RequestResponse createTripletexOrderFromProject(Integer projectId) {
        try {
            Project project = projectRepository.findByIdWithDetailsForTripletex(projectId)
                    .orElseThrow(() -> new RuntimeException("Project not found with id: " + projectId));

            // 1. Find or Create Customer
            TripletexCustomerDto customer = findOrCreateCustomer(project.getCustomer());
            if (customer == null || customer.getId() == null) {
                throw new RuntimeException("Failed to find or create customer in Tripletex.");
            }

            // 2. Find or Create Products for all services
            List<TripletexProductDto> products = new ArrayList<>();
            for (var projectService : project.getProjectServices()) {
                TripletexProductDto product = findOrCreateProduct(projectService.getService(), projectService.getPrice());
                products.add(product);
            }

            // 3. Create Order (Shell first, then add lines)
            TripletexOrderDto createdOrder = createOrder(project, customer, products);

            // 4. Update local DB
            project.setInvoiceTripletexID(String.valueOf(createdOrder.getId()));
            projectRepository.save(project);

            log.info("Successfully created Tripletex order {} for project {}", createdOrder.getId(), projectId);
            return new RequestResponse(true, "Tripletex order created successfully.");

        } catch (Exception e) {
            log.error("Error creating Tripletex order for project {}", projectId, e);
            return new RequestResponse(false, "Error creating order in Tripletex: " + e.getMessage());
        }
    }

    private TripletexCustomerDto findOrCreateCustomer(ContactBook contact) {
        if (contact.getTripletexId() != null) {
            // In a real scenario, you might want to fetch the customer to confirm it exists.
            // For now, we trust the local ID.
            log.info("Customer {} already has a Tripletex ID: {}. Skipping creation.", contact.getId(), contact.getTripletexId());
            TripletexCustomerDto existingCustomer = new TripletexCustomerDto();
            existingCustomer.setId(Integer.parseInt(contact.getTripletexId()));
            existingCustomer.setName(contact.getName()); // Essential for order creation
            return existingCustomer;
        }

        log.info("Creating new Tripletex customer for contact ID: {}", contact.getId());
        EmployeeDto accountManager = EmployeeDto.builder().id(defaultAccountManagerId).build();
        TripletexCustomerDto newCustomer = TripletexCustomerDto.builder()
                .name(contact.getCompanyName() != null && !contact.getCompanyName().isBlank() ? contact.getCompanyName() : contact.getName())
                .email(contact.getEmail())
                .invoiceEmail(contact.getEmail())
                .phoneNumberMobile(contact.getContactNo())
                .accountManager(accountManager)
                .invoiceSendMethod("EMAIL")
                .build();

        TripletexResponseDto<TripletexCustomerDto> response = post("/v2/customer", newCustomer, new ParameterizedTypeReference<>() {});
        TripletexCustomerDto createdCustomer = response.getValue();

        // Save new Tripletex ID to local contact book
        contact.setTripletexId(String.valueOf(createdCustomer.getId()));
        contactRepository.save(contact);
        log.info("Successfully created Tripletex customer with ID: {}", createdCustomer.getId());

        return createdCustomer;
    }

    private TripletexProductDto findOrCreateProduct(Service service, String projectSpecificPrice) {
        if (service.getTripletexId() != null) {
            log.info("Product {} already has a Tripletex ID: {}. Checking for price updates.", service.getId(), service.getTripletexId());
            // Original logic also updates the price if it differs.
            // We will do a GET and PUT if necessary.
            return getAndUpdateProductPrice(service, projectSpecificPrice);
        }

        log.info("Creating new Tripletex product for service ID: {}", service.getId());
        VatTypeDto vatType = VatTypeDto.builder().id(defaultVatTypeId).build();
        ProductUnitDto unit = ProductUnitDto.builder().id(defaultProductUnitId).build();

        BigDecimal price = new BigDecimal(projectSpecificPrice != null ? projectSpecificPrice : service.getRate());

        TripletexProductDto newProduct = TripletexProductDto.builder()
                .name(service.getName())
                .number(String.valueOf(service.getId())) // Using service ID as product number
                .priceExcludingVatCurrency(price)
                .costExcludingVatCurrency(price)
                .vatType(vatType)
                .productUnit(unit)
                .build();

        TripletexResponseDto<TripletexProductDto> response = post("/v2/product", newProduct, new ParameterizedTypeReference<>() {});
        TripletexProductDto createdProduct = response.getValue();

        service.setTripletexId(String.valueOf(createdProduct.getId()));
        serviceRepository.save(service);
        log.info("Successfully created Tripletex product with ID: {}", createdProduct.getId());

        return createdProduct;
    }

    private TripletexProductDto getAndUpdateProductPrice(Service service, String projectSpecificPrice) {
        String url = "/v2/product/" + service.getTripletexId();
        try {
            ResponseEntity<TripletexResponseDto<TripletexProductDto>> response = restTemplate.exchange(
                    baseUrl + url, HttpMethod.GET, new HttpEntity<>(createAuthHeaders()), new ParameterizedTypeReference<>() {});

            TripletexProductDto product = Objects.requireNonNull(response.getBody()).getValue();
            BigDecimal currentPrice = product.getPriceExcludingVatCurrency();
            BigDecimal newPrice = new BigDecimal(projectSpecificPrice);

            if (currentPrice.compareTo(newPrice) != 0) {
                log.info("Price for product {} differs. Updating from {} to {}.", product.getId(), currentPrice, newPrice);
                // Build a minimal payload for the PUT (price update only).
                Map<String, BigDecimal> updatePayload = Map.of(
                        "priceExcludingVatCurrency", newPrice,
                        "costExcludingVatCurrency", newPrice
                );
                put(url, updatePayload);
                product.setPriceExcludingVatCurrency(newPrice);
            }
            return product;
        } catch (Exception e) {
            log.error("Failed to get or update product {}. Returning a placeholder.", service.getTripletexId(), e);
            // Fallback to just returning what we know
            TripletexProductDto fallback = new TripletexProductDto();
            fallback.setId(Integer.parseInt(service.getTripletexId()));
            return fallback;
        }
    }


    private TripletexOrderDto createOrder(Project project, TripletexCustomerDto customer, List<TripletexProductDto> products) {
        log.info("Creating order shell for project ID: {}", project.getId());

        String today = LocalDate.now().format(DateTimeFormatter.ISO_LOCAL_DATE);

        // Step 1: Create the Order shell without order lines
        TripletexOrderDto orderShell = TripletexOrderDto.builder()
                .customer(customer)
                .orderDate(today)
                .deliveryDate(today)
                .ourContactEmployee(EmployeeDto.builder().id(defaultAccountManagerId).build())
                .currency(CurrencyDto.builder().id(defaultCurrencyId).build())
                .invoicesDueIn(defaultInvoicesDueInDays)
                .invoicesDueInType("DAYS")
                .orderLineSorting("PRODUCT")
                .reference(project.getTitle())
                .orderLines(null) // Explicitly set to null; lines are added in a second call.
                .build();

        TripletexResponseDto<TripletexOrderDto> orderShellResponse = post("/v2/order", orderShell, new ParameterizedTypeReference<>() {});
        TripletexOrderDto createdOrderShell = orderShellResponse.getValue();
        log.info("Successfully created order shell with ID: {}", createdOrderShell.getId());

        // Step 2: Add order lines to the newly created order
        addOrderLinesToOrder(createdOrderShell.getId(), project, customer, products);

        return createdOrderShell;
    }

    private void addOrderLinesToOrder(Integer orderId, Project project, TripletexCustomerDto customer, List<TripletexProductDto> products) {
        log.info("Adding order lines to order ID: {}", orderId);
        List<TripletexOrderLineDto> orderLines = new ArrayList<>();

        List<no.nks.entity.ProjectService> projectServices = project.getProjectServices().stream().toList();

        for (int i = 0; i < projectServices.size(); i++) {
            var projectService = projectServices.get(i);
            var productDto = products.get(i);
            var service = projectService.getService();

            BigDecimal price = new BigDecimal(projectService.getPrice() != null ? projectService.getPrice() : service.getRate());
            BigDecimal quantity = new BigDecimal(projectService.getQuantity() != null ? projectService.getQuantity() : 1);

            TripletexOrderDto orderForLine = new TripletexOrderDto();
            orderForLine.setId(orderId);
            orderForLine.setCustomer(customer); // Original request includes customer in the order line request

            orderLines.add(TripletexOrderLineDto.builder()
                    .product(productDto)
                    .count(quantity)
                    .unitPriceExcludingVatCurrency(price)
                    .unitCostCurrency(price) // Assuming cost is same as price
                    .vatType(VatTypeDto.builder().id(defaultVatTypeId).build())
                    .order(orderForLine) // Nesting the order reference
                    .build());
        }

        // Bulk add endpoint.
        post("/v2/order/orderline/list", orderLines, new ParameterizedTypeReference<TripletexOrderLineListResponseDto>() {});
        log.info("Successfully added {} order lines to order ID: {}", orderLines.size(), orderId);
    }

    @Override
    public WrapperProjectInvoiceDataDto getInvoiceDetails(Integer projectId) {
        // TODO: 需对接真实 Tripletex 环境做集成测试
        // 真实实现：GET /v2/invoice/{id}。此处 {id} 取 project.invoiceTripletexID
        // （createTripletexOrderFromProject 回写的 order/invoice 引用）。
        // 由于当前环境无法联网验证 Tripletex 返回结构，字段映射（amount/invoiceNumber 等）需在集成测试中校准。
        log.info("Fetching invoice details for project ID: {}", projectId);

        Project project = projectRepository.findByIdWithDetailsForTripletex(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found with id: " + projectId));

        String invoiceId = project.getInvoiceTripletexID();
        if (invoiceId == null || invoiceId.isBlank()) {
            log.warn("Project {} has no Tripletex invoice id yet.", projectId);
            return WrapperProjectInvoiceDataDto.builder()
                    .projectInvoiceDataENT(ProjectInvoiceDataDto.builder()
                            .projectId(projectId)
                            .build())
                    .build();
        }

        String url = "/v2/invoice/" + invoiceId;
        ResponseEntity<TripletexResponseDto<Map<String, Object>>> response = restTemplate.exchange(
                baseUrl + url, HttpMethod.GET, new HttpEntity<>(createAuthHeaders()),
                new ParameterizedTypeReference<>() {});

        Map<String, Object> invoice = Optional.ofNullable(response.getBody())
                .map(TripletexResponseDto::getValue)
                .orElse(Collections.emptyMap());

        Double amount = invoice.get("amount") != null
                ? Double.valueOf(String.valueOf(invoice.get("amount")))
                : null;
        String invoiceNumber = invoice.get("invoiceNumber") != null
                ? String.valueOf(invoice.get("invoiceNumber"))
                : null;

        ProjectInvoiceDataDto invoiceData = ProjectInvoiceDataDto.builder()
                .projectId(projectId)
                .invoiceDetails(invoiceNumber != null ? "Tripletex invoice " + invoiceNumber : "Tripletex invoice " + invoiceId)
                .amount(amount)
                .build();

        return WrapperProjectInvoiceDataDto.builder()
                .projectInvoiceDataENT(invoiceData)
                .build();
    }

    @Override
    public RequestResponse sendInvoice(Integer projectId) {
        // TODO: 需对接真实 Tripletex 环境做集成测试
        // 真实实现：PUT /v2/invoice/{id}/:send?sendType=EMAIL 触发发票发送。
        // {id} 取 project.invoiceTripletexID。sendType 及端点细节需在集成测试中确认。
        log.info("Sending invoice for project ID: {}", projectId);
        try {
            Project project = projectRepository.findByIdWithDetailsForTripletex(projectId)
                    .orElseThrow(() -> new RuntimeException("Project not found with id: " + projectId));

            String invoiceId = project.getInvoiceTripletexID();
            if (invoiceId == null || invoiceId.isBlank()) {
                return new RequestResponse(false, "Project has no Tripletex invoice id to send.");
            }

            String url = "/v2/invoice/" + invoiceId + "/:send?sendType=EMAIL";
            restTemplate.exchange(baseUrl + url, HttpMethod.PUT, new HttpEntity<>(createAuthHeaders()), Void.class);

            log.info("Invoice {} for project {} sent to Tripletex.", invoiceId, projectId);
            return new RequestResponse(true, "Invoice sent successfully to Tripletex.");
        } catch (Exception e) {
            log.error("Error sending invoice for project {}", projectId, e);
            return new RequestResponse(false, "Error sending invoice in Tripletex: " + e.getMessage());
        }
    }

    // --- HTTP Helper Methods ---

    private <T, B> T post(String path, B body, ParameterizedTypeReference<T> typeRef) {
        String url = baseUrl + path;
        HttpEntity<B> entity = new HttpEntity<>(body, createAuthHeaders());
        ResponseEntity<T> response = restTemplate.exchange(url, HttpMethod.POST, entity, typeRef);
        return response.getBody();
    }

    private <B> void put(String path, B body) {
        String url = baseUrl + path;
        HttpEntity<B> entity = new HttpEntity<>(body, createAuthHeaders());
        restTemplate.exchange(url, HttpMethod.PUT, entity, Void.class);
    }

    /**
     * 返回一个有效的 session token；若缓存不存在或已过期（含安全余量），则线程安全地重新创建。
     */
    private String getValidSessionToken() {
        CachedSessionToken cached = sessionTokenCache.get();
        if (cached != null && cached.isValid()) {
            return cached.token();
        }

        synchronized (sessionLock) {
            // 双检：可能已有其它线程刷新完成。
            CachedSessionToken current = sessionTokenCache.get();
            if (current != null && current.isValid()) {
                return current.token();
            }
            CachedSessionToken fresh = createSessionToken();
            sessionTokenCache.set(fresh);
            return fresh.token();
        }
    }

    /**
     * 调用 Tripletex 创建新的 session token。
     * 现代化点：不再使用旧代码里写死的初始 auth（0:50d19a6b-...），
     * 改用配置的 consumerToken/employeeToken 走标准 session 创建流程。
     */
    private CachedSessionToken createSessionToken() {
        log.info("No valid session token cached. Requesting a new one from Tripletex.");
        String url = baseUrl + "/v2/token/session/:create";
        LocalDate requestedExpiration = LocalDate.now().plusDays(sessionExpirationDays);
        String expirationDate = requestedExpiration.format(DateTimeFormatter.ISO_LOCAL_DATE);

        String fullUrl = String.format("%s?consumerToken=%s&employeeToken=%s&expirationDate=%s",
                url, consumerToken, employeeToken, expirationDate);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Void> entity = new HttpEntity<>(headers);

        try {
            ResponseEntity<SessionTokenResponseDto> response = restTemplate.exchange(
                    fullUrl, HttpMethod.PUT, entity, SessionTokenResponseDto.class);

            SessionToken value = Objects.requireNonNull(response.getBody()).getValue();
            String token = value.getToken();

            // 依据返回的 expirationDate 推导本地过期时刻，并预留安全余量提前刷新。
            LocalDate expiryDate = value.getExpirationDate() != null && !value.getExpirationDate().isBlank()
                    ? LocalDate.parse(value.getExpirationDate(), DateTimeFormatter.ISO_LOCAL_DATE)
                    : requestedExpiration;
            Instant expiresAt = expiryDate.atTime(23, 59, 59)
                    .atZone(ZoneId.systemDefault())
                    .toInstant()
                    .minusSeconds(sessionSafetyMarginMinutes * 60);

            log.info("Successfully obtained new Tripletex session token (expires around {}).", expiresAt);
            return new CachedSessionToken(token, expiresAt);
        } catch (Exception e) {
            log.error("Failed to create Tripletex session token", e);
            throw new RuntimeException("Could not authenticate with Tripletex", e);
        }
    }

    private HttpHeaders createAuthHeaders() {
        String token = getValidSessionToken();
        String authString = companyId + ":" + token;
        String encodedAuth = Base64.getEncoder().encodeToString(authString.getBytes(StandardCharsets.ISO_8859_1));

        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Basic " + encodedAuth);
        headers.setContentType(MediaType.APPLICATION_JSON);
        return headers;
    }
}
