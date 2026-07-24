package no.nks.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import no.nks.dto.api.*;
import no.nks.entity.User;
import no.nks.service.MobileAppService;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/MobileApp")
@RequiredArgsConstructor
@Slf4j
public class MobileAppController {

    private final MobileAppService mobileAppService;

    @GetMapping("/GetProjectList")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ResponseContainer> getProjectList(@AuthenticationPrincipal User user) {
        if (user == null || user.getCompanyID() == null) {
            ResponseContainer errorResponse = new ResponseContainer();
            errorResponse.setResponse(new Response("100", "User not found"));
            return ResponseEntity.ok(errorResponse);
        }

        ResponseContainer response = mobileAppService.getProjectList(user.getId(), user.getCompanyID());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/ProjectDetail")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ProjectDetailContainer> getProjectDetail(
            @RequestParam Integer ProjectID,
            @AuthenticationPrincipal User user) {

        if (user == null || user.getCompanyID() == null) {
            ProjectDetailContainer errorResponse = new ProjectDetailContainer();
            errorResponse.setResponse(new Response("100", "User not found"));
            return ResponseEntity.ok(errorResponse);
        }

        ProjectDetailContainer response = mobileAppService.getProjectDetail(ProjectID, user.getCompanyID());
        return ResponseEntity.ok(response);
    }

    @PostMapping(value = "/ProjectUpdate", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Response> projectUpdate(
            @RequestParam("request") String requestJson,
            // 旧 App / 新 App 字段名不一致:file(新后端曾用) 与 image(旧 kontoll-app)
            @RequestParam(value = "file", required = false) MultipartFile file,
            @RequestParam(value = "image", required = false) MultipartFile image,
            @AuthenticationPrincipal User user) {

        if (user == null || user.getCompanyID() == null) {
            return ResponseEntity.ok(new Response("100", "User not found"));
        }

        MultipartFile siteImage = (file != null && !file.isEmpty()) ? file : image;
        Response response = mobileAppService.updateProject(requestJson, siteImage, user.getCompanyID());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/ProjectSubmit")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Response> projectSubmit(
            @Valid @RequestBody ProjectSubmitContainer request,
            @AuthenticationPrincipal User user) {

        if (user == null || user.getCompanyID() == null) {
            return ResponseEntity.ok(new Response("100", "User not found"));
        }

        Response response = mobileAppService.submitProject(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/ChecklistItems")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ChecklistItemContainer> getChecklistItems(
            @RequestParam Integer ChecklistID,
            @AuthenticationPrincipal User user) {

        if (user == null || user.getCompanyID() == null) {
            ChecklistItemContainer errorResponse = new ChecklistItemContainer();
            errorResponse.setResponse(new Response("100", "User not found"));
            return ResponseEntity.ok(errorResponse);
        }

        ChecklistItemContainer response = mobileAppService.getChecklistItems(ChecklistID, user.getCompanyID());
        return ResponseEntity.ok(response);
    }

    @PostMapping(value = "/ChecklistUpdate", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ChecklistItemUpdateResponse> checklistUpdate(
            @RequestParam("request") String requestJson,
            // 兼容:file / files(新) 与 image0/image1...(旧 kontoll-app)
            @RequestParam(value = "file", required = false) List<MultipartFile> singleFiles,
            @RequestParam(value = "files", required = false) List<MultipartFile> files,
            org.springframework.web.multipart.MultipartHttpServletRequest multipartRequest,
            @AuthenticationPrincipal User user) {

        if (user == null || user.getCompanyID() == null) {
            ChecklistItemUpdateResponse errorResponse = new ChecklistItemUpdateResponse();
            errorResponse.setResponse(new Response("100", "User not found"));
            return ResponseEntity.ok(errorResponse);
        }

        List<MultipartFile> combinedFiles = new java.util.ArrayList<>();
        if (singleFiles != null) {
            combinedFiles.addAll(singleFiles);
        }
        if (files != null) {
            combinedFiles.addAll(files);
        }
        // 旧客户端:image0 / image1 / ...
        if (multipartRequest != null) {
            java.util.Iterator<String> names = multipartRequest.getFileNames();
            while (names.hasNext()) {
                String name = names.next();
                if (name == null) continue;
                String lower = name.toLowerCase(java.util.Locale.ROOT);
                if ("request".equals(lower) || "file".equals(lower) || "files".equals(lower)) {
                    continue;
                }
                if (lower.startsWith("image")) {
                    List<MultipartFile> named = multipartRequest.getFiles(name);
                    if (named != null) {
                        combinedFiles.addAll(named);
                    }
                }
            }
        }
        List<MultipartFile> filesToProcess = combinedFiles.isEmpty() ? null : combinedFiles;

        ChecklistItemUpdateResponse response = mobileAppService.updateChecklistItem(requestJson, filesToProcess, user.getCompanyID());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/Log")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<InspectionLogDto>> getLog(
            @RequestParam Integer ProjectId,
            @AuthenticationPrincipal User user) {

        if (user == null || user.getCompanyID() == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        List<InspectionLogDto> logs = mobileAppService.getProjectLogs(ProjectId);
        return ResponseEntity.ok(logs);
    }

    /**
     * 获取检查清单模板列表
     * GET /api/MobileApp/GetChecklistTemplates
     */
    @GetMapping("/GetChecklistTemplates")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ChecklistTemplateContainer> getChecklistTemplates(@AuthenticationPrincipal User user) {
        if (user == null || user.getCompanyID() == null) {
            ChecklistTemplateContainer errorResponse = new ChecklistTemplateContainer();
            errorResponse.setResponse(new Response("100", "User not found"));
            return ResponseEntity.ok(errorResponse);
        }

        ChecklistTemplateContainer response = mobileAppService.getChecklistTemplates(user.getCompanyID());
        return ResponseEntity.ok(response);
    }

    /**
     * 基于模板创建检查清单并自动生成项目
     * POST /api/MobileApp/CreateChecklistFromTemplate
     */
    @PostMapping("/CreateChecklistFromTemplate")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<CreateChecklistWithProjectResponse> createChecklistFromTemplate(
            @Valid @RequestBody CreateChecklistFromTemplateRequest request,
            @AuthenticationPrincipal User user) {

        if (user == null || user.getCompanyID() == null) {
            CreateChecklistWithProjectResponse errorResponse = new CreateChecklistWithProjectResponse();
            errorResponse.setResponse(new Response("100", "User not found"));
            return ResponseEntity.ok(errorResponse);
        }

        CreateChecklistWithProjectResponse response = mobileAppService.createChecklistFromTemplate(request, user.getId(), user.getCompanyID());
        return ResponseEntity.ok(response);
    }
}
