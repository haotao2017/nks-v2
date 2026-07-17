package no.nks.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import no.nks.dto.RequestResponse;
import no.nks.dto.WrapperMultiWorkflowCategory;
import no.nks.dto.WrapperMultiWorkflowCategorySteps;
import no.nks.dto.WrapperWorkflowCategory;
import no.nks.dto.WrapperWorkflowCategoryStep;
import no.nks.entity.User;
import no.nks.service.WorkflowCategoryService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/WorkflowCategory")
@RequiredArgsConstructor
@Slf4j
public class WorkflowCategoryController {

    private final WorkflowCategoryService workflowCategoryService;

    // 工作流类别相关接口

    @GetMapping("/GetWorkflowCategory")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getWorkflowCategory(@RequestParam("WorkflowCategoryID") Integer workflowCategoryId, @AuthenticationPrincipal User user) {
        log.info("Received request to get workflow category with ID: {} by user: {}", workflowCategoryId, user.getUsername());

        WrapperWorkflowCategory response = workflowCategoryService.getSingleWorkflowCategory(workflowCategoryId);

        log.info("Successfully retrieved workflow category with ID: {}", workflowCategoryId);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/UpdateWorkflowCategory")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> updateWorkflowCategory(@Valid @RequestBody WrapperWorkflowCategory request, @AuthenticationPrincipal User user) {
        log.info("Received request to update workflow category with ID: {}",
                 request.getWorkflowCategory() != null ? request.getWorkflowCategory().getId() : "null_in_request");

        // 验证是否为系统所有者公司(CompanyID=1)
        if (user.getCompanyID() == null || user.getCompanyID() != 1) {
            log.warn("User {} with CompanyID {} attempted to update workflow category without proper permissions.", user.getUsername(), user.getCompanyID());
            return ResponseEntity.badRequest().body(new RequestResponse(false, "只有系统所有者公司才能执行此操作"));
        }

        WrapperWorkflowCategory response = workflowCategoryService.updateSingleWorkflowCategory(request.getWorkflowCategory());

        log.info("Successfully updated workflow category with ID: {}", request.getWorkflowCategory().getId());
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/DeleteWorkflowCategory")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> deleteWorkflowCategory(@RequestParam("WorkflowCategoryID") Integer workflowCategoryId, @AuthenticationPrincipal User user) {
        log.info("Received request to delete workflow category with ID: {}", workflowCategoryId);

        // 验证是否为系统所有者公司(CompanyID=1)
        if (user.getCompanyID() == null || user.getCompanyID() != 1) {
            log.warn("User {} with CompanyID {} attempted to delete workflow category without proper permissions.", user.getUsername(), user.getCompanyID());
            return ResponseEntity.badRequest().body(new RequestResponse(false, "只有系统所有者公司才能执行此操作"));
        }

        RequestResponse response = workflowCategoryService.deleteSingleWorkflowCategory(workflowCategoryId);

        if (!response.isSuccess()) {
            log.warn("Failed to delete workflow category with ID: {}, reason: {}", workflowCategoryId, response.getMessage());
            return ResponseEntity.badRequest().body(response);
        }

        log.info("Successfully deleted workflow category with ID: {}", workflowCategoryId);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/CreatWorkflowCategory")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> creatWorkflowCategory(@Valid @RequestBody WrapperWorkflowCategory request, @AuthenticationPrincipal User user) {
        log.info("Received request to create new workflow category");

        // 验证是否为系统所有者公司(CompanyID=1)
        if (user.getCompanyID() == null || user.getCompanyID() != 1) {
            log.warn("User {} with CompanyID {} attempted to create workflow category without proper permissions.", user.getUsername(), user.getCompanyID());
            return ResponseEntity.badRequest().body(new RequestResponse(false, "只有系统所有者公司才能执行此操作"));
        }

        WrapperWorkflowCategory response = workflowCategoryService.createSingleWorkflowCategory(request.getWorkflowCategory());

        log.info("Successfully created new workflow category with ID: {}", response.getWorkflowCategory().getId());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/GetAllWorkflowCategory")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getAllWorkflowCategory(@AuthenticationPrincipal User user) {
        log.info("Received request to get all workflow categories by user: {}", user.getUsername());

        WrapperMultiWorkflowCategory response = workflowCategoryService.getAllWorkflowCategory();

        log.info("Successfully retrieved {} workflow categories",
                 response.getMultiWorkflowCategory() != null ? response.getMultiWorkflowCategory().size() : 0);
        return ResponseEntity.ok(response);
    }

    // 工作流类别步骤相关接口

    @GetMapping("/GetWorkflowCategoryStepsForOneWorkflow")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getWorkflowCategoryStepsForOneWorkflow(@RequestParam("WorkflowCategoryID") Integer workflowCategoryId, @AuthenticationPrincipal User user) {
        log.info("Received request to get workflow category steps for category ID: {} by user: {}", workflowCategoryId, user.getUsername());

        WrapperMultiWorkflowCategorySteps response = workflowCategoryService.getSingleWorkflowCategoryStepsForOneWorkflow(workflowCategoryId);

        log.info("Successfully retrieved workflow category steps for category ID: {}", workflowCategoryId);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/CreatWorkflowCategoryStep")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> creatWorkflowCategoryStep(@Valid @RequestBody WrapperWorkflowCategoryStep request, @AuthenticationPrincipal User user) {
        log.info("Received request to create new workflow category step for category ID: {}",
                 request.getWorkflowCategoryStep() != null ? request.getWorkflowCategoryStep().getWorkflowCategoryId() : "null_in_request");

        // 验证是否为系统所有者公司(CompanyID=1)
        if (user.getCompanyID() == null || user.getCompanyID() != 1) {
            log.warn("User {} with CompanyID {} attempted to create workflow category step without proper permissions.", user.getUsername(), user.getCompanyID());
            return ResponseEntity.badRequest().body(new RequestResponse(false, "只有系统所有者公司才能执行此操作"));
        }

        WrapperWorkflowCategoryStep response = workflowCategoryService.createSingleWorkflowCategoryStep(request.getWorkflowCategoryStep());

        log.info("Successfully created new workflow category step with ID: {}", response.getWorkflowCategoryStep().getId());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/GetSingleWorkflowCategoryStep")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getSingleWorkflowCategoryStep(@RequestParam("WorkflowCategoryStepID") Integer workflowCategoryStepId, @AuthenticationPrincipal User user) {
        log.info("Received request to get workflow category step with ID: {} by user: {}", workflowCategoryStepId, user.getUsername());

        WrapperWorkflowCategoryStep response = workflowCategoryService.getSingleWorkflowCategoryStep(workflowCategoryStepId);

        log.info("Successfully retrieved workflow category step with ID: {}", workflowCategoryStepId);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/UpdateSingleWorkflowCategoryStep")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> updateSingleWorkflowCategoryStep(@Valid @RequestBody WrapperWorkflowCategoryStep request, @AuthenticationPrincipal User user) {
        log.info("Received request to update workflow category step with ID: {}",
                 request.getWorkflowCategoryStep() != null ? request.getWorkflowCategoryStep().getId() : "null_in_request");

        // 验证是否为系统所有者公司(CompanyID=1)
        if (user.getCompanyID() == null || user.getCompanyID() != 1) {
            log.warn("User {} with CompanyID {} attempted to update workflow category step without proper permissions.", user.getUsername(), user.getCompanyID());
            return ResponseEntity.badRequest().body(new RequestResponse(false, "只有系统所有者公司才能执行此操作"));
        }

        WrapperWorkflowCategoryStep response = workflowCategoryService.updateSingleWorkflowCategoryStep(request.getWorkflowCategoryStep());

        log.info("Successfully updated workflow category step with ID: {}", request.getWorkflowCategoryStep().getId());
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/DeleteWorkflowCategoryStep")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> deleteWorkflowCategoryStep(@RequestParam("WorkflowCategoryStepID") Integer workflowCategoryStepId, @AuthenticationPrincipal User user) {
        log.info("Received request to delete workflow category step with ID: {}", workflowCategoryStepId);

        // 验证是否为系统所有者公司(CompanyID=1)
        if (user.getCompanyID() == null || user.getCompanyID() != 1) {
            log.warn("User {} with CompanyID {} attempted to delete workflow category step without proper permissions.", user.getUsername(), user.getCompanyID());
            return ResponseEntity.badRequest().body(new RequestResponse(false, "只有系统所有者公司才能执行此操作"));
        }

        RequestResponse response = workflowCategoryService.deleteSingleWorkflowCategoryStep(workflowCategoryStepId);

        if (!response.isSuccess()) {
            log.warn("Failed to delete workflow category step with ID: {}, reason: {}", workflowCategoryStepId, response.getMessage());
            return ResponseEntity.badRequest().body(response);
        }

        log.info("Successfully deleted workflow category step with ID: {}", workflowCategoryStepId);
        return ResponseEntity.ok(response);
    }
}
