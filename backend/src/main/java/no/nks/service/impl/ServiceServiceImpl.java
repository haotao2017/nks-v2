package no.nks.service.impl;

import lombok.extern.slf4j.Slf4j;
import no.nks.dto.RequestResponse;
import no.nks.dto.ServiceDto;
import no.nks.dto.ServicePerSlabDto;
import no.nks.dto.ServiceWorkflowCategoryDto;
import no.nks.dto.WrapperMultiService;
import no.nks.dto.WrapperService;
import no.nks.entity.Service;
import no.nks.entity.ServicePerSlab;
import no.nks.entity.ServiceWorkflowCategory;
import no.nks.entity.WorkflowCategory;
import no.nks.exception.BusinessException;
import no.nks.repository.ServicePerSlabRepository;
import no.nks.repository.ServiceRepository;
import no.nks.repository.ServiceWorkflowCategoryRepository;
import no.nks.service.ServiceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutionException;
import java.util.stream.Collectors;

@Slf4j
@org.springframework.stereotype.Service
public class ServiceServiceImpl implements ServiceService {

    @Autowired
    private ServiceRepository serviceRepository;

    @Autowired
    private ServicePerSlabRepository servicePerSlabRepository;

    @Autowired
    private ServiceWorkflowCategoryRepository serviceWorkflowCategoryRepository;

    // ThreadLocal avoids race when concurrent requests share this singleton bean
    private static final ThreadLocal<RequestResponse.CompanyInfo> dataCompany = new ThreadLocal<>();

    @Override
    public void setDataCompany(RequestResponse.CompanyInfo companyInfo) {
        dataCompany.set(companyInfo);
    }

    @Override
    public void clearDataCompany() {
        dataCompany.remove();
    }

    private RequestResponse.CompanyInfo getDataCompany() {
        return dataCompany.get();
    }

    /**
     * 获取单个服务
     * 对应C#中的GetSingleService方法
     */
    @Override
    public WrapperService getSingleService(int id) {
        log.info("获取ID为{}的服务", id);

        Service service = serviceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Tjenesten finnes ikke: " + id));

        List<ServicePerSlab> slabs = servicePerSlabRepository.findByServiceId(id);
        List<ServiceWorkflowCategory> categories = serviceWorkflowCategoryRepository.findByServiceId(id);

        WrapperService wrapper = new WrapperService();
        wrapper.setService(convertToDto(service, slabs, categories));

        return wrapper;
    }

    /**
     * 获取所有服务
     * 对应C#中的GetAllService方法
     */
    @Override
    public WrapperMultiService getAllService(int pageNo, String searchByName, String searchByDescription) {
        try {
            log.info("获取服务列表，页码：{}，名称：{}，描述：{}", pageNo, searchByName, searchByDescription);

            Integer companyId = getDataCompany() != null ? getDataCompany().getCompanyID() : null;
            if (companyId == null) {
                throw new BusinessException("Firma-ID er ikke satt");
            }

            // 使用数据库分页和筛选，避免加载所有数据到内存
            List<Service> services;

            // 根据参数构建查询
            if (pageNo > 0) {
                int page = pageNo - 1;
                int size = 10;
                Pageable pageable = PageRequest.of(page, size);

                if (searchByName != null && !searchByName.isEmpty()) {
                    services = serviceRepository.findByNameContainingAndCompanyId(searchByName, companyId, pageable);
                } else if (searchByDescription != null && !searchByDescription.isEmpty()) {
                    services = serviceRepository.findByDescriptionContainingAndCompanyId(searchByDescription, companyId, pageable);
                } else {
                    services = serviceRepository.findByCompanyId(companyId, pageable);
                }
            } else {
                if (searchByName != null && !searchByName.isEmpty()) {
                    services = serviceRepository.findByNameContainingAndCompanyId(searchByName, companyId);
                } else if (searchByDescription != null && !searchByDescription.isEmpty()) {
                    services = serviceRepository.findByDescriptionContainingAndCompanyId(searchByDescription, companyId);
                } else {
                    services = serviceRepository.findByCompanyId(companyId);
                }
            }

            if (services.isEmpty()) {
                log.info("未找到符合条件的服务数据");
                WrapperMultiService emptyWrapper = new WrapperMultiService();
                emptyWrapper.setMultiService(Collections.emptyList());
                return emptyWrapper;
            }

            // 批量获取关联数据，避免N+1查询问题
            // 1. 收集所有服务ID
            List<Integer> serviceIds = services.stream()
                    .map(Service::getId)
                    .collect(Collectors.toList());

            // 2. 一次性获取所有服务的价格区间和工作流类别
            Map<Integer, List<ServicePerSlab>> serviceToSlabs = new HashMap<>();
            Map<Integer, List<ServiceWorkflowCategory>> serviceToCategories = new HashMap<>();

            if (!serviceIds.isEmpty()) {
                // 使用并行处理加速关联数据查询
                CompletableFuture<List<ServicePerSlab>> slabsFuture = CompletableFuture
                        .supplyAsync(() -> servicePerSlabRepository.findByServiceIdIn(serviceIds));

                CompletableFuture<List<ServiceWorkflowCategory>> categoriesFuture = CompletableFuture
                        .supplyAsync(() -> serviceWorkflowCategoryRepository.findByServiceIdIn(serviceIds));

                // 等待所有异步查询完成
                CompletableFuture.allOf(slabsFuture, categoriesFuture).join();

                try {
                    // 将查询结果按服务ID分组
                    List<ServicePerSlab> allSlabs = slabsFuture.get();
                    for (ServicePerSlab slab : allSlabs) {
                        serviceToSlabs.computeIfAbsent(slab.getServiceId(), k -> new ArrayList<>()).add(slab);
                    }

                    List<ServiceWorkflowCategory> allCategories = categoriesFuture.get();
                    for (ServiceWorkflowCategory category : allCategories) {
                        serviceToCategories.computeIfAbsent(category.getServiceId(), k -> new ArrayList<>()).add(category);
                    }
                } catch (InterruptedException | ExecutionException e) {
                    log.error("获取关联数据时En feil oppstod", e);
                    // 出错时回退到串行查询
                    List<ServicePerSlab> allSlabs = servicePerSlabRepository.findByServiceIdIn(serviceIds);
                    for (ServicePerSlab slab : allSlabs) {
                        serviceToSlabs.computeIfAbsent(slab.getServiceId(), k -> new ArrayList<>()).add(slab);
                    }

                    List<ServiceWorkflowCategory> allCategories = serviceWorkflowCategoryRepository.findByServiceIdIn(serviceIds);
                    for (ServiceWorkflowCategory category : allCategories) {
                        serviceToCategories.computeIfAbsent(category.getServiceId(), k -> new ArrayList<>()).add(category);
                    }
                }
            }

            // 构建DTO - 使用并行流加速处理
            List<ServiceDto> serviceDtos = services.parallelStream()
                    .map(service -> {
                        Integer serviceId = service.getId();
                        List<ServicePerSlab> slabs = serviceToSlabs.getOrDefault(serviceId, Collections.emptyList());
                        List<ServiceWorkflowCategory> categories = serviceToCategories.getOrDefault(serviceId, Collections.emptyList());
                        return convertToDto(service, slabs, categories);
                    })
                    .collect(Collectors.toList());

            WrapperMultiService wrapper = new WrapperMultiService();
            wrapper.setMultiService(serviceDtos);

            return wrapper;
        } catch (BusinessException e) {
            // 直接抛出业务异常，由全局异常处理器处理
            throw e;
        } catch (Exception e) {
            // 记录详细错误并转换为业务异常
            log.error("获取服务列表时En feil oppstod", e);
            throw new BusinessException("Kunne ikke hente tjenester: " + e.getMessage(), e);
        }
    }

    /**
     * 更新单个服务
     * 对应C#中的UpdateSingleService方法
     * 工作流绑定变更会影响项目详情的 projectServiceWorkflowList，需清空项目缓存。
     */
    @Override
    @Transactional
    @CacheEvict(value = "projectCache", allEntries = true)
    public WrapperService updateSingleService(ServiceDto serviceDto) {
        log.info("更新ID为{}的服务", serviceDto.getId());

        // 设置价格策略
        if (serviceDto.getServiceChargedAs() == 1) {
            // 固定价格
            // 保持原样
        } else {
            // 分级价格
            serviceDto.setRate("0");
        }

        // 删除原有的服务分级价格
        servicePerSlabRepository.deleteByServiceId(serviceDto.getId());

        // 保存服务基本信息
        final Service service = serviceRepository.findById(serviceDto.getId())
                .orElseThrow(() -> new RuntimeException("Tjenesten finnes ikke: " + serviceDto.getId()));

        service.setName(serviceDto.getName());
        service.setDescription(serviceDto.getDescription());
        service.setServiceTypeId(serviceDto.getServiceTypeId());
        service.setServiceChargedAs(serviceDto.getServiceChargedAs());
        service.setRate(serviceDto.getRate());
        service.setChecklistTempId(serviceDto.getChecklistTempId());

        final Service savedService = serviceRepository.save(service);

        // 如果是分级价格，添加分级价格信息
        List<ServicePerSlab> slabs = new ArrayList<>();
        if (serviceDto.getServiceChargedAs() == 2 && serviceDto.getServicePerSlabList() != null) {
            slabs = saveServiceSlabs(savedService.getId(), serviceDto.getServicePerSlabList());
        }

        // 处理工作流类别关联
        List<ServiceWorkflowCategory> categories = new ArrayList<>();
        if (serviceDto.getServiceWorkflowCategory() != null) {
            // 删除原有的关联
            serviceWorkflowCategoryRepository.deleteByServiceId(savedService.getId());

            // 创建新的关联 - 传递完整的Service对象
            categories = saveWorkflowCategories(savedService, serviceDto.getServiceWorkflowCategory());
        }

        // 构建返回结果
        WrapperService wrapper = new WrapperService();
        wrapper.setService(convertToDto(savedService, slabs, categories));

        return wrapper;
    }

    /**
     * 创建单个服务
     * 对应C#中的CreateSingleService方法
     */
    @Override
    @Transactional
    @CacheEvict(value = "projectCache", allEntries = true)
    public WrapperService createSingleService(ServiceDto serviceDto, String serviceName) {
        log.info("Creating a new service for company with id: {}", getDataCompany() != null ? getDataCompany().getCompanyID() : null);

        Integer companyId = getDataCompany() != null ? getDataCompany().getCompanyID() : null;
        if (companyId == null) {
            throw new RuntimeException("Firma-ID er ikke satt");
        }

        // 创建新服务
        final Service newService = new Service();
        newService.setName(serviceName);
        newService.setDescription(serviceDto.getDescription());
        newService.setServiceTypeId(serviceDto.getServiceTypeId());
        newService.setServiceChargedAs(serviceDto.getServiceChargedAs());
        newService.setRate(serviceDto.getServiceChargedAs() == 1 ? serviceDto.getRate() : "0");
        newService.setChecklistTempId(serviceDto.getChecklistTempId());
        newService.setCompanyId(companyId);

        final Service savedService = serviceRepository.save(newService);
        serviceDto.setId(savedService.getId());

        // 设置分级价格（如果需要）
        List<ServicePerSlab> slabs = new ArrayList<>();
        if (serviceDto.getServiceChargedAs() == 2 && serviceDto.getServicePerSlabList() != null) {
            slabs = saveServiceSlabs(savedService.getId(), serviceDto.getServicePerSlabList());
        }

        // 设置工作流类别关联
        List<ServiceWorkflowCategory> categories = new ArrayList<>();
        if (serviceDto.getServiceWorkflowCategory() != null) {
            // 设置服务ID
            final Integer finalServiceId = savedService.getId();
            serviceDto.getServiceWorkflowCategory().forEach(cat -> cat.setServiceId(finalServiceId));

            // 保存关联 - 传递完整的Service对象
            categories = saveWorkflowCategories(savedService, serviceDto.getServiceWorkflowCategory());
        }

        // 构建返回结果
        WrapperService wrapper = new WrapperService();
        wrapper.setService(convertToDto(savedService, slabs, categories));

        return wrapper;
    }

    /**
     * 删除单个服务
     * 对应C#中的DeleteSingleService方法
     */
    @Override
    @Transactional
    @CacheEvict(value = "projectCache", allEntries = true)
    public RequestResponse deleteSingleService(int id) {
        log.info("删除ID为{}的服务", id);

        RequestResponse response = new RequestResponse();

        try {
            // 检查服务是否与项目关联
            boolean isAssociated = serviceRepository.checkIfServiceAssociatedWithProject(id);
            if (isAssociated) {
                log.warn("服务{}与项目关联，无法删除", id);
                response.setSuccess(false);
                response.setMessage("Not deleted, Record is used in Project.");
                return response;
            }

            // 删除服务的分级价格
            servicePerSlabRepository.deleteByServiceId(id);

            // 删除服务的工作流类别关联
            serviceWorkflowCategoryRepository.deleteByServiceId(id);

            // 删除服务本身
            serviceRepository.deleteById(id);

            response.setSuccess(true);
            response.setMessage("Record deleted");

        } catch (Exception ex) {
            log.error("删除服务{}时En feil oppstod: {}", id, ex.getMessage(), ex);
            response.setSuccess(false);
            response.setMessage(ex.getMessage());
        }

        return response;
    }

    // 辅助方法：将实体转换为DTO
    private ServiceDto convertToDto(Service service, List<ServicePerSlab> slabs, List<ServiceWorkflowCategory> categories) {
        ServiceDto dto = new ServiceDto();
        dto.setId(service.getId());
        dto.setName(service.getName());
        dto.setDescription(service.getDescription());
        dto.setServiceTypeId(service.getServiceTypeId());
        dto.setServiceChargedAs(service.getServiceChargedAs());
        dto.setRate(service.getRate());
        dto.setChecklistTempId(service.getChecklistTempId());

        // 转换分级价格 - 确保不为null
        if (slabs != null && !slabs.isEmpty()) {
            dto.setServicePerSlabList(slabs.stream()
                    .map(this::convertSlabToDto)
                    .collect(Collectors.toList()));
        } else {
            // 确保返回空列表而不是null
            dto.setServicePerSlabList(new ArrayList<>());
        }

        // 转换工作流类别关联 - 确保不为null
        if (categories != null && !categories.isEmpty()) {
            dto.setServiceWorkflowCategory(categories.stream()
                    .map(this::convertWorkflowCategoryToDto)
                    .collect(Collectors.toList()));
        } else {
            // 与期望格式保持一致，如果没有工作流类别则设置为null
            dto.setServiceWorkflowCategory(null);
        }

        return dto;
    }

    // 辅助方法：将分级价格实体转换为DTO
    private ServicePerSlabDto convertSlabToDto(ServicePerSlab slab) {
        ServicePerSlabDto dto = new ServicePerSlabDto();
        dto.setId(slab.getId());
        dto.setServiceId(slab.getServiceId());
        dto.setRangeFrom(slab.getRangeFrom());
        dto.setRangeTo(slab.getRangeTo());
        dto.setRate(slab.getRate());
        return dto;
    }

    // 辅助方法：将工作流类别关联实体转换为DTO
    private ServiceWorkflowCategoryDto convertWorkflowCategoryToDto(ServiceWorkflowCategory category) {
        ServiceWorkflowCategoryDto dto = new ServiceWorkflowCategoryDto();
        dto.setId(category.getId());
        dto.setServiceId(category.getServiceId());
        dto.setWorkflowCategoryId(category.getWorkflowCategoryId());
        return dto;
    }

    // 辅助方法：保存服务分级价格
    private List<ServicePerSlab> saveServiceSlabs(Integer serviceId, List<ServicePerSlabDto> slabDtos) {
        List<ServicePerSlab> result = new ArrayList<>();

        for (ServicePerSlabDto slabDto : slabDtos) {
            ServicePerSlab slab = new ServicePerSlab();
            slab.setServiceId(serviceId);
            slab.setRangeFrom(slabDto.getRangeFrom());
            slab.setRangeTo(slabDto.getRangeTo());
            slab.setRate(slabDto.getRate());

            slab = servicePerSlabRepository.save(slab);
            slabDto.setId(slab.getId());

            result.add(slab);
        }

        return result;
    }

    // 修改辅助方法：保存工作流类别关联
    private List<ServiceWorkflowCategory> saveWorkflowCategories(Service service, List<ServiceWorkflowCategoryDto> categoryDtos) {
        List<ServiceWorkflowCategory> result = new ArrayList<>();

        for (ServiceWorkflowCategoryDto categoryDto : categoryDtos) {
            ServiceWorkflowCategory category = new ServiceWorkflowCategory();

            // 设置完整的Service对象而不是仅设置ID
            category.setService(service);
            category.setServiceId(service.getId()); // 显式设置serviceId

            // 查找并设置完整的WorkflowCategory对象
            WorkflowCategory workflowCategory = new WorkflowCategory();
            workflowCategory.setId(categoryDto.getWorkflowCategoryId());
            category.setWorkflowCategory(workflowCategory);
            category.setWorkflowCategoryId(categoryDto.getWorkflowCategoryId()); // 显式设置workflowCategoryId

            // 保存实体
            category = serviceWorkflowCategoryRepository.save(category);
            categoryDto.setId(category.getId());
            categoryDto.setServiceId(service.getId()); // 确保DTO也有正确的ID
            categoryDto.setWorkflowCategoryId(categoryDto.getWorkflowCategoryId()); // 确保DTO也有正确的workflowCategoryId

            result.add(category);
        }

        return result;
    }
}
