package no.nks.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import no.nks.dto.RequestResponse;
import no.nks.dto.workflow.ProjectWorkflowDto;
import no.nks.dto.workflow.WrapperMultiProjectWorkflowDto;
import no.nks.dto.workflow.WrapperProjectInvoiceDataDto;
import no.nks.dto.workflow.WrapperProjectWorkflowDto;
import no.nks.entity.User;
import no.nks.service.ProjectWorkflowService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/ProjectWorkflow")
@RequiredArgsConstructor
@Slf4j
public class ProjectWorkflowController {

    private final ProjectWorkflowService projectWorkflowService;
    private final ObjectMapper objectMapper;

    @GetMapping("/GetProjectWorkflowStep")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<WrapperMultiProjectWorkflowDto> getProjectWorkflowStep(
            @RequestParam Integer ProjectID,
            @RequestParam Integer WorkflowID,
            @RequestParam Integer WorkflowStepID,
            @AuthenticationPrincipal User user) {

        // In the original C# code there's token validation
        // In Spring Security this is handled by the @PreAuthorize annotation

        WrapperMultiProjectWorkflowDto result = projectWorkflowService.getProjectWorkflowStep(
                ProjectID, WorkflowID, WorkflowStepID);

        return ResponseEntity.ok(result);
    }

    @GetMapping("/GetProjectWorkflowCompletedTransferedSteps")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<WrapperMultiProjectWorkflowDto> getProjectWorkflowCompletedTransferedSteps(
            @RequestParam Integer ProjectID,
            @RequestParam Integer WorkflowID,
            @AuthenticationPrincipal User user) {

        WrapperMultiProjectWorkflowDto result = projectWorkflowService.getProjectWorkflowCompletedTransferedSteps(
                ProjectID, WorkflowID);

        return ResponseEntity.ok(result);
    }

    @PostMapping("/GetProjectWFOneEmailFormated")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<WrapperProjectWorkflowDto> getProjectWFOneEmailFormated(
            @RequestBody WrapperProjectWorkflowDto param,
            @AuthenticationPrincipal User user) {

        // Set the user ID from authenticated user
        if (user != null && param.getProjectWorkflow() != null) {
            param.getProjectWorkflow().setInsertedBy(user.getId());
        }

        // 确保有必要的三元组字段
        ProjectWorkflowDto projectWorkflow = ensureWorkflowIdentifiers(param.getProjectWorkflow());

        WrapperProjectWorkflowDto result = projectWorkflowService.getProjectWFOneEmailFormated(
                projectWorkflow);

        return ResponseEntity.ok(result);
    }

    @PostMapping("/ProjectWFOne")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<RequestResponse> projectWFOne(
            @RequestBody WrapperProjectWorkflowDto param,
            @AuthenticationPrincipal User user) {

        if (user == null || user.getCompanyID() == null) {
            RequestResponse response = new RequestResponse();
            response.setSuccess(false);
            response.setMessage("User or company information is missing.");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
        }

        if (param.getProjectWorkflow() != null) {
            param.getProjectWorkflow().setInsertedBy(user.getId());
        }

        // 确保有必要的三元组字段
        ProjectWorkflowDto projectWorkflow = ensureWorkflowIdentifiers(param.getProjectWorkflow());

        RequestResponse result = projectWorkflowService.projectWFOne(projectWorkflow, user.getCompanyID());

        return ResponseEntity.ok(result);
    }

    @PostMapping("/GetProjectWFTwoEmailFormated")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<WrapperProjectWorkflowDto> getProjectWFTwoEmailFormated(
            @RequestBody WrapperProjectWorkflowDto param,
            @AuthenticationPrincipal User user) {

        // Set the user ID from authenticated user
        if (user != null && param.getProjectWorkflow() != null) {
            param.getProjectWorkflow().setInsertedBy(user.getId());
        }

        // 确保有必要的三元组字段
        ProjectWorkflowDto projectWorkflow = ensureWorkflowIdentifiers(param.getProjectWorkflow());

        WrapperProjectWorkflowDto result = projectWorkflowService.getProjectWFTwoEmailFormated(
                projectWorkflow);

        return ResponseEntity.ok(result);
    }

    @PostMapping("/ProjectWFTwo")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<RequestResponse> projectWFTwo(
            @RequestParam String request,
            @RequestParam(required = false) MultipartFile file,
            @AuthenticationPrincipal User user) {

        try {
            if (user == null || user.getCompanyID() == null) {
                RequestResponse response = new RequestResponse();
                response.setSuccess(false);
                response.setMessage("User or company information is missing.");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
            }

            WrapperProjectWorkflowDto param = objectMapper.readValue(request, WrapperProjectWorkflowDto.class);

            if (param.getProjectWorkflow() != null) {
                param.getProjectWorkflow().setInsertedBy(user.getId());
            }

            // 确保有必要的三元组字段
            ProjectWorkflowDto projectWorkflow = ensureWorkflowIdentifiers(param.getProjectWorkflow());

            RequestResponse result = projectWorkflowService.projectWFTwo(projectWorkflow, file, user.getCompanyID());

            return ResponseEntity.ok(result);
        } catch (Exception e) {
            RequestResponse errorResponse = new RequestResponse();
            errorResponse.setSuccess(false);
            errorResponse.setMessage("Error processing request: " + e.getMessage());
            return ResponseEntity.ok(errorResponse);
        }
    }

    @PostMapping("/ProjectWFThree")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<RequestResponse> projectWFThree(
            @RequestParam("request") String requestJson,
            @RequestParam(name = "files", required = false) List<MultipartFile> files,
            @AuthenticationPrincipal User user) {

        try {
            WrapperProjectWorkflowDto wrapperDto = objectMapper.readValue(requestJson, WrapperProjectWorkflowDto.class);
            wrapperDto.getProjectWorkflow().setInsertedBy(user.getId());

            // 确保有必要的三元组字段
            ProjectWorkflowDto projectWorkflow = ensureWorkflowIdentifiers(wrapperDto.getProjectWorkflow());

            RequestResponse response = projectWorkflowService.projectWFThree(projectWorkflow, files, user.getCompanyID());

            return ResponseEntity.ok(response);
        } catch (IOException e) {
            log.error("Failed to deserialize request JSON for ProjectWFThree: {}", requestJson, e);
            RequestResponse errorResponse = new RequestResponse();
            errorResponse.setSuccess(false);
            errorResponse.setMessage("Invalid request format.");
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }

    @PostMapping("/GetProjectWFThree")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<WrapperProjectWorkflowDto> getProjectWFThree(
            @RequestBody WrapperProjectWorkflowDto param,
            @AuthenticationPrincipal User user) {
        ProjectWorkflowDto projectWorkflow = param.getProjectWorkflow();
        if (projectWorkflow == null) {
            return ResponseEntity.badRequest().build();
        }

        if (user != null) {
            projectWorkflow.setInsertedBy(user.getId());
        }

        projectWorkflow = ensureWorkflowIdentifiers(projectWorkflow);

        WrapperProjectWorkflowDto data = projectWorkflowService.getProjectWFThree(projectWorkflow);

        return ResponseEntity.ok(data);
    }

    @PostMapping("/GetProjectWFFourEmailFormated")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<WrapperProjectWorkflowDto> getProjectWFFourEmailFormated(
            @RequestBody WrapperProjectWorkflowDto param,
            @AuthenticationPrincipal User user) {

        // Set the user ID from authenticated user
        if (user != null && param.getProjectWorkflow() != null) {
            param.getProjectWorkflow().setInsertedBy(user.getId());
        }

        // 确保有必要的三元组字段
        ProjectWorkflowDto projectWorkflow = ensureWorkflowIdentifiers(param.getProjectWorkflow());

        WrapperProjectWorkflowDto result = projectWorkflowService.getProjectWFFourEmailFormated(
                projectWorkflow);

        return ResponseEntity.ok(result);
    }

    @PostMapping("/ProjectWFFour")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<RequestResponse> projectWFFour(@RequestBody WrapperProjectWorkflowDto wrapperDto, @AuthenticationPrincipal User user) {
        ProjectWorkflowDto projectWorkflow = wrapperDto.getProjectWorkflow();
        Integer companyId = null;
        if (user != null) {
            projectWorkflow.setInsertedBy(user.getId());
            companyId = user.getCompanyID();
        }

        // 确保有必要的三元组字段
        projectWorkflow = ensureWorkflowIdentifiers(projectWorkflow);

        RequestResponse data = projectWorkflowService.projectWFFour(projectWorkflow, companyId);

        return ResponseEntity.ok(data);
    }

    @PostMapping("/ProjectWFFive")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<RequestResponse> projectWFFive(@RequestBody WrapperProjectWorkflowDto wrapperDto, @AuthenticationPrincipal User user) {
        ProjectWorkflowDto projectWorkflow = wrapperDto.getProjectWorkflow();
        Integer companyId = null;
        if (user != null) {
            projectWorkflow.setInsertedBy(user.getId());
            companyId = user.getCompanyID();
        }

        // 确保有必要的三元组字段
        projectWorkflow = ensureWorkflowIdentifiers(projectWorkflow);

        RequestResponse data = projectWorkflowService.projectWFFive(projectWorkflow, companyId);
        return ResponseEntity.ok(data);
    }

    @PostMapping("/ProjectWFSix")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<RequestResponse> projectWFSix(@RequestBody WrapperProjectWorkflowDto wrapperDto, @AuthenticationPrincipal User user) {
        ProjectWorkflowDto projectWorkflow = wrapperDto.getProjectWorkflow();
        Integer companyId = null;
        if (user != null) {
            projectWorkflow.setInsertedBy(user.getId());
            companyId = user.getCompanyID();
        }

        // 确保有必要的三元组字段
        projectWorkflow = ensureWorkflowIdentifiers(projectWorkflow);

        RequestResponse data = projectWorkflowService.projectWFSix(projectWorkflow, companyId);
        return ResponseEntity.ok(data);
    }

    @PostMapping("/ProjectWFSeven")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<RequestResponse> projectWFSeven(@RequestBody WrapperProjectWorkflowDto wrapperDto, @AuthenticationPrincipal User user) {
        ProjectWorkflowDto projectWorkflow = wrapperDto.getProjectWorkflow();
        Integer companyId = null;
        if (user != null) {
            projectWorkflow.setInsertedBy(user.getId());
            companyId = user.getCompanyID();
        }

        // 确保有必要的三元组字段
        projectWorkflow = ensureWorkflowIdentifiers(projectWorkflow);

        RequestResponse data = projectWorkflowService.projectWFSeven(projectWorkflow, companyId);
        return ResponseEntity.ok(data);
    }

    @PostMapping("/GetProjectWFEightEmailFormated")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<WrapperProjectWorkflowDto> getProjectWFEightEmailFormated(
            @RequestBody WrapperProjectWorkflowDto param,
            @AuthenticationPrincipal User user) {

        // Set the user ID from authenticated user
        if (user != null && param.getProjectWorkflow() != null) {
            param.getProjectWorkflow().setInsertedBy(user.getId());
        }

        // 确保有必要的三元组字段
        ProjectWorkflowDto projectWorkflow = ensureWorkflowIdentifiers(param.getProjectWorkflow());

        WrapperProjectWorkflowDto result = projectWorkflowService.getProjectWFEightEmailFormated(
                projectWorkflow);

        return ResponseEntity.ok(result);
    }

    @PostMapping("/ProjectWFEightTransfer")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<RequestResponse> projectWFEightTransfer(@RequestBody WrapperProjectWorkflowDto wrapperDto, @AuthenticationPrincipal User user) {
        ProjectWorkflowDto projectWorkflow = wrapperDto.getProjectWorkflow();
        if (user != null) {
            projectWorkflow.setInsertedBy(user.getId());
        }

        // 确保有必要的三元组字段
        projectWorkflow = ensureWorkflowIdentifiers(projectWorkflow);

        RequestResponse data = projectWorkflowService.projectWFEightTransfer(projectWorkflow);
        return ResponseEntity.ok(data);
    }

    @PostMapping("/ProjectWFEightSendEmail")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<RequestResponse> projectWFEightSendEmail(@RequestBody WrapperProjectWorkflowDto wrapperDto, @AuthenticationPrincipal User user) {
        ProjectWorkflowDto projectWorkflow = wrapperDto.getProjectWorkflow();
        Integer companyId = null;
        if (user != null) {
            projectWorkflow.setInsertedBy(user.getId());
            companyId = user.getCompanyID();
        }

        // 确保有必要的三元组字段
        projectWorkflow = ensureWorkflowIdentifiers(projectWorkflow);

        RequestResponse data = projectWorkflowService.projectWFEightSendEmail(projectWorkflow, companyId);
        return ResponseEntity.ok(data);
    }

    @PostMapping("/GetProjectWFNineEmailFormated")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<WrapperProjectWorkflowDto> getProjectWFNineEmailFormated(
            @RequestBody WrapperProjectWorkflowDto param,
            @AuthenticationPrincipal User user) {

        // Set the user ID from authenticated user
        if (user != null && param.getProjectWorkflow() != null) {
            param.getProjectWorkflow().setInsertedBy(user.getId());
        }

        // 确保有必要的三元组字段
        ProjectWorkflowDto projectWorkflow = ensureWorkflowIdentifiers(param.getProjectWorkflow());

        WrapperProjectWorkflowDto result = projectWorkflowService.getProjectWFNineEmailFormated(
                projectWorkflow);

        return ResponseEntity.ok(result);
    }

    @PostMapping("/ProjectWFNineTransfer")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<RequestResponse> projectWFNineTransfer(@RequestBody WrapperProjectWorkflowDto wrapperDto, @AuthenticationPrincipal User user) {
        ProjectWorkflowDto projectWorkflow = wrapperDto.getProjectWorkflow();
        if (user != null) {
            projectWorkflow.setInsertedBy(user.getId());
        }

        // 确保有必要的三元组字段
        projectWorkflow = ensureWorkflowIdentifiers(projectWorkflow);

        RequestResponse data = projectWorkflowService.projectWFNineTransfer(projectWorkflow);
        return ResponseEntity.ok(data);
    }

    @PostMapping("/ProjectWFNineSendEmail")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<RequestResponse> projectWFNineSendEmail(@RequestBody WrapperProjectWorkflowDto wrapperDto, @AuthenticationPrincipal User user) {
        ProjectWorkflowDto projectWorkflow = wrapperDto.getProjectWorkflow();
        Integer companyId = null;
        if (user != null) {
            projectWorkflow.setInsertedBy(user.getId());
            companyId = user.getCompanyID();
        }

        // 确保有必要的三元组字段
        projectWorkflow = ensureWorkflowIdentifiers(projectWorkflow);

        RequestResponse data = projectWorkflowService.projectWFNineSendEmail(projectWorkflow, companyId);
        return ResponseEntity.ok(data);
    }

    @PostMapping("/ProjectWFTenTransfer")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<RequestResponse> projectWFTenTransfer(@RequestBody WrapperProjectWorkflowDto wrapperDto, @AuthenticationPrincipal User user) {
        ProjectWorkflowDto projectWorkflow = wrapperDto.getProjectWorkflow();
        if (user != null) {
            projectWorkflow.setInsertedBy(user.getId());
        }

        // 确保有必要的三元组字段
        projectWorkflow = ensureWorkflowIdentifiers(projectWorkflow);

        RequestResponse data = projectWorkflowService.projectWFTenTransfer(projectWorkflow);
        return ResponseEntity.ok(data);
    }

    @PostMapping("/ProjectWFTen")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<RequestResponse> projectWFTen(@RequestBody WrapperProjectWorkflowDto wrapperDto, @AuthenticationPrincipal User user) {
        ProjectWorkflowDto projectWorkflow = wrapperDto.getProjectWorkflow();
        Integer companyId = null;
        if (user != null) {
            projectWorkflow.setInsertedBy(user.getId());
            companyId = user.getCompanyID();
        }

        // 确保有必要的三元组字段
        projectWorkflow = ensureWorkflowIdentifiers(projectWorkflow);

        RequestResponse data = projectWorkflowService.projectWFTen(projectWorkflow, companyId);
        return ResponseEntity.ok(data);
    }

    /**
     * 审阅已完成控制报告
     */
    @PostMapping("/ProjectWFElevenDone")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<RequestResponse> projectWFElevenDone(@RequestBody WrapperProjectWorkflowDto request, @AuthenticationPrincipal User user) {
        log.info("Received request for ProjectWFElevenDone for project ID: {}", request.getProjectWorkflow().getProjectId());
        request.getProjectWorkflow().setInsertedBy(user.getId());

        // 确保有必要的三元组字段
        ProjectWorkflowDto projectWorkflow = ensureWorkflowIdentifiers(request.getProjectWorkflow());

        RequestResponse response = projectWorkflowService.projectWFElevenDone(projectWorkflow);
        return ResponseEntity.ok(response);
    }

    /**
     * 获取格式化的电子邮件内容(步骤12)
     */
    @PostMapping("/GetProjectWFTwelveEmailFormated")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<WrapperProjectWorkflowDto> getProjectWFTwelveEmailFormated(
            @RequestBody WrapperProjectWorkflowDto param,
            @AuthenticationPrincipal User user) {
        if (user != null) {
            param.getProjectWorkflow().setInsertedBy(user.getId());
        }

        // 确保有必要的三元组字段
        ProjectWorkflowDto projectWorkflow = ensureWorkflowIdentifiers(param.getProjectWorkflow());

        WrapperProjectWorkflowDto result = projectWorkflowService.getProjectWFTwelveEmailFormated(projectWorkflow);
        return ResponseEntity.ok(result);
    }

    /**
     * 执行工作流步骤12
     */
    @PostMapping("/ProjectWFTwelve")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<RequestResponse> projectWFTwelve(@RequestBody WrapperProjectWorkflowDto request, @AuthenticationPrincipal User user) {
        log.info("Received request for ProjectWFTwelve for project ID: {}", request.getProjectWorkflow().getProjectId());
        ProjectWorkflowDto dto = request.getProjectWorkflow();
        dto.setInsertedBy(user.getId());

        // 确保有必要的三元组字段
        dto = ensureWorkflowIdentifiers(dto);

        RequestResponse response = projectWorkflowService.projectWFTwelve(dto, user.getCompanyID());
        return ResponseEntity.ok(response);
    }

    /**
     * 获取格式化的电子邮件内容(步骤13)，带PDF
     */
    @PostMapping("/GetProjectWFThirteenEmailFormated")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<WrapperProjectWorkflowDto> getProjectWFThirteenEmailFormated(@RequestBody WrapperProjectWorkflowDto param, @AuthenticationPrincipal User user) throws Exception {

        // Set the user ID from authenticated user
        if (user != null && param.getProjectWorkflow() != null) {
            param.getProjectWorkflow().setInsertedBy(user.getId());
        }

        // 确保有必要的三元组字段
        ProjectWorkflowDto projectWorkflow = ensureWorkflowIdentifiers(param.getProjectWorkflow());

        WrapperProjectWorkflowDto result = projectWorkflowService.getProjectWFThirteenEmailFormated(projectWorkflow);

        return ResponseEntity.ok(result);
    }

    @PostMapping("/ProjectWFThirteen")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<RequestResponse> projectWFThirteen(
            @RequestParam("request") String requestJson,
            @RequestParam(value = "file", required = false) MultipartFile file,
            @AuthenticationPrincipal User user) {
        try {
            WrapperProjectWorkflowDto wrapperDto = objectMapper.readValue(requestJson, WrapperProjectWorkflowDto.class);
            ProjectWorkflowDto dto = wrapperDto.getProjectWorkflow();
            log.info("Received request for ProjectWFThirteen for project ID: {}", dto.getProjectId());
            dto.setInsertedBy(user.getId());

            // 确保有必要的三元组字段
            dto = ensureWorkflowIdentifiers(dto);

            RequestResponse response = projectWorkflowService.projectWFThirteen(dto, file, user.getCompanyID());
            return ResponseEntity.ok(response);
        } catch (IOException e) {
            log.error("Failed to deserialize request JSON for ProjectWFThirteen: {}", requestJson, e);
            RequestResponse errorResponse = new RequestResponse();
            errorResponse.setSuccess(false);
            errorResponse.setMessage("Invalid request format.");
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }

    @PostMapping("/GetProjectWFFourteenEmailFormated")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<WrapperProjectWorkflowDto> getProjectWFFourteenEmailFormated(@RequestBody WrapperProjectWorkflowDto param, @AuthenticationPrincipal User user) throws Exception {

        // Set the user ID from authenticated user
        if (user != null && param.getProjectWorkflow() != null) {
            param.getProjectWorkflow().setInsertedBy(user.getId());
        }

        // 确保有必要的三元组字段
        ProjectWorkflowDto projectWorkflow = ensureWorkflowIdentifiers(param.getProjectWorkflow());

        WrapperProjectWorkflowDto result = projectWorkflowService.getProjectWFFourteenEmailFormated(projectWorkflow);

        return ResponseEntity.ok(result);
    }

    @PostMapping("/ProjectWFFourteen")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<RequestResponse> projectWFFourteen(
            @RequestParam("request") String requestJson,
            @RequestParam(value = "file", required = false) MultipartFile file,
            @AuthenticationPrincipal User user) {
        try {
            WrapperProjectWorkflowDto wrapperDto = objectMapper.readValue(requestJson, WrapperProjectWorkflowDto.class);
            ProjectWorkflowDto dto = wrapperDto.getProjectWorkflow();
            log.info("Received request for ProjectWFFourteen for project ID: {}", dto.getProjectId());
            dto.setInsertedBy(user.getId());

            // 确保有必要的三元组字段
            dto = ensureWorkflowIdentifiers(dto);

            RequestResponse response = projectWorkflowService.projectWFFourteen(dto, file, user.getCompanyID());
            return ResponseEntity.ok(response);
        } catch (IOException e) {
            log.error("Failed to deserialize request JSON for ProjectWFFourteen: {}", requestJson, e);
            RequestResponse errorResponse = new RequestResponse();
            errorResponse.setSuccess(false);
            errorResponse.setMessage("Invalid request format.");
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }

    @PostMapping("/ProjectWFFifteenGetDetails")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<WrapperProjectInvoiceDataDto> projectWFFifteenGetDetails(@RequestBody WrapperProjectWorkflowDto request, @AuthenticationPrincipal User user) {
        log.info("Received request for ProjectWFFifteenGetDetails for project ID: {}", request.getProjectWorkflow().getProjectId());

        // 此方法只需要ProjectId，不需要完整的三元组，但我们仍然验证ProjectId不为空
        ProjectWorkflowDto projectWorkflow = ensureWorkflowIdentifiers(request.getProjectWorkflow());

        WrapperProjectInvoiceDataDto response = projectWorkflowService.projectWFFifteenGetDetails(
                projectWorkflow.getProjectId(), user.getCompanyID());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/ProjectWFFifteen")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<RequestResponse> projectWFFifteen(@RequestBody WrapperProjectWorkflowDto request, @AuthenticationPrincipal User user) {
        log.info("Received request for ProjectWFFifteen for project ID: {}", request.getProjectWorkflow().getProjectId());
        ProjectWorkflowDto dto = request.getProjectWorkflow();
        dto.setInsertedBy(user.getId());

        // 确保有必要的三元组字段
        dto = ensureWorkflowIdentifiers(dto);

        RequestResponse response = projectWorkflowService.projectWFFifteen(dto);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/UpdateProjectWFTwoStepOne")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<RequestResponse> updateProjectWFTwoStepOne(@RequestBody WrapperProjectWorkflowDto param, @AuthenticationPrincipal User user) {
        if (param.getProjectWorkflow() != null) {
            param.getProjectWorkflow().setInsertedBy(user.getId());
        }

        // 确保有必要的三元组字段
        ProjectWorkflowDto projectWorkflow = ensureWorkflowIdentifiers(param.getProjectWorkflow());

        RequestResponse result = projectWorkflowService.updateProjectWFTwoStepOne(projectWorkflow, user.getCompanyID());
        return ResponseEntity.ok(result);
    }

    @PostMapping("/GetProjectWFTwoStepOne")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<WrapperProjectWorkflowDto> getProjectWFTwoStepOne(@RequestBody WrapperProjectWorkflowDto param, @AuthenticationPrincipal User user) {
        if (param.getProjectWorkflow() != null) {
            param.getProjectWorkflow().setInsertedBy(user.getId());
        }

        // 确保有必要的三元组字段
        ProjectWorkflowDto projectWorkflow = ensureWorkflowIdentifiers(param.getProjectWorkflow());

        WrapperProjectWorkflowDto result = projectWorkflowService.getProjectWFTwoStepOne(projectWorkflow, user.getCompanyID());
        return ResponseEntity.ok(result);
    }

    /**
     * 确保ProjectWorkflowDto包含必要的三元组字段(ProjectId, WorkflowId, WorkflowStepId)
     * 这些字段可以唯一确定一个ProjectWorkflow实体，而无需依赖ID
     *
     * @param projectWorkflow 需要验证的ProjectWorkflowDto对象
     * @return 验证后的ProjectWorkflowDto对象
     * @throws IllegalArgumentException 如果缺少必要的三元组字段
     */
    private ProjectWorkflowDto ensureWorkflowIdentifiers(ProjectWorkflowDto projectWorkflow) {
        if (projectWorkflow == null) {
            throw new IllegalArgumentException("ProjectWorkflow is required");
        }

        if (projectWorkflow.getProjectId() == null) {
            throw new IllegalArgumentException("ProjectId is required");
        }

        // WorkflowId和WorkflowStepId可能在某些操作中是可选的，
        // 但在需要它们的操作中应当验证

        return projectWorkflow;
    }
}
