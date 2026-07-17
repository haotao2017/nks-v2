package no.nks.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import no.nks.dto.*;
import no.nks.entity.RequestResponse;
import no.nks.entity.User;
import no.nks.service.ProjectChecklistService;
import no.nks.service.IProjectInspectionService;
import no.nks.service.ProjectPartyService;
import no.nks.service.ProjectService;
import no.nks.service.IS3Service;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/Project")
@RequiredArgsConstructor
@Slf4j
public class ProjectController {

    private final ProjectService projectService;
    private final ProjectChecklistService projectChecklistService;
    private final ProjectPartyService projectPartyService;
    private final IProjectInspectionService projectInspectionService;
    private final IS3Service s3Service;

    @GetMapping("/GetProjectsCount")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ProjectCountDto> getProjectsCount(@AuthenticationPrincipal User user) {
        Integer companyId = validateAndGetCompanyId(user);

        ProjectCountDto projectCount = projectService.getProjectsCount(companyId);

        return ResponseEntity.ok(projectCount);
    }

    @GetMapping("/GetAllProjectList")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<WrapperMultiProjectDto> getAllProjectList(
            @RequestParam Integer EntriesFrom,
            @RequestParam Integer EntriesTill,
            @AuthenticationPrincipal User user) {

        log.debug("获取所有项目列表，范围从 {} 到 {}", EntriesFrom, EntriesTill);
        Integer companyId = validateAndGetCompanyId(user);

        List<ProjectDto> projects = projectService.getAllProjects(companyId, EntriesFrom, EntriesTill);
        WrapperMultiProjectDto response = new WrapperMultiProjectDto(projects);

        log.debug("成功获取 {} 个项目", projects.size());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/GetAllProjectListNotArchivedOrDeleted")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<WrapperMultiProjectListDto> getAllProjectListNotArchivedOrDeleted(
            @RequestParam Integer EntriesFrom,
            @RequestParam Integer EntriesTill,
            @AuthenticationPrincipal User user) {

        log.debug("获取未归档未删除项目列表，范围从 {} 到 {}", EntriesFrom, EntriesTill);
        Integer companyId = validateAndGetCompanyId(user);

        List<ProjectListDto> projects = projectService.getActiveProjects(companyId, EntriesFrom, EntriesTill);
        WrapperMultiProjectListDto response = new WrapperMultiProjectListDto(projects);

        log.debug("成功获取 {} 个未归档未删除项目", projects.size());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/GetAllArchivedProjectList")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<WrapperMultiProjectDto> getAllArchivedProjectList(
            @RequestParam Integer EntriesFrom,
            @RequestParam Integer EntriesTill,
            @AuthenticationPrincipal User user) {

        log.debug("获取已归档项目列表，范围从 {} 到 {}", EntriesFrom, EntriesTill);
        Integer companyId = validateAndGetCompanyId(user);

        List<ProjectDto> projects = projectService.getArchivedProjects(companyId, EntriesFrom, EntriesTill);
        WrapperMultiProjectDto response = new WrapperMultiProjectDto(projects);

        log.debug("成功获取 {} 个已归档项目", projects.size());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/GetAllDeletedProjectList")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<WrapperMultiProjectDto> getAllDeletedProjectList(
            @RequestParam Integer EntriesFrom,
            @RequestParam Integer EntriesTill,
            @AuthenticationPrincipal User user) {

        log.debug("获取已删除项目列表，范围从 {} 到 {}", EntriesFrom, EntriesTill);
        Integer companyId = validateAndGetCompanyId(user);

        List<ProjectDto> projects = projectService.getDeletedProjects(companyId, EntriesFrom, EntriesTill);
        WrapperMultiProjectDto response = new WrapperMultiProjectDto(projects);

        log.debug("成功获取 {} 个已删除项目", projects.size());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/GetProject")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<WrapperProjectDto> getProject(
            @RequestParam Integer ProjectID,
            @AuthenticationPrincipal User user) {
        Integer companyId = validateAndGetCompanyId(user);
        ProjectDto projectDto = projectService.getProjectById(ProjectID, companyId);
        return ResponseEntity.ok(new WrapperProjectDto(projectDto));
    }

    @PutMapping("/UpdateProject")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<WrapperProjectDto> updateProject(
            @RequestBody WrapperProjectDto request,
            @AuthenticationPrincipal User user) {
        Integer companyId = validateAndGetCompanyId(user);
        try {
            ProjectDto updatedProject = projectService.updateProject(request.getProject(), companyId);
            return ResponseEntity.ok(new WrapperProjectDto(updatedProject));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new WrapperProjectDto(request.getProject()));
        }
    }

    @DeleteMapping("/DeleteProject")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<DeleteProjectResponseDto> deleteProject(
            @RequestParam Integer ProjectID,
            @RequestParam boolean isDelete,
            @AuthenticationPrincipal User user) {

        log.debug("{}ID为 {} 的项目", isDelete ? "删除" : "恢复", ProjectID);
        Integer companyId = validateAndGetCompanyId(user);

        DeleteProjectResponseDto response = projectService.deleteProject(ProjectID, isDelete, companyId);

        if (response.isSuccess()) {
            log.debug("成功{}ID为 {} 的项目", isDelete ? "删除" : "恢复", ProjectID);
            return ResponseEntity.ok(response);
        } else {
            log.warn("{}ID为 {} 的项目失败: {}", isDelete ? "删除" : "恢复", ProjectID, response.getMessage());
            return ResponseEntity.ok(response);
        }
    }

    @PostMapping("/CreatProject")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<WrapperProjectDto> creatProject(
            @RequestBody WrapperProjectDto request,
            @AuthenticationPrincipal User user) {

        Integer companyId = validateAndGetCompanyId(user);

        ProjectDto createdProject = projectService.createProject(request.getProject(), companyId);
        WrapperProjectDto response = new WrapperProjectDto(createdProject);

        log.debug("成功创建ID为 {} 的新项目", createdProject.getId());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/ArchiveProject")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<DeleteProjectResponseDto> archiveProject(
            @RequestParam Integer ProjectID,
            @RequestParam boolean isArchive,
            @AuthenticationPrincipal User user) {

        log.debug("{}ID为 {} 的项目", isArchive ? "归档" : "取消归档", ProjectID);
        Integer companyId = validateAndGetCompanyId(user);

        DeleteProjectResponseDto response = projectService.archiveProject(ProjectID, isArchive, companyId);

        if (response.isSuccess()) {
            log.debug("成功{}ID为 {} 的项目", isArchive ? "归档" : "取消归档", ProjectID);
            return ResponseEntity.ok(response);
        } else {
            log.warn("{}ID为 {} 的项目失败: {}", isArchive ? "归档" : "取消归档", ProjectID, response.getMessage());
            return ResponseEntity.ok(response);
        }
    }

    /**
     * 验证用户并获取公司ID
     * @param user 当前认证用户
     * @return 公司ID
     * @throws AccessDeniedException 如果用户未认证或无公司ID
     */
    private Integer validateAndGetCompanyId(User user) {
        if (user == null || user.getCompanyID() == null) {
            log.warn("用户未认证或无公司ID");
            throw new AccessDeniedException("用户未认证或无公司ID");
        }
        return user.getCompanyID();
    }

    // ==================== 项目检查清单相关接口 ====================

    /**
     * 获取项目所有检查清单
     * GET /api/Project/GetAllProjectChecklists
     */
    @GetMapping("/GetAllProjectChecklists")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<WrapperMultiProjectChecklistSimpleDto> getAllProjectChecklists(
            @RequestParam Integer ProjectID,
            @AuthenticationPrincipal User user) {

        log.debug("获取项目ID为 {} 的所有检查清单", ProjectID);
        Integer companyId = validateAndGetCompanyId(user);

        // 获取检查清单列表
        List<ProjectChecklistDto> checklists = projectChecklistService.getAllProjectChecklists(ProjectID, companyId);

        // 使用原始DTO创建包装对象
        WrapperMultiProjectChecklistDto originalResponse = new WrapperMultiProjectChecklistDto(checklists);

        // 转换为标准格式的简化DTO
        WrapperMultiProjectChecklistSimpleDto standardResponse =
                WrapperMultiProjectChecklistSimpleDto.fromWrapperMultiProjectChecklistDto(originalResponse);

        log.debug("成功获取 {} 个检查清单", checklists.size());
        return ResponseEntity.ok(standardResponse);
    }

    /**
     * 获取单个项目检查清单
     * GET /api/Project/GetSingleProjectChecklist
     */
    @GetMapping("/GetSingleProjectChecklist")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<WrapperProjectChecklistDetailDto> getSingleProjectChecklist(
            @RequestParam Integer ChecklistID,
            @AuthenticationPrincipal User user) {

        log.debug("获取检查清单ID为 {} 的详情", ChecklistID);
        Integer companyId = validateAndGetCompanyId(user);

        // 获取检查清单详情
        ProjectChecklistDto checklist = projectChecklistService.getSingleProjectChecklist(ChecklistID, companyId);

        // 使用原始DTO创建包装对象
        WrapperProjectChecklistDto originalResponse = new WrapperProjectChecklistDto(checklist);

        // 转换为标准格式的详情DTO
        WrapperProjectChecklistDetailDto standardResponse =
                WrapperProjectChecklistDetailDto.fromWrapperProjectChecklistDto(originalResponse);

        log.debug("成功获取检查清单详情，ID: {}", ChecklistID);
        return ResponseEntity.ok(standardResponse);
    }

    /**
     * 创建项目检查清单
     * POST /api/Project/CreateSingleProjectChecklist
     */
    @PostMapping("/CreateSingleProjectChecklist")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<WrapperProjectChecklistDetailDto> createSingleProjectChecklist(
            @RequestBody WrapperProjectChecklistDto request,
            @AuthenticationPrincipal User user) {

        log.debug("创建项目检查清单，项目ID: {}", request.getProjectChecklist().getProjectId());
        Integer companyId = validateAndGetCompanyId(user);

        // 创建检查清单
        ProjectChecklistDto createdChecklist = projectChecklistService.createSingleProjectChecklist(
                request.getProjectChecklist(), companyId);

        // 处理检查项 - 检查请求中是否包含projectChecklistItems
        List<ChecklistItemDto> checklistItems = new ArrayList<>();
        if (request.getProjectChecklist().getProjectChecklistItems() != null &&
                !request.getProjectChecklist().getProjectChecklistItems().isEmpty()) {

            // 遍历并创建每个检查项
            for (ChecklistItemSimpleDto itemSimple : request.getProjectChecklist().getProjectChecklistItems()) {
                // 创建检查项DTO
                ChecklistItemDto itemDto = new ChecklistItemDto();
                itemDto.setChecklistId(createdChecklist.getId()); // 设置为新创建的清单ID
                itemDto.setTitle(itemSimple.getTitle());

                // 调用服务创建检查项
                ChecklistItemDto createdItem = projectChecklistService.createSingleProjectChecklistItem(itemDto, companyId);
                checklistItems.add(createdItem);
            }
        }

        // 将创建的检查项添加到清单中
        createdChecklist.setChecklistItems(checklistItems);

        // 使用原始DTO创建包装对象
        WrapperProjectChecklistDto originalResponse = new WrapperProjectChecklistDto(createdChecklist);

        // 转换为标准格式的详情DTO
        WrapperProjectChecklistDetailDto standardResponse =
                WrapperProjectChecklistDetailDto.fromWrapperProjectChecklistDto(originalResponse);

        log.debug("成功创建检查清单，ID: {}, 包含 {} 个检查项", createdChecklist.getId(), checklistItems.size());
        return ResponseEntity.ok(standardResponse);
    }

    /**
     * 更新项目检查清单
     * POST /api/Project/UpdateSingleProjectChecklist
     */
    @PostMapping("/UpdateSingleProjectChecklist")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<WrapperProjectChecklistDetailDto> updateSingleProjectChecklist(
            @RequestBody WrapperProjectChecklistDto request,
            @AuthenticationPrincipal User user) {

        log.debug("更新检查清单，ID: {}", request.getProjectChecklist().getId());
        Integer companyId = validateAndGetCompanyId(user);

        // 更新检查清单本身
        ProjectChecklistDto updatedChecklist = projectChecklistService.updateSingleProjectChecklist(
                request.getProjectChecklist(), companyId);

        // 处理检查项更新 - 检查请求中是否包含projectChecklistItems
        List<ChecklistItemDto> checklistItems = new ArrayList<>();
        if (request.getProjectChecklist().getProjectChecklistItems() != null &&
                !request.getProjectChecklist().getProjectChecklistItems().isEmpty()) {

            // 遍历并更新每个检查项
            for (ChecklistItemSimpleDto itemSimple : request.getProjectChecklist().getProjectChecklistItems()) {
                // 跳过没有ID的项
                if (itemSimple.getId() == null) {
                    continue;
                }

                // 创建用于更新的检查项DTO
                ChecklistItemDto itemDto = new ChecklistItemDto();
                itemDto.setId(itemSimple.getId());
                itemDto.setChecklistId(itemSimple.getChecklistId());
                itemDto.setTitle(itemSimple.getTitle());

                // 调用服务更新检查项
                ChecklistItemDto updatedItem = projectChecklistService.updateSingleProjectChecklistItem(itemDto, companyId);
                checklistItems.add(updatedItem);
            }
        }

        // 将更新后的检查项添加到清单中
        updatedChecklist.setChecklistItems(checklistItems);

        // 使用原始DTO创建包装对象
        WrapperProjectChecklistDto originalResponse = new WrapperProjectChecklistDto(updatedChecklist);

        // 转换为标准格式的详情DTO
        WrapperProjectChecklistDetailDto standardResponse =
                WrapperProjectChecklistDetailDto.fromWrapperProjectChecklistDto(originalResponse);

        log.debug("成功更新检查清单，ID: {}, 包含 {} 个检查项", updatedChecklist.getId(), checklistItems.size());
        return ResponseEntity.ok(standardResponse);
    }

    /**
     * 删除项目检查清单
     * DELETE /api/Project/DeleteSingleProjectChecklist
     */
    @DeleteMapping("/DeleteSingleProjectChecklist")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<RequestResponse> deleteSingleProjectChecklist(
            @RequestParam Integer ChecklistId,
            @AuthenticationPrincipal User user) {

        log.debug("删除检查清单，ID: {}", ChecklistId);
        Integer companyId = validateAndGetCompanyId(user);

        RequestResponse response = projectChecklistService.deleteSingleProjectChecklist(ChecklistId, companyId);

        if (response.isSuccess()) {
            log.debug("成功删除检查清单，ID: {}", ChecklistId);
            return ResponseEntity.ok(response);
        } else {
            log.warn("删除检查清单失败，ID: {}, 原因: {}", ChecklistId, response.getMessage());
            return ResponseEntity.ok(response);
        }
    }

    /**
     * 创建检查清单项
     * POST /api/Project/CreatSingleProjectChecklistItem
     */
    @PostMapping("/CreatSingleProjectChecklistItem")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<WrapperChecklistItemSimpleDto> creatSingleProjectChecklistItem(
            @RequestBody WrapperProjectChecklistItemDto request,
            @AuthenticationPrincipal User user) {

        log.debug("创建检查清单项，所属检查清单ID: {}", request.getProjectChecklistItems().getChecklistId());
        Integer companyId = validateAndGetCompanyId(user);

        ChecklistItemDto createdItem = projectChecklistService.createSingleProjectChecklistItem(
                request.getProjectChecklistItems(), companyId);

        // 使用原始DTO创建包装对象
        WrapperProjectChecklistItemDto originalResponse = new WrapperProjectChecklistItemDto(createdItem);

        // 转换为标准格式的简化DTO
        WrapperChecklistItemSimpleDto standardResponse =
                WrapperChecklistItemSimpleDto.fromWrapperProjectChecklistItemDto(originalResponse);

        log.debug("成功创建检查清单项，ID: {}", createdItem.getId());
        return ResponseEntity.ok(standardResponse);
    }

    /**
     * 更新检查清单项
     * PUT /api/Project/UpdateSingleProjectChecklistItem
     */
    @PutMapping("/UpdateSingleProjectChecklistItem")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<WrapperChecklistItemSimpleDto> updateSingleProjectChecklistItem(
            @RequestBody WrapperProjectChecklistItemDto request,
            @AuthenticationPrincipal User user) {

        log.debug("更新检查清单项，ID: {}", request.getProjectChecklistItems().getId());
        Integer companyId = validateAndGetCompanyId(user);

        ChecklistItemDto updatedItem = projectChecklistService.updateSingleProjectChecklistItem(
                request.getProjectChecklistItems(), companyId);

        // 使用原始DTO创建包装对象
        WrapperProjectChecklistItemDto originalResponse = new WrapperProjectChecklistItemDto(updatedItem);

        // 转换为标准格式的简化DTO
        WrapperChecklistItemSimpleDto standardResponse =
                WrapperChecklistItemSimpleDto.fromWrapperProjectChecklistItemDto(originalResponse);

        log.debug("成功更新检查清单项，ID: {}", updatedItem.getId());
        return ResponseEntity.ok(standardResponse);
    }

    /**
     * 删除检查清单项
     * DELETE /api/Project/DeleteSingleProjectChecklistItem
     */
    @DeleteMapping("/DeleteSingleProjectChecklistItem")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<RequestResponse> deleteSingleProjectChecklistItem(
            @RequestParam Integer ChecklistItemId,
            @AuthenticationPrincipal User user) {

        log.debug("删除检查清单项，ID: {}", ChecklistItemId);
        Integer companyId = validateAndGetCompanyId(user);

        RequestResponse response = projectChecklistService.deleteSingleProjectChecklistItem(ChecklistItemId, companyId);

        if (response.isSuccess()) {
            log.debug("成功删除检查清单项，ID: {}", ChecklistItemId);
            return ResponseEntity.ok(response);
        } else {
            log.warn("删除检查清单项失败，ID: {}, 原因: {}", ChecklistItemId, response.getMessage());
            return ResponseEntity.ok(response);
        }
    }

    /**
     * 删除项目服务
     * DELETE /api/Project/DeleteProjectService
     */
    @DeleteMapping("/DeleteProjectService")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<RequestResponse> deleteProjectService(
            @RequestParam Integer ProjectID,
            @RequestParam Integer ProjectServiceID,
            @AuthenticationPrincipal User user) {

        log.debug("删除项目服务，项目ID: {}, 服务ID: {}", ProjectID, ProjectServiceID);
        Integer companyId = validateAndGetCompanyId(user);

        RequestResponse response = projectChecklistService.deleteProjectService(ProjectID, ProjectServiceID, companyId);

        if (response.isSuccess()) {
            log.debug("成功删除项目服务，项目ID: {}, 服务ID: {}", ProjectID, ProjectServiceID);
            return ResponseEntity.ok(response);
        } else {
            log.warn("删除项目服务失败，项目ID: {}, 服务ID: {}, 原因: {}",
                    ProjectID, ProjectServiceID, response.getMessage());
            return ResponseEntity.ok(response);
        }
    }

    /**
     * 获取项目所有参与方
     * GET /api/Project/GetAllProjectPartiesByProjectID
     */
    @GetMapping("/GetAllProjectPartiesByProjectID")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<WrapperMultiProjectPartyDto> getAllProjectPartiesByProjectID(
            @RequestParam Integer ProjectID,
            @AuthenticationPrincipal User user) {

        Integer companyId = validateAndGetCompanyId(user);

        WrapperMultiProjectPartyDto response = projectPartyService.getAllProjectPartiesByProjectID(ProjectID, companyId);

        return ResponseEntity.ok(response);
    }

    /**
     * 关联参与方与项目参与方类型
     * POST /api/Project/AssociatePartyWithProjectPartyType
     */
    @PostMapping("/AssociatePartyWithProjectPartyType")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<RequestResponse> associatePartyWithProjectPartyType(
            @RequestBody WrapperProjectPartyDto param,
            @AuthenticationPrincipal User user) {

        Integer companyId = validateAndGetCompanyId(user);
        RequestResponse response = new RequestResponse();

        if (param.getProjectParty().getPartyId() != null && param.getProjectParty().getPartyTypeId() != null) {
            if (param.getProjectParty().getPartyId() > 0 && param.getProjectParty().getPartyTypeId() > 0) {
                response = projectPartyService.associatePartyWithProjectPartyType(param, companyId);
            } else {
                response.setMessage("There is some issue with Request Params");
                response.setSuccess(false);
            }
        } else {
            response.setMessage("There is some issue with Request Params");
            response.setSuccess(false);
        }

        return ResponseEntity.ok(response);
    }

    /**
     * 获取项目客户联系提醒日期
     * GET /api/Project/GetProjectContactCustomerReminderDate
     */
    @GetMapping("/GetProjectContactCustomerReminderDate")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<WrapperProjectContactCustomerDto> getProjectContactCustomerReminderDate(
            @RequestParam Integer ProjectID,
            @AuthenticationPrincipal User user) {

        Integer companyId = validateAndGetCompanyId(user);

        WrapperProjectContactCustomerDto response = projectService.getProjectContactCustomerReminderDate(ProjectID, companyId);

        return ResponseEntity.ok(response);
    }

    /**
     * 关联项目负责人与项目
     * POST /api/Project/AssociateProjectLeaderWithProject
     */
    @PostMapping("/AssociateProjectLeaderWithProject")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<WrapperProjectLeaderDto> associateProjectLeaderWithProject(
            @RequestBody WrapperProjectLeaderDto param,
            @AuthenticationPrincipal User user) {

        Integer companyId = validateAndGetCompanyId(user);

        WrapperProjectLeaderDto response = projectService.associateProjectLeaderWithProject(param, companyId);

        return ResponseEntity.ok(response);
    }

    /**
     * 获取项目负责人信息
     * GET /api/Project/GetProjectLeaderWithProjectID
     */
    @GetMapping("/GetProjectLeaderWithProjectID")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<WrapperProjectLeaderDto> getProjectLeaderWithProjectID(
            @RequestParam Integer ProjectID,
            @AuthenticationPrincipal User user) {

        Integer companyId = validateAndGetCompanyId(user);

        WrapperProjectLeaderDto response = projectService.getProjectLeaderWithProjectID(ProjectID, companyId);

        return ResponseEntity.ok(response);
    }

    /**
     * 获取检查员用户列表
     * GET /api/Project/GetInspectorUsers
     */
    @GetMapping("/GetInspectorUsers")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<WrapperMultiUserInspectorDto> getInspectorUsers(
            @AuthenticationPrincipal User user) {

        Integer companyId = validateAndGetCompanyId(user);

        // 直接从service获取新格式的响应
        WrapperMultiUserInspectorDto response = projectService.getInspectorsInNewFormat(companyId);

        return ResponseEntity.ok(response);
    }

    /**
     * 获取项目工作流10步骤保存的详细信息
     * GET /api/Project/GetProjectWFTenSavedDetails
     */
    @GetMapping("/GetProjectWFTenSavedDetails")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<WrapperProjectWFTenSavedDetailsDto> getProjectWFTenSavedDetails(
            @RequestParam Integer WorkflowId,
            @RequestParam Integer WorkflowStepId,
            @RequestParam Integer ProjectID,
            @AuthenticationPrincipal User user) {

        Integer companyId = validateAndGetCompanyId(user);

        WrapperProjectWFTenSavedDetailsDto response = projectService.getProjectWFTenSavedDetails(
                WorkflowId, WorkflowStepId, ProjectID, companyId);

        return ResponseEntity.ok(response);
    }

    /**
     * 获取项目所有检查清单检查数据
     * GET /api/Project/GetAllProjectChecklistsInspData
     */
    @GetMapping("/GetAllProjectChecklistsInspData")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<WrapperMultiProjectChecklistInspDataDto> getAllProjectChecklistsInspData(
            @RequestParam Integer ProjectID,
            @AuthenticationPrincipal User user) {

        Integer companyId = validateAndGetCompanyId(user);

        WrapperMultiProjectChecklistInspDataDto response = projectInspectionService.getAllProjectChecklistsInspData(
                ProjectID, companyId, s3Service);

        return ResponseEntity.ok(response);
    }

    /**
     * 更新单个项目检查清单项检查数据
     * PUT /api/Project/UpdateSingleProjectChecklistItemInspData
     */
    @PutMapping("/UpdateSingleProjectChecklistItemInspData")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<WrapperProjectChecklistItemInspDataDto> updateSingleProjectChecklistItemInspData(
            @RequestBody WrapperProjectChecklistItemInspDataDto param,
            @AuthenticationPrincipal User user) {

        Integer companyId = validateAndGetCompanyId(user);

        WrapperProjectChecklistItemInspDataDto response = projectInspectionService.updateSingleProjectChecklistItemInspData(
                param, companyId);

        return ResponseEntity.ok(response);
    }

    /**
     * 删除单个项目检查清单项图片检查数据
     * DELETE /api/Project/DeleteSingleProjectChecklistItemImageInspData
     */
    @DeleteMapping("/DeleteSingleProjectChecklistItemImageInspData")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<RequestResponse> deleteSingleProjectChecklistItemImageInspData(
            @RequestParam Integer ProjectChecklistItemImageId,
            @AuthenticationPrincipal User user) {

        Integer companyId = validateAndGetCompanyId(user);

        RequestResponse response = projectInspectionService.deleteSingleProjectChecklistItemImageInspData(
                ProjectChecklistItemImageId, companyId);

        if (!response.isSuccess()) {
            return ResponseEntity.badRequest().body(response);
        }

        return ResponseEntity.ok(response);
    }
}
