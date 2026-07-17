package no.nks.controller;

import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.MapperFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import no.nks.dto.ProjectDocumentUploadDto;
import no.nks.dto.RequestResponse;
import no.nks.dto.WrapperProjectDocumentDto;
import no.nks.dto.WrapperProjectDocumentUploadDto;
import no.nks.dto.workflow.ProjectWorkflowDto;
import no.nks.dto.workflow.WrapperProjectWorkflowDto;
import no.nks.entity.User;
import no.nks.service.ProjectDocService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/Project")
@RequiredArgsConstructor
@Slf4j
public class ProjectDocController {

    private final ProjectDocService projectDocService;
    private final ObjectMapper objectMapper;

    // 创建一个大小写不敏感的ObjectMapper
    private final ObjectMapper caseInsensitiveMapper = new ObjectMapper()
            .configure(MapperFeature.ACCEPT_CASE_INSENSITIVE_PROPERTIES, true)
            .configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);

    @PostMapping("/GetProjectInspThirPartyEmailFormated")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<WrapperProjectWorkflowDto> getProjectInspThirPartyEmailFormated(
            @RequestBody WrapperProjectWorkflowDto request,
            @AuthenticationPrincipal User user) {

        if (user == null || user.getCompanyID() == null) {
            throw new AccessDeniedException("User authentication error or CompanyID missing.");
        }

        Integer companyId = user.getCompanyID();
        Integer userId = user.getId();

        WrapperProjectWorkflowDto response = projectDocService.getProjectInspThirPartyEmailFormated(
                request.getProjectWorkflow(), companyId, userId);

        return ResponseEntity.ok(response);
    }

    @PostMapping("/ProjectInspThirPartySendEmail")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<RequestResponse> projectInspThirPartySendEmail(
            @RequestParam("request") String requestJson,
            @RequestParam(value = "file", required = false) MultipartFile file,
            @AuthenticationPrincipal User user) {

        if (user == null || user.getCompanyID() == null) {
            throw new AccessDeniedException("User authentication error or CompanyID missing.");
        }

        try {
            // 从requestJson解析出ProjectWorkflowDto
            WrapperProjectWorkflowDto wrapper = objectMapper.readValue(requestJson, WrapperProjectWorkflowDto.class);
            ProjectWorkflowDto projectWorkflow = wrapper.getProjectWorkflow();

            Integer companyId = user.getCompanyID();
            Integer userId = user.getId();

            if (file == null || file.isEmpty()) {
                return ResponseEntity.badRequest().body(
                        RequestResponse.failure("No file provided"));
            }

            RequestResponse response = projectDocService.sendProjectInspThirPartyEmail(
                    projectWorkflow, file, companyId, userId);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Failed to send project inspection email", e);
            return ResponseEntity.badRequest().body(
                    RequestResponse.failure("Failed to send email: " + e.getMessage()));
        }
    }

    @GetMapping("/ProjectRequiredDocListAllParties")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<WrapperProjectDocumentDto> projectRequiredDocListAllParties(
            @RequestParam Integer projectId,
            @RequestParam Integer workflowId,
            @AuthenticationPrincipal User user) {

        if (user == null || user.getCompanyID() == null) {
            throw new AccessDeniedException("User authentication error or CompanyID missing.");
        }

        Integer companyId = user.getCompanyID();

        WrapperProjectDocumentDto response = projectDocService.getProjectRequiredDocList(
                projectId, workflowId, companyId);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/ProjectRequiredDocListBySingleParty")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<WrapperProjectDocumentDto> projectRequiredDocListBySingleParty(
            @RequestParam Integer projectId,
            @RequestParam Integer workflowId,
            @RequestParam Integer partyId,
            @RequestParam Integer partyTypeId,
            @AuthenticationPrincipal User user) {

        if (user == null || user.getCompanyID() == null) {
            throw new AccessDeniedException("User authentication error or CompanyID missing.");
        }

        Integer companyId = user.getCompanyID();

        WrapperProjectDocumentDto response = projectDocService.getProjectRequiredDocBySingleParty(
                projectId, workflowId, partyId, partyTypeId, companyId);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/ProjectApprovalRequiredDocList")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<WrapperProjectDocumentDto> projectApprovalRequiredDocList(
            @RequestParam Integer projectId,
            @RequestParam Integer workflowId,
            @AuthenticationPrincipal User user) {

        if (user == null || user.getCompanyID() == null) {
            throw new AccessDeniedException("User authentication error or CompanyID missing.");
        }

        Integer companyId = user.getCompanyID();

        WrapperProjectDocumentDto response = projectDocService.getProjectApprovalRequiredDocList(
                projectId, workflowId, companyId);

        return ResponseEntity.ok(response);
    }

    @PostMapping("/ProjectUploadDocument")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<RequestResponse> projectUploadDocument(
            @RequestParam("request") String requestJson,
            @RequestParam(value = "file", required = false) MultipartFile file,
            @AuthenticationPrincipal User user) {

        if (user == null || user.getCompanyID() == null) {
            throw new AccessDeniedException("User authentication error or CompanyID missing.");
        }

        try {
            log.debug("接收到文档上传请求，JSON数据: {}", requestJson);

            // 尝试兼容两种格式：标准Java格式(带projectDocumentUpload)或C#格式(直接属性)
            ProjectDocumentUploadDto uploadDto = null;

            // 首先，直接使用大小写不敏感的映射器尝试解析
            try {
                log.debug("尝试使用大小写不敏感的映射器直接解析JSON");
                uploadDto = caseInsensitiveMapper.readValue(requestJson, ProjectDocumentUploadDto.class);
                log.debug("JSON直接解析成功: {}", uploadDto);
            } catch (Exception e1) {
                log.debug("直接解析失败，尝试包装格式: {}", e1.getMessage());

                try {
                    // 尝试标准Java包装格式
                    WrapperProjectDocumentUploadDto wrapper = caseInsensitiveMapper.readValue(requestJson, WrapperProjectDocumentUploadDto.class);
                    uploadDto = wrapper.getProjectDocumentUpload();
                    log.debug("包装格式解析成功: {}", uploadDto);
                } catch (Exception e2) {
                    log.error("所有格式解析均失败", e2);

                    // 最后尝试手动解析JSON，处理C#风格的字段名
                    try {
                        log.debug("尝试手动解析JSON映射");
                        @SuppressWarnings("unchecked")
                        Map<String, Object> jsonMap = objectMapper.readValue(requestJson, Map.class);
                        log.debug("JSON映射: {}", jsonMap);

                        uploadDto = new ProjectDocumentUploadDto();

                        // 遍历处理projectId字段 - 可能是projectId或ProjectId或ProjectID等
                        for (String key : jsonMap.keySet()) {
                            String lowerKey = key.toLowerCase();

                            if (lowerKey.equals("projectid")) {
                                uploadDto.setProjectId(convertToInteger(jsonMap.get(key)));
                                log.debug("找到projectId: {}", uploadDto.getProjectId());
                            } else if (lowerKey.equals("workflowid")) {
                                uploadDto.setWorkflowId(convertToInteger(jsonMap.get(key)));
                                log.debug("找到workflowId: {}", uploadDto.getWorkflowId());
                            } else if (lowerKey.equals("partyid")) {
                                uploadDto.setPartyId(convertToInteger(jsonMap.get(key)));
                                log.debug("找到partyId: {}", uploadDto.getPartyId());
                            } else if (lowerKey.equals("partytypeid")) {
                                uploadDto.setPartyTypeId(convertToInteger(jsonMap.get(key)));
                                log.debug("找到partyTypeId: {}", uploadDto.getPartyTypeId());
                            } else if (lowerKey.equals("documentypeid") || lowerKey.equals("docuentypeid") || lowerKey.equals("docmentypeid") || lowerKey.equals("docmentypeid")) {
                                uploadDto.setDocumenTypeId(convertToInteger(jsonMap.get(key)));
                                log.debug("找到documentTypeId: {}", uploadDto.getDocumenTypeId());
                            } else if (lowerKey.equals("otherdocs")) {
                                uploadDto.setOtherDocs(convertToInteger(jsonMap.get(key)));
                                log.debug("找到otherDocs: {}", uploadDto.getOtherDocs());
                            }
                        }

                        log.info("手动JSON映射成功: projectId={}, workflowId={}, partyId={}, partyTypeId={}, documenTypeId={}",
                            uploadDto.getProjectId(), uploadDto.getWorkflowId(), uploadDto.getPartyId(),
                            uploadDto.getPartyTypeId(), uploadDto.getDocumenTypeId());
                    } catch (Exception e3) {
                        log.error("手动JSON映射也失败", e3);
                        return ResponseEntity.badRequest().body(
                                RequestResponse.failure("Invalid request format, unable to parse JSON: " + e3.getMessage()));
                    }
                }
            }

            // 打印最终结果
            log.info("最终解析结果: projectId={}, workflowId={}, partyId={}, partyTypeId={}, documenTypeId={}",
                uploadDto != null ? uploadDto.getProjectId() : null,
                uploadDto != null ? uploadDto.getWorkflowId() : null,
                uploadDto != null ? uploadDto.getPartyId() : null,
                uploadDto != null ? uploadDto.getPartyTypeId() : null,
                uploadDto != null ? uploadDto.getDocumenTypeId() : null);

            // 检查uploadDto是否为null，如果为null则创建新对象
            if (uploadDto == null) {
                log.warn("未从请求中解析出ProjectDocumentUploadDto，创建空对象");
                uploadDto = new ProjectDocumentUploadDto();
            }

            // 检查必要字段是否为null
            if (uploadDto.getProjectId() == null) {
                log.error("关键参数projectId为null，无法继续处理");
                return ResponseEntity.badRequest().body(
                        RequestResponse.failure("Project ID is required"));
            }

            if (file == null || file.isEmpty()) {
                return ResponseEntity.badRequest().body(
                        RequestResponse.failure("No file provided"));
            }

            Integer companyId = user.getCompanyID();
            Integer userId = user.getId();

            // 设置上传者ID
            uploadDto.setInsertedBy(userId);

            RequestResponse response = projectDocService.uploadProjectDocument(
                    uploadDto, file, companyId, userId);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("文档上传失败", e);
            return ResponseEntity.badRequest().body(
                    RequestResponse.failure("Failed to upload document: " + e.getMessage()));
        }
    }

    /**
     * 将Object转换为Integer
     */
    private Integer convertToInteger(Object value) {
        if (value == null) {
            return null;
        }
        if (value instanceof Integer) {
            return (Integer) value;
        }
        if (value instanceof Number) {
            return ((Number) value).intValue();
        }
        if (value instanceof String) {
            try {
                return Integer.parseInt((String) value);
            } catch (NumberFormatException e) {
                log.warn("无法将字符串转换为Integer: {}", value);
                return null;
            }
        }
        log.warn("无法将类型{}转换为Integer: {}", value.getClass().getName(), value);
        return null;
    }

    @GetMapping("/ProjectSystemGeneratedDocListAllSteps")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<WrapperProjectDocumentDto> projectSystemGeneratedDocListAllSteps(
            @RequestParam Integer projectId,
            @RequestParam Integer workflowId,
            @AuthenticationPrincipal User user) {

        if (user == null || user.getCompanyID() == null) {
            throw new AccessDeniedException("User authentication error or CompanyID missing.");
        }

        Integer companyId = user.getCompanyID();

        WrapperProjectDocumentDto response = projectDocService.getProjectSystemGeneratedDocListAllSteps(
                projectId, workflowId, companyId);

        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/DeleteProjectDocument")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<RequestResponse> deleteProjectDocument(
            @RequestParam Integer documentId,
            @RequestParam Integer projectId,
            @AuthenticationPrincipal User user) {

        if (user == null || user.getCompanyID() == null) {
            throw new AccessDeniedException("User authentication error or CompanyID missing.");
        }

        Integer companyId = user.getCompanyID();

        RequestResponse response = projectDocService.deleteProjectDocument(
                documentId, projectId, companyId);

        return ResponseEntity.ok(response);
    }
}
