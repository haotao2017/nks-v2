package no.nks.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import no.nks.dto.api.*;
import no.nks.dto.ProjectDto;
import no.nks.dto.ProjectChecklistDto;
import no.nks.dto.ChecklistItemDto;
import no.nks.entity.ChecklistItem;
import no.nks.entity.ChecklistItemImage;
import no.nks.entity.ChecklistTemplate;
import no.nks.entity.ChecklistItemTemplate;
import no.nks.entity.InspectionLog;
import no.nks.entity.Project;
import no.nks.entity.ProjectChecklist;
import no.nks.exception.ResourceNotFoundException;
import no.nks.exception.BusinessException;
import no.nks.repository.ChecklistItemImageRepository;
import no.nks.repository.ChecklistItemRepository;
import no.nks.repository.ChecklistTemplateRepository;
import no.nks.repository.ChecklistItemTemplateRepository;
import no.nks.repository.InspectionLogRepository;
import no.nks.repository.ProjectChecklistRepository;
import no.nks.repository.ProjectRepository;
import no.nks.repository.ContactBookRepository;
import no.nks.service.FileStorageService;
import no.nks.service.MobileAppService;
import no.nks.service.ProjectService;
import no.nks.service.ProjectChecklistService;
import no.nks.util.ChecklistStatusNormalizer;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class MobileAppServiceImpl implements MobileAppService {

    private final ProjectRepository projectRepository;
    private final ChecklistItemRepository checklistItemRepository;
    private final ChecklistItemImageRepository checklistItemImageRepository;
    private final ChecklistTemplateRepository checklistTemplateRepository;
    private final ChecklistItemTemplateRepository checklistItemTemplateRepository;
    private final InspectionLogRepository inspectionLogRepository;
    private final ProjectChecklistRepository projectChecklistRepository;
    private final FileStorageService fileStorageService;
    private final ObjectMapper objectMapper;
    private final ContactBookRepository contactBookRepository;
    private final ProjectService projectService;
    private final ProjectChecklistService projectChecklistService;
    private final CacheManager cacheManager;

    @Override
    public ResponseContainer getProjectList(Integer inspectorId, Integer companyId) {
        ResponseContainer container = new ResponseContainer();

        // 使用优化后的数据库查询直接获取符合条件的项目
        List<Project> projects = projectRepository.findActiveProjectsByInspectorAndCompany(
                inspectorId, companyId, LocalDateTime.now().minusHours(1));

        if (projects.isEmpty()) {
            container.setResponse(new Response("200", "OK"));
            return container;
        }

        // 转换为API响应对象
        List<Login> projectLogins = projects.stream()
                .map(this::mapProjectToLogin)
                // 排序已经在数据库查询中完成，这里保留空值处理逻辑以防万一
                .sorted((p1, p2) -> {
                    LocalDateTime date1 = p1.getInspectionDate();
                    LocalDateTime date2 = p2.getInspectionDate();
                    if (date1 == null && date2 == null) return 0;
                    if (date1 == null) return 1;
                    if (date2 == null) return -1;
                    return date2.compareTo(date1);
                })
                .collect(Collectors.toList());

        container.setListOfProjects(projectLogins);
        container.setResponse(new Response("200", "OK"));
        return container;
    }

    private Login mapProjectToLogin(Project project) {
        Login login = new Login();
        login.setProjectID(String.valueOf(project.getId()));
        login.setProjectName(project.getTitle());
        login.setProjectDetail(project.getDescription() != null ? project.getDescription() : "");
        login.setInspectionDate(project.getInspectionDate());
        return login;
    }

    @Override
    @Transactional
    public ProjectDetailContainer getProjectDetail(Integer projectId, Integer companyId) {
        ProjectDetailContainer container = new ProjectDetailContainer();

        // 只查询一次项目基本信息和参与方数据
        Project project = projectRepository.findByIdAndCompanyIdWithParties(projectId, companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with ID: " + projectId));

        // 设置项目详情
        ProjectDetailModCls details = createProjectDetailFromProject(project);
        container.setProjectDetail(details);

        // 使用优化的SQL查询直接获取检查表及其项目数量
        List<Object[]> checklists = projectRepository.findChecklistsWithItemCount(projectId);
        for (Object[] checklistData : checklists) {
            ProjectChecklists checklistDto = new ProjectChecklists();
            checklistDto.setChecklistId(((Number) checklistData[0]).intValue());
            checklistDto.setChecklistName((String) checklistData[1]);
            checklistDto.setChecklistItemTypes(((Number) checklistData[2]).intValue());
            container.getListOfChecklists().add(checklistDto);
        }

        container.setResponse(new Response("200", "OK"));
        return container;
    }

    /**
     * 从项目实体创建项目详情DTO对象
     */
    private ProjectDetailModCls createProjectDetailFromProject(Project project) {
        ProjectDetailModCls details = new ProjectDetailModCls();
        details.setProjectId(project.getId());
        details.setProjectTitle(project.getTitle());
        details.setDescription(project.getDescription() != null ? project.getDescription() : "");

        // 地址格式化
        String address = project.getAddress() != null ? project.getAddress() : "";
        String postNo = project.getPostNo() != null ? project.getPostNo() : "";
        String poststed = project.getPoststed() != null ? project.getPoststed() : "";
        details.setAddress(String.format("%s, %s %s", address, postNo, poststed).trim());

        // 项目负责人信息
        if (project.getProjectLeaderId() != null) {
            contactBookRepository.findById(project.getProjectLeaderId())
                .ifPresent(leader -> {
                    details.setLeaderName(leader.getName() != null ? leader.getName() : "");
                    details.setLeaderNumber(leader.getContactNo() != null ? leader.getContactNo() : "");
                });
        } else {
            details.setLeaderName("");
            details.setLeaderNumber("");
        }

        // 获取Flisleger信息（PartyType 8）
        if (project.getProjectParties() != null) {
            project.getProjectParties().stream()
                    .filter(party -> party.getPartyTypeId() == 8 && party.getParty() != null)
                    .findFirst()
                    .ifPresent(party -> {
                        details.setFlislegerName(party.getParty().getName());
                        details.setFlislegerNumber(party.getParty().getContactNo());
                    });
        }

        // 项目图片URL
        if (project.getProjectImage() != null) {
            details.setSiteImageUrl(fileStorageService.getPublicUrl(project.getProjectImage(), "project-site-images"));
        }

        // 获取平面图文档（类型64）
        fileStorageService.getDocument(project.getId(), 64)
                .ifPresent(doc -> details.setFloorPlanUrl(fileStorageService.getPublicUrl(doc.getFileName(), "pdf")));

        details.setCreatedOn(project.getInspectionDate() != null ?
                project.getInspectionDate().toString() : "");

        return details;
    }

    @Override
    @Transactional
    public Response updateProject(String requestJson, MultipartFile file, Integer companyId) {
        try {
            ProjectContainer container = objectMapper.readValue(requestJson, ProjectContainer.class);
            ProjectUpdateENT updateRequest = container.getProjectUpdate();

            Project project = projectRepository.findById(updateRequest.getProjectID())
                    .orElseThrow(() -> new ResourceNotFoundException("Project not found with ID: " + updateRequest.getProjectID()));

            if (!project.getCompanyId().equals(companyId)) {
                return new Response("100", "Project not found for this company");
            }

            // Update description if provided
            if (updateRequest.getProjectDescription() != null && !updateRequest.getProjectDescription().isEmpty()) {
                project.setDescription(updateRequest.getProjectDescription());
            }

            // Update inspection date if provided
            if (updateRequest.getProjectDate() != null) {
                project.setInspectionDate(updateRequest.getProjectDate());
            }

            // Upload and update image if provided
            if (file != null) {
                String fileName = "ProjectSiteImage-" + System.currentTimeMillis() + ".jpg";
                boolean uploadSuccess = fileStorageService.uploadFile(file, fileName, "project-site-images");

                if (!uploadSuccess) {
                    return new Response("100", "Issue with file upload");
                }

                project.setProjectImage(fileName);
            }

            // Update project status
            String currentStatus = project.getProjectStatus();
            if (currentStatus != null && !currentStatus.isEmpty()) {
                boolean statusExists = checkStatusExists(currentStatus, "11");
                if (!statusExists) {
                    project.setProjectStatus(currentStatus + "11,");
                }
            }

            projectRepository.save(project);
            return new Response("200", "Success");

        } catch (Exception e) {
            return new Response("100", "Failed");
        }
    }

    @Override
    @Transactional
    public Response submitProject(ProjectSubmitContainer submitContainer) {
        try {
            ProjectSubmitENT submitRequest = submitContainer.getProjectSubmit();

            Project project = projectRepository.findById(submitRequest.getProjectID())
                    .orElseThrow(() -> new ResourceNotFoundException("Project not found with ID: " + submitRequest.getProjectID()));

            // Update inspector comments if provided
            if (submitRequest.getInspectorComments() != null && !submitRequest.getInspectorComments().isEmpty()) {
                project.setInspectorComment(submitRequest.getInspectorComments());
            }

            // Update inspector signature if provided
            if (submitRequest.getInspectorSignature() != null && !submitRequest.getInspectorSignature().isEmpty()) {
                project.setInspectorSignature(submitRequest.getInspectorSignature());
            }

            // Update project status
            String currentStatus = project.getProjectStatus();
            if (currentStatus != null && !currentStatus.isEmpty()) {
                boolean statusExists = checkStatusExists(currentStatus, "12");
                if (!statusExists) {
                    project.setProjectStatus(currentStatus + "12,");
                }
            }

            // Update submission details
            project.setIsSubmitted(true);
            project.setCompleteDate(submitRequest.getProjectSubmitDate());

            projectRepository.save(project);

            // Add inspection log
            InspectionLog log = new InspectionLog();
            log.setProjectId(submitRequest.getProjectID());
            log.setDateTime(LocalDateTime.now());
            inspectionLogRepository.save(log);

            return new Response("200", "Success");

        } catch (Exception e) {
            return new Response("100", "Failed");
        }
    }

    @Override
    public ChecklistItemContainer getChecklistItems(Integer checklistId, Integer companyId) {
        ChecklistItemContainer container = new ChecklistItemContainer();

        try {
            // 直接通过repository方法获取特定checklistId的条目
            List<ChecklistItem> items = checklistItemRepository.findByChecklistId(checklistId);

            if (items.isEmpty()) {
                container.setListOfChecklistItems(new ArrayList<>());
                container.setResponse(new Response("200", "Success"));
                return container;
            }

            // 获取所有checklistItem的ID，用于一次性查询相关图片
            List<Integer> itemIds = items.stream()
                    .map(ChecklistItem::getId)
                    .collect(Collectors.toList());

            // 一次性查询所有相关图片
            List<ChecklistItemImage> allImages = checklistItemImageRepository.findByChecklistItemIdIn(itemIds);

            // 将图片按checklistItemId分组，以便快速查找
            Map<Integer, List<ChecklistItemImage>> imagesByItemId = allImages.stream()
                    .collect(Collectors.groupingBy(ChecklistItemImage::getChecklistItemId));

            // 转换为API响应对象
            List<ChecklistItemList> itemDtos = items.stream()
                    .map(item -> {
                        ChecklistItemList itemDto = new ChecklistItemList();
                        itemDto.setChecklistItemID(item.getId());
                        itemDto.setQuestion(item.getTitle());
                        itemDto.setComment(item.getComment());
                        itemDto.setStatus(item.getStatus());

                        // 获取当前条目的图片
                        List<String> imageUrls = imagesByItemId.getOrDefault(item.getId(), List.of())
                                .stream()
                                .map(image -> fileStorageService.getPublicUrl(image.getImageName(), "inspection-checklist-images"))
                                .collect(Collectors.toList());
                        itemDto.setItemImageUrls(imageUrls);

                        return itemDto;
                    })
                    .collect(Collectors.toList());

            container.setListOfChecklistItems(itemDtos);
            container.setResponse(new Response("200", "Success"));

        } catch (Exception e) {
            log.error("Error getting checklist items for checklistId: {}", checklistId, e);
            container.setResponse(new Response("100", "Something went wrong!"));
            container.setListOfChecklistItems(new ArrayList<>());
        }

        return container;
    }

    @Override
    @Transactional
    public ChecklistItemUpdateResponse updateChecklistItem(String requestJson, List<MultipartFile> files, Integer companyId) {
        ChecklistItemUpdateResponse response = new ChecklistItemUpdateResponse();
        ChecklistItemUpdateResponseData responseData = new ChecklistItemUpdateResponseData();

        try {
            // Parse request
            ChecklistItemUpdateContainer container = objectMapper.readValue(requestJson, ChecklistItemUpdateContainer.class);
            ChecklistItemRequestENT request = container.getChecklistItem();

            int checklistItemId = request.getQuestionID();
            ChecklistItem item = checklistItemRepository.findById(checklistItemId)
                    .orElseThrow(() -> new ResourceNotFoundException("Checklist item not found with ID: " + checklistItemId));

            // Translate status from Norwegian aliases to wire values (OK/Dev/NA)
            String status = ChecklistStatusNormalizer.normalize(request.getStatus());

            // Remove existing images - optimized to a single delete operation
            checklistItemImageRepository.deleteByChecklistItemId(checklistItemId);

            // Process image uploads if status is not "NA"
            if (ChecklistStatusNormalizer.isPhotoEligible(status) && files != null && !files.isEmpty()) {
                LocalDateTime now = LocalDateTime.now();
                for (int i = 0; i < files.size(); i++) {
                    MultipartFile file = files.get(i);

                    // Generate unique filename
                    String fileName = "ChecklistItemImg-" + System.currentTimeMillis() + "-" + i + ".jpg";

                    // Upload file to S3
                    boolean uploadSuccess = fileStorageService.uploadFile(file, fileName, "inspection-checklist-images");
                    if (!uploadSuccess) {
                        // If upload fails, return error response
                        response.setChecklistItemUpdate(responseData);
                        response.setResponse(new Response("100", "Issue with file upload"));
                        return response;
                    }

                    // Create and save ChecklistItemImage entity
                    ChecklistItemImage image = new ChecklistItemImage();
                    image.setChecklistItemId(checklistItemId);
                    image.setImageName(fileName);
                    image.setImageType(".jpg");
                    image.setCaptureDate(now);

                    // Set isOkForFinalPdf based on status
                    image.setIsOkForFinalPdf(!ChecklistStatusNormalizer.isDeviation(status));

                    checklistItemImageRepository.save(image);
                }
            }

            // Update checklist item
            if (status != null && !status.isEmpty()) {
                item.setStatus(status);
                if (ChecklistStatusNormalizer.isDeviation(status)) {
                    item.setWasDev(true);
                }
            }

            if (request.getComment() != null && !request.getComment().isEmpty()) {
                item.setComment(request.getComment());
            }

            checklistItemRepository.save(item);

            // Evict checklist caches so web UI sees updated item status/images
            Integer projectId = request.getProjectID() > 0 ? request.getProjectID() : null;
            if (projectId == null && item.getChecklistId() != null) {
                projectId = projectChecklistRepository.findById(item.getChecklistId())
                        .map(ProjectChecklist::getProjectId)
                        .orElse(null);
            }
            evictProjectChecklistCaches(projectId, companyId);

            // Set response
            responseData.setProjectID(request.getProjectID());
            responseData.setChecklistID(request.getCheckListID());
            responseData.setQuestionID(request.getQuestionID());

            response.setChecklistItemUpdate(responseData);
            response.setResponse(new Response("200", "Success"));

        } catch (Exception e) {
            log.error("Error updating checklist item: {}", e.getMessage(), e);
            response.setChecklistItemUpdate(responseData);
            response.setResponse(new Response("100", "Failed"));
        }

        return response;
    }

    private void evictProjectChecklistCaches(Integer projectId, Integer companyId) {
        Cache projectChecklists = cacheManager.getCache("projectChecklists");
        if (projectChecklists != null && projectId != null) {
            projectChecklists.evict("project_" + projectId);
        }
        Cache projectChecklistsCache = cacheManager.getCache("projectChecklistsCache");
        if (projectChecklistsCache != null) {
            if (projectId != null && companyId != null) {
                projectChecklistsCache.evict(projectId + "_" + companyId);
            } else {
                projectChecklistsCache.clear();
            }
        }
    }

    @Override
    public List<InspectionLogDto> getProjectLogs(Integer projectId) {
        List<InspectionLog> logs = inspectionLogRepository.findByProjectId(projectId);

        return logs.stream()
                .map(log -> {
                    InspectionLogDto dto = new InspectionLogDto();
                    dto.setId(log.getId());
                    dto.setProjectId(log.getProjectId());
                    dto.setDateTime(log.getDateTime());
                    return dto;
                })
                .collect(Collectors.toList());
    }

    @Override
    public ChecklistTemplateContainer getChecklistTemplates(Integer companyId) {
        ChecklistTemplateContainer container = new ChecklistTemplateContainer();

        try {
            // 获取公司的检查清单模板，包含检查项
            List<ChecklistTemplate> templates = checklistTemplateRepository.findByCompanyIdWithItems(companyId);

            List<ChecklistTemplateDto> templateDtos = templates.stream()
                    .map(this::convertTemplateToDto)
                    .collect(Collectors.toList());

            container.setListOfTemplates(templateDtos);
            container.setResponse(new Response("200", "Success"));

        } catch (Exception e) {
            log.error("Error getting checklist templates for company {}: {}", companyId, e.getMessage(), e);
            container.setResponse(new Response("100", "Failed to get templates"));
        }

        return container;
    }



    @Override
    @Transactional
    public CreateChecklistWithProjectResponse createChecklistFromTemplate(CreateChecklistFromTemplateRequest request, Integer userId, Integer companyId) {
        CreateChecklistWithProjectResponse response = new CreateChecklistWithProjectResponse();

        try {
            // 1. 创建项目
            ProjectDto projectDto = buildProjectDtoFromSimpleRequest(request, userId, companyId);
            ProjectDto createdProject = projectService.createProject(projectDto, companyId);

            // 2. 创建检查清单
            ProjectChecklistDto checklistDto = new ProjectChecklistDto();
            checklistDto.setProjectId(createdProject.getId());
            checklistDto.setChecklistName(request.getChecklistName());
            checklistDto.setSortOrder(1);
            checklistDto.setStartDate(LocalDateTime.now());

            ProjectChecklistDto createdChecklist = projectChecklistService.createSingleProjectChecklist(checklistDto, companyId);

            // 3. 创建检查清单项
            List<ChecklistItemData> allCreatedItems = new ArrayList<>();
            int sortOrder = 1;

            // 3.1 从模板创建检查项
            if (request.getTemplateIds() != null && !request.getTemplateIds().isEmpty()) {
                for (Integer templateId : request.getTemplateIds()) {
                    // 获取模板
                    ChecklistTemplate template = checklistTemplateRepository.findById(templateId)
                            .orElseThrow(() -> new ResourceNotFoundException("Checklist template not found: " + templateId));

                    if (!template.getCompanyId().equals(companyId)) {
                        throw new BusinessException("Template " + templateId + " does not belong to the company");
                    }

                    // 从模板创建检查清单项
                    List<ChecklistItemTemplate> templateItems = checklistItemTemplateRepository.findByChecklistId(template.getId());

                    for (ChecklistItemTemplate templateItem : templateItems) {
                        ChecklistItemDto itemDto = new ChecklistItemDto();
                        itemDto.setChecklistId(createdChecklist.getId());
                        itemDto.setTitle(templateItem.getTitle());
                        itemDto.setSortOrder(sortOrder++);

                        ChecklistItemDto createdItem = projectChecklistService.createSingleProjectChecklistItem(itemDto, companyId);

                        ChecklistItemData itemData = new ChecklistItemData();
                        itemData.setId(createdItem.getId());
                        itemData.setTitle(createdItem.getTitle());
                        itemData.setSortOrder(createdItem.getSortOrder());
                        itemData.setStatus(createdItem.getStatus());
                        allCreatedItems.add(itemData);
                    }
                }
            }

            // 3.2 添加自定义检查项
            if (request.getCustomChecklistItems() != null && !request.getCustomChecklistItems().isEmpty()) {
                for (CreateChecklistItemRequest customItem : request.getCustomChecklistItems()) {
                    ChecklistItemDto itemDto = new ChecklistItemDto();
                    itemDto.setChecklistId(createdChecklist.getId());
                    itemDto.setTitle(customItem.getTitle());
                    itemDto.setSortOrder(customItem.getSortOrder() != null ? customItem.getSortOrder() : sortOrder++);

                    ChecklistItemDto createdItem = projectChecklistService.createSingleProjectChecklistItem(itemDto, companyId);

                    ChecklistItemData itemData = new ChecklistItemData();
                    itemData.setId(createdItem.getId());
                    itemData.setTitle(createdItem.getTitle());
                    itemData.setSortOrder(createdItem.getSortOrder());
                    itemData.setStatus(createdItem.getStatus());
                    allCreatedItems.add(itemData);
                }
            }

            // 3.3 如果既没有模板也没有自定义项，创建默认检查项
            if (allCreatedItems.isEmpty()) {
                List<CreateChecklistItemRequest> defaultItems = createDefaultChecklistItems();
                for (CreateChecklistItemRequest defaultItem : defaultItems) {
                    ChecklistItemDto itemDto = buildChecklistItemDto(defaultItem, createdChecklist.getId());
                    ChecklistItemDto createdItem = projectChecklistService.createSingleProjectChecklistItem(itemDto, companyId);

                    ChecklistItemData itemData = new ChecklistItemData();
                    itemData.setId(createdItem.getId());
                    itemData.setTitle(createdItem.getTitle());
                    itemData.setSortOrder(createdItem.getSortOrder());
                    itemData.setStatus(createdItem.getStatus());
                    allCreatedItems.add(itemData);
                }
            }

            // 4. 构建响应数据
            CreateChecklistWithProjectData data = new CreateChecklistWithProjectData();
            data.setProjectId(createdProject.getId());
            data.setProjectTitle(createdProject.getTitle());
            data.setChecklistId(createdChecklist.getId());
            data.setChecklistName(createdChecklist.getChecklistName());
            data.setChecklistItems(allCreatedItems);

            response.setData(data);
            response.setResponse(new Response("200", "Success"));

            log.info("Successfully created project {} with checklist {} containing {} items for user {}",
                    createdProject.getId(), createdChecklist.getId(), allCreatedItems.size(), userId);

        } catch (Exception e) {
            log.error("Error creating checklist from template for user {}: {}", userId, e.getMessage(), e);
            response.setResponse(new Response("100", "Failed to create checklist from template: " + e.getMessage()));
        }

        return response;
    }



    /**
     * 将ChecklistTemplate转换为DTO
     */
    private ChecklistTemplateDto convertTemplateToDto(ChecklistTemplate template) {
        ChecklistTemplateDto dto = new ChecklistTemplateDto();
        dto.setId(template.getId());
        dto.setTitle(template.getTitle());
        dto.setIsDefault(template.getIsDefault());
        dto.setSortOrder(template.getSortOrder());

        if (template.getChecklistItemTemplates() != null) {
            List<ChecklistItemTemplateDto> itemDtos = template.getChecklistItemTemplates().stream()
                    .map(this::convertItemTemplateToDto)
                    .collect(Collectors.toList());
            dto.setItems(itemDtos);
        }

        return dto;
    }

    /**
     * 将ChecklistItemTemplate转换为DTO
     */
    private ChecklistItemTemplateDto convertItemTemplateToDto(ChecklistItemTemplate template) {
        ChecklistItemTemplateDto dto = new ChecklistItemTemplateDto();
        dto.setId(template.getId());
        dto.setTitle(template.getTitle());
        dto.setSortOrder(template.getSortOrder());
        return dto;
    }

    /**
     * 从简化请求构建ProjectDto
     */
    private ProjectDto buildProjectDtoFromSimpleRequest(CreateChecklistFromTemplateRequest request, Integer userId, Integer companyId) {
        ProjectDto projectDto = new ProjectDto();
        // 使用检查清单名称作为项目标题
        projectDto.setTitle(request.getChecklistName());
        projectDto.setUserId(userId);
        projectDto.setCompanyId(companyId);
        projectDto.setInspectorId(userId); // 设置检查员为当前用户
        projectDto.setDated(LocalDateTime.now());
        return projectDto;
    }

    /**
     * 创建默认的检查清单项
     */
    private List<CreateChecklistItemRequest> createDefaultChecklistItems() {
        List<CreateChecklistItemRequest> defaultItems = new ArrayList<>();

        CreateChecklistItemRequest item1 = new CreateChecklistItemRequest();
        item1.setTitle("Infrastructure inspection");
        item1.setSortOrder(1);
        defaultItems.add(item1);

        CreateChecklistItemRequest item2 = new CreateChecklistItemRequest();
        item2.setTitle("Safety facility inspection");
        item2.setSortOrder(2);
        defaultItems.add(item2);

        CreateChecklistItemRequest item3 = new CreateChecklistItemRequest();
        item3.setTitle("Environmental quality inspection");
        item3.setSortOrder(3);
        defaultItems.add(item3);

        return defaultItems;
    }

    /**
     * 构建检查清单项DTO
     */
    private ChecklistItemDto buildChecklistItemDto(CreateChecklistItemRequest request, Integer checklistId) {
        ChecklistItemDto itemDto = new ChecklistItemDto();
        itemDto.setChecklistId(checklistId);
        itemDto.setTitle(request.getTitle());
        itemDto.setSortOrder(request.getSortOrder() != null ? request.getSortOrder() : 1);
        return itemDto;
    }

    private boolean checkStatusExists(String status, String requiredValue) {
        if (status == null || requiredValue == null) {
            return false;
        }

        String[] requiredValueSplit = requiredValue.split(",");
        String[] statusSplit = status.split(",");

        for (String reqValue : requiredValueSplit) {
            for (String statusValue : statusSplit) {
                if (statusValue.equals(reqValue)) {
                    return true;
                }
            }
        }

        return false;
    }
}
