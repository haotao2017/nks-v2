package no.nks.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import no.nks.dto.RequestResponse;
import no.nks.dto.WrapperMultiService;
import no.nks.dto.WrapperService;
import no.nks.entity.User;
import no.nks.service.ServiceService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

/**
 * 服务控制器，处理服务相关API
 * 对应C#版本的ServiceController
 */
@RestController
@RequestMapping("/api/Service")
@RequiredArgsConstructor
@Slf4j
public class ServiceController {

    private final ServiceService serviceService;

    /**
     * 获取单个服务
     * 对应C#版本的GetService方法
     */
    @GetMapping("/GetService")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getService(@RequestParam("ServiceID") Integer serviceId, @AuthenticationPrincipal User user) {
        log.info("收到获取服务请求，ServiceID: {}, 用户: {}", serviceId, user.getUsername());

        // 获取服务
        WrapperService response = serviceService.getSingleService(serviceId);

        log.info("成功获取ID为{}的服务", serviceId);
        return ResponseEntity.ok(response);
    }

    /**
     * 更新服务
     * 对应C#版本的UpdateService方法
     */
    @PutMapping("/UpdateService")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> updateService(@RequestBody WrapperService param, @AuthenticationPrincipal User user) {
        log.info("收到更新服务请求，ServiceID: {}, 用户: {}",
                param.getService() != null ? param.getService().getId() : "null_in_request",
                user.getUsername());

        // 更新服务
        WrapperService response = serviceService.updateSingleService(param.getService());

        log.info("成功更新ID为{}的服务", param.getService().getId());
        return ResponseEntity.ok(response);
    }

    /**
     * 删除服务
     * 对应C#版本的DeleteService方法
     */
    @DeleteMapping("/DeleteService")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> deleteService(@RequestParam("ServiceID") Integer serviceId, @AuthenticationPrincipal User user) {
        log.info("收到删除服务请求，ServiceID: {}, 用户: {}", serviceId, user.getUsername());

        // 删除服务
        RequestResponse response = serviceService.deleteSingleService(serviceId);

        if (!response.isSuccess()) {
            log.warn("删除服务{}失败: {}", serviceId, response.getMessage());
            return ResponseEntity.badRequest().body(response);
        }

        log.info("成功删除ID为{}的服务", serviceId);
        return ResponseEntity.ok(response);
    }

    /**
     * 创建服务
     * 对应C#版本的CreateService方法
     */
    @PostMapping("/CreateService")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> createService(@RequestBody WrapperService param, @AuthenticationPrincipal User user) {
        log.info("收到创建服务请求，用户: {}", user.getUsername());

        // 设置公司信息上下文
        RequestResponse.CompanyInfo companyInfo = new RequestResponse.CompanyInfo();
        companyInfo.setCompanyID(user.getCompanyID());

        try {
            serviceService.setDataCompany(companyInfo);

            // 创建服务 - 传递服务名称作为第二个参数
            String serviceName = param.getService().getName(); // 从ServiceDto中获取服务名称
            WrapperService response = serviceService.createSingleService(param.getService(), serviceName);

            log.info("成功创建ID为{}的服务", response.getService().getId());
            return ResponseEntity.ok(response);
        } finally {
            serviceService.clearDataCompany();
        }
    }

    /**
     * 获取所有服务
     * 对应C#版本的GetAllService方法
     */
    @GetMapping("/GetAllService")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getAllService(
            @RequestParam(value = "PageNo", defaultValue = "0") Integer pageNo,
            @RequestParam(value = "SearchByName", required = false) String searchByName,
            @RequestParam(value = "SearchByDescription", required = false) String searchByDescription,
            @AuthenticationPrincipal User user) {

        // 使用简化的日志，减少I/O操作
        log.info("获取服务列表: page={}, name={}, desc={}, user={}",
                pageNo, searchByName, searchByDescription, user.getUsername());

        try {
            // 设置公司信息上下文
            RequestResponse.CompanyInfo companyInfo = new RequestResponse.CompanyInfo();
            companyInfo.setCompanyID(user.getCompanyID());

            serviceService.setDataCompany(companyInfo);

            // 获取所有服务
            WrapperMultiService response = serviceService.getAllService(pageNo, searchByName, searchByDescription);

            // 响应大小日志（仅在调试级别记录）
            if (log.isDebugEnabled()) {
                log.debug("服务列表响应记录数: {}",
                        response.getMultiService() != null ? response.getMultiService().size() : 0);
            }

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            // 控制器中捕获异常但不处理，让全局异常处理器统一处理
            log.error("获取服务列表时En feil oppstod: {}", e.getMessage());
            throw e;
        } finally {
            serviceService.clearDataCompany();
        }
    }
}
