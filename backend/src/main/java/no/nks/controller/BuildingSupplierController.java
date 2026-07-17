package no.nks.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import no.nks.entity.*;
import no.nks.service.BuildingSupplierService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;

@Slf4j
@RestController
@RequestMapping("/api/BuildingSupplier")
@RequiredArgsConstructor
public class BuildingSupplierController {

    private final BuildingSupplierService buildingSupplierService;

    @GetMapping("/GetBuildingSupplier")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getBuildingSupplier(@RequestParam int BuildingSupplierID, @AuthenticationPrincipal User user) {
        log.info("GET /api/BuildingSupplier/GetBuildingSupplier called with ID: {}", BuildingSupplierID);

        // 验证用户和公司ID
        Integer companyId = validateUserAndGetCompanyId(user, "get building supplier");

        WrapperBuildingSupplier data = buildingSupplierService.getSingleBuildingSupplier(BuildingSupplierID);
        log.info("Successfully retrieved building supplier with ID: {}", BuildingSupplierID);
        return ResponseEntity.ok(data);
    }

    @PutMapping("/UpdateBuildingSupplier")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> updateBuildingSupplier(@Valid @RequestBody WrapperBuildingSupplier userParam, @AuthenticationPrincipal User user) {
        log.info("PUT /api/BuildingSupplier/UpdateBuildingSupplier called");

        // 验证用户和公司ID
        Integer companyId = validateUserAndGetCompanyId(user, "update building supplier");

        // 创建公司包装器
        CompanyWrapper companyWrapper = new CompanyWrapper();
        companyWrapper.setCompanyID(companyId);

        WrapperBuildingSupplier data = buildingSupplierService.updateSingleBuildingSupplier(
            userParam.getBuildingSupplier(), companyWrapper);

        log.info("Successfully updated building supplier with ID: {}", userParam.getBuildingSupplier().getId());
        return ResponseEntity.ok(data);
    }

    @DeleteMapping("/DeleteBuildingSupplier")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> deleteBuildingSupplier(@RequestParam int BuildingSupplierID, @AuthenticationPrincipal User user) {
        log.info("DELETE /api/BuildingSupplier/DeleteBuildingSupplier called with ID: {}", BuildingSupplierID);

        // 验证用户和公司ID
        Integer companyId = validateUserAndGetCompanyId(user, "delete building supplier");

        ResponseBuildingSupplier response = buildingSupplierService.deleteSingleBuildingSupplier(BuildingSupplierID);

        if (!response.getRequestResponse().isSuccess()) {
            log.warn("Building supplier deletion failed for ID: {}. Message: {}",
                BuildingSupplierID, response.getRequestResponse().getMessage());
            return ResponseEntity.badRequest().body(response);
        }

        log.info("Successfully deleted building supplier with ID: {}", BuildingSupplierID);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/CreatBuildingSupplier")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> creatBuildingSupplier(@Valid @RequestBody WrapperBuildingSupplier userParam, @AuthenticationPrincipal User user) {
        log.info("POST /api/BuildingSupplier/CreatBuildingSupplier called");

        // 验证用户和公司ID
        Integer companyId = validateUserAndGetCompanyId(user, "create building supplier");

        // 创建公司包装器
        CompanyWrapper companyWrapper = new CompanyWrapper();
        companyWrapper.setCompanyID(companyId);

        WrapperBuildingSupplier data = buildingSupplierService.createSingleBuildingSupplier(
            userParam.getBuildingSupplier(), companyWrapper);

        log.info("Successfully created building supplier with ID: {}", data.getBuildingSupplier().getId());
        return ResponseEntity.ok(data);
    }

    @GetMapping("/GetAllBuildingSupplier")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getAllBuildingSupplier(@AuthenticationPrincipal User user) {
        log.info("GET /api/BuildingSupplier/GetAllBuildingSupplier called");

        // 验证用户和公司ID
        Integer companyId = validateUserAndGetCompanyId(user, "get all building suppliers");

        // 创建公司包装器
        CompanyWrapper companyWrapper = new CompanyWrapper();
        companyWrapper.setCompanyID(companyId);

        WrapperMultiBuildingSuppliers data = buildingSupplierService.getAllBuildingSupplier(companyWrapper);
        log.info("Successfully retrieved {} building suppliers",
            data.getMultiBuildingSuppliers() != null ? data.getMultiBuildingSuppliers().size() : 0);
        return ResponseEntity.ok(data);
    }

    /**
     * 验证用户并获取公司ID的辅助方法
     *
     * @param user 认证用户
     * @param operation 当前操作描述（用于日志）
     * @return 公司ID
     * @throws AccessDeniedException 如果用户认证失败或公司ID不可用
     */
    private Integer validateUserAndGetCompanyId(User user, String operation) {
        if (user == null) {
            log.warn("User details not available for {} operation", operation);
            throw new AccessDeniedException("User authentication required");
        }

        Integer companyId = user.getCompanyID();
        if (companyId == null) {
            log.warn("CompanyID not available for user: {} during {} operation",
                user.getUsername(), operation);
            throw new AccessDeniedException("User's company ID is required");
        }

        log.info("Request for {} operation made by user: {}, CompanyID: {}",
            operation, user.getUsername(), companyId);
        return companyId;
    }
}
