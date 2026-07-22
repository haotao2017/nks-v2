package no.nks.service.impl;

import no.nks.dto.ProjectChecklistItemImageInspDataDto;
import no.nks.dto.ProjectChecklistItemsInspDataDto;
import no.nks.dto.ProjectChecklistInspDataDto;
import no.nks.dto.WrapperMultiProjectChecklistInspDataDto;
import no.nks.dto.WrapperProjectChecklistItemInspDataDto;
import no.nks.entity.ChecklistItem;
import no.nks.entity.ChecklistItemImage;
import no.nks.entity.ProjectChecklist;
import no.nks.entity.RequestResponse;
import no.nks.exception.ResourceNotFoundException;
import no.nks.repository.ChecklistItemImageRepository;
import no.nks.repository.ChecklistItemRepository;
import no.nks.repository.ProjectChecklistRepository;
import no.nks.repository.ProjectRepository;
import no.nks.service.IProjectInspectionService;
import no.nks.service.IS3Service;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.stream.Collectors;

import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.CacheEvict;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProjectInspectionServiceImpl implements IProjectInspectionService {

    private final IS3Service s3Service;
    private final ProjectRepository projectRepository;
    private final ProjectChecklistRepository projectChecklistRepository;
    private final ChecklistItemRepository checklistItemRepository;
    private final ChecklistItemImageRepository checklistItemImageRepository;

    @Override
    public WrapperMultiProjectChecklistInspDataDto getProjectChecklistsInsDataForProject(Integer projectId, Integer companyId) {
        log.debug("Fetching project checklists inspection data for project ID: {} and company ID: {}", projectId, companyId);

        // 实现从数据库获取项目检查单数据的逻辑
        // TODO: 实现从数据库中查询项目检查单数据

        // 返回包装好的项目检查单数据
        return new WrapperMultiProjectChecklistInspDataDto();
    }

    @Override
    public WrapperProjectChecklistItemInspDataDto updateProjectChecklistItemInspData(ProjectChecklistItemsInspDataDto checklistItemDto, Integer companyId) {
        log.debug("Updating project checklist item inspection data for item ID: {} in company: {}", checklistItemDto.getId(), companyId);

        if (checklistItemDto.getId() == null) {
            throw new IllegalArgumentException("Sjekklistepunkt-ID mangler");
        }

        // 查找检查单项目
        ChecklistItem checklistItem = checklistItemRepository.findById(checklistItemDto.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Sjekklistepunkt ble ikke funnet, ID: " + checklistItemDto.getId()));

        // 检查项目所属权限
        ProjectChecklist checklist = projectChecklistRepository.findById(checklistItem.getChecklistId())
                .orElseThrow(() -> new ResourceNotFoundException("Sjekkliste ble ikke funnet, ID: " + checklistItem.getChecklistId()));

        // 验证项目是否存在并属于指定公司
        if (!projectRepository.existsByIdAndCompanyId(checklist.getProjectId(), companyId)) {
            throw new ResourceNotFoundException("Du har ikke tilgang til dette prosjektets sjekklisteelement");
        }

        // 更新检查单项目字段
        if (checklistItemDto.getStatus() != null) {
            checklistItem.setStatus(checklistItemDto.getStatus());
        } else if (checklistItem.getStatus() == null) {
            // 如果数据库中的 status 也是 null，则设置一个默认值
            checklistItem.setStatus("Dev");
        }
        checklistItem.setComment(checklistItemDto.getComment());
        checklistItem.setWasDev(checklistItemDto.getWasDev());

        // 转换日期格式
        if (checklistItemDto.getFixDate() != null) {
            checklistItem.setFixDate(checklistItemDto.getFixDate().toInstant().atZone(java.time.ZoneId.systemDefault()).toLocalDateTime());
        }

        if (checklistItemDto.getEmailPartyDate() != null) {
            checklistItem.setEmailPartyDate(checklistItemDto.getEmailPartyDate().toInstant().atZone(java.time.ZoneId.systemDefault()).toLocalDateTime());
        }

        if (checklistItemDto.getPartyUploadedImgDate() != null) {
            checklistItem.setPartyUploadedImgDate(checklistItemDto.getPartyUploadedImgDate().toInstant().atZone(java.time.ZoneId.systemDefault()).toLocalDateTime());
        }

        checklistItem.setEmailTempToPartiesIds(checklistItemDto.getEmailTempToPartiesIds());
        checklistItem.setIsImageUploadedByParty(checklistItemDto.getIsImageUploadedByParty());

        // 保存更新
        ChecklistItem savedItem = checklistItemRepository.save(checklistItem);

        // 创建返回的DTO
        ProjectChecklistItemsInspDataDto resultItemDto = new ProjectChecklistItemsInspDataDto();
        resultItemDto.setId(savedItem.getId());
        resultItemDto.setChecklistId(savedItem.getChecklistId());
        resultItemDto.setTitle(savedItem.getTitle());
        resultItemDto.setStatus(savedItem.getStatus());
        resultItemDto.setComment(savedItem.getComment());
        resultItemDto.setWasDev(savedItem.getWasDev());

        // 设置日期字段
        resultItemDto.setFixDate(savedItem.getFixDate() != null ?
                java.util.Date.from(savedItem.getFixDate().atZone(java.time.ZoneId.systemDefault()).toInstant()) : null);
        resultItemDto.setEmailPartyDate(savedItem.getEmailPartyDate() != null ?
                java.util.Date.from(savedItem.getEmailPartyDate().atZone(java.time.ZoneId.systemDefault()).toInstant()) : null);
        resultItemDto.setPartyUploadedImgDate(savedItem.getPartyUploadedImgDate() != null ?
                java.util.Date.from(savedItem.getPartyUploadedImgDate().atZone(java.time.ZoneId.systemDefault()).toInstant()) : null);

        // 设置其他字段
        resultItemDto.setEmailTempToPartiesIds(savedItem.getEmailTempToPartiesIds());
        resultItemDto.setIsImageUploadedByParty(savedItem.getIsImageUploadedByParty());

        // 获取检查单项目的图片
        List<ChecklistItemImage> images = checklistItemImageRepository.findByChecklistItemId(savedItem.getId());
        List<ProjectChecklistItemImageInspDataDto> imageDtos = new ArrayList<>();

        // 将图片转换为DTO
        for (ChecklistItemImage image : images) {
            ProjectChecklistItemImageInspDataDto imageDto = new ProjectChecklistItemImageInspDataDto();
            imageDto.setId(image.getId());
            imageDto.setChecklistItemId(image.getChecklistItemId());
            imageDto.setImageName(image.getImageName());
            imageDto.setCaptureDate(image.getCaptureDate() != null ?
                    java.util.Date.from(image.getCaptureDate().atZone(java.time.ZoneId.systemDefault()).toInstant()) : null);
            imageDto.setImageType(image.getImageType());

            // 创建图片URL (如果需要)
            if (image.getImageName() != null && !image.getImageName().isEmpty()) {
                try {
                    String bucketName = "project-inspection-images"; // 根据实际情况配置
                    String bucketFolder = "checklist-images"; // 根据实际情况配置
                    String urlStaticPart = ""; // 根据实际CDN配置

                    String imageUrl = s3Service.createPublicURL(bucketName, urlStaticPart, bucketFolder, image.getImageName());
                    imageDto.setImageURL(imageUrl);
                } catch (Exception e) {
                    log.warn("Error creating URL for image {}: {}", image.getImageName(), e.getMessage());
                }
            }

            imageDtos.add(imageDto);
        }

        resultItemDto.setProjectChecklistItemImageInspData(imageDtos);

        // 返回包装好的更新后的检查单项目数据
        WrapperProjectChecklistItemInspDataDto result = new WrapperProjectChecklistItemInspDataDto();
        result.setProjectChecklistItemInspData(resultItemDto);

        log.debug("Successfully updated checklist item with ID: {}", savedItem.getId());

        return result;
    }

    @Override
    public CompletableFuture<String> uploadProjectInspectionImage(
            MultipartFile file, String bucketFolder, String fileName, Integer companyId) {
        log.debug("Uploading project inspection image to bucket folder: {} with name: {} for company ID: {}",
                bucketFolder, fileName, companyId);

        try {
            // 调用S3服务上传文件
            CompletableFuture<String> uploadResult = s3Service.uploadFileAsync(bucketFolder, file, fileName);

            // 异步处理上传结果
            return uploadResult.thenApply(result -> {
                // 上传成功后创建公共URL
                String bucketName = "project-inspection-images"; // 根据实际情况配置
                String urlStaticPart = "https://your-cdn-domain.com"; // 根据实际CDN配置

                return s3Service.createPublicURL(bucketName, urlStaticPart, bucketFolder, fileName);
            });
        } catch (Exception e) {
            log.error("Error uploading project inspection image: {}", e.getMessage(), e);
            CompletableFuture<String> future = new CompletableFuture<>();
            future.completeExceptionally(e);
            return future;
        }
    }

    @Override
    @Transactional
    @CacheEvict(value = "projectChecklistsCache", allEntries = true)
    public RequestResponse deleteSingleProjectChecklistItemImageInspData(Integer projectChecklistItemImageId, Integer companyId) {
        log.debug("删除项目检查清单项图片，图片ID: {}, 公司ID: {}", projectChecklistItemImageId, companyId);

        try {
            // 查询要删除的图片记录
            ChecklistItemImage image = checklistItemImageRepository.findById(projectChecklistItemImageId)
                .orElseThrow(() -> new ResourceNotFoundException("Bilderegistrering ble ikke funnet, ID: " + projectChecklistItemImageId));

            // 优化查询层级，减少数据库交互
            Integer checklistItemId = image.getChecklistItemId();

            // 获取检查清单项
            ChecklistItem checklistItem = checklistItemRepository.findById(checklistItemId)
                .orElseThrow(() -> new ResourceNotFoundException("Sjekklistepunkt ble ikke funnet, ID: " + checklistItemId));

            // 获取检查清单
            Integer checklistId = checklistItem.getChecklistId();
            ProjectChecklist checklist = projectChecklistRepository.findById(checklistId)
                .orElseThrow(() -> new ResourceNotFoundException("Sjekkliste ble ikke funnet, ID: " + checklistId));

            Integer projectId = checklist.getProjectId();

            // 验证项目是否属于当前公司
            if (!projectRepository.existsByIdAndCompanyId(projectId, companyId)) {
                log.warn("无权删除图片，图片ID: {}，公司ID: {}", projectChecklistItemImageId, companyId);
                return RequestResponse.failure("Du har ikke tilgang til å slette dette bildet");
            }

            // 保存图片名称，用于后续删除S3文件
            String imageName = image.getImageName();

            // 从数据库中删除记录
            checklistItemImageRepository.deleteById(projectChecklistItemImageId);
            log.debug("已从数据库中删除图片记录，图片ID: {}", projectChecklistItemImageId);

            // 如果图片名称不为空，异步方式从S3存储中删除
            if (imageName != null && !imageName.isEmpty()) {
                CompletableFuture.runAsync(() -> {
                    try {
                        // 使用StaticDetails中定义的常量构建文件夹路径
                        String bucketFolder = s3Service.getCompanyS3Folder(companyId) +
                                no.nks.config.StaticDetails.S3_BUCKET_FOLDER_FOR_INSPECTION_CHECKLIST_IMAGES;

                        // 尝试删除S3文件，但忽略结果 - 兼容旧版本，文件不存在或删除成功都视为正常
                        s3Service.deleteFile(bucketFolder, imageName);
                        log.debug("已异步删除S3图片文件: {}", imageName);
                    } catch (Exception e) {
                        // 完全忽略任何S3删除错误，确保方法总是返回成功
                        log.debug("尝试删除S3图片文件过程中出现问题，但不影响整体操作: {}", e.getMessage());
                    }
                });
            }

            return RequestResponse.success("Bildet er slettet");
        } catch (ResourceNotFoundException e) {
            log.error("Kunne ikke slette bildet: {}", e.getMessage());
            return RequestResponse.failure(e.getMessage());
        } catch (Exception e) {
            log.error("删除图片时En feil oppstod: {}", e.getMessage(), e);
            return RequestResponse.failure("Kunne ikke slette bildet: " + e.getMessage());
        }
    }

    @Override
    @Cacheable(value = "projectChecklistsCache", key = "#projectId + '_' + #companyId", unless = "#result == null")
    @Transactional
    public WrapperMultiProjectChecklistInspDataDto getAllProjectChecklistsInspData(
            Integer projectId, Integer companyId, IS3Service s3Service) {
        log.debug("Fetching all project checklists inspection data for project ID: {} and company ID: {}",
                projectId, companyId);

        // 验证项目是否存在并且属于指定的公司
        if (!projectRepository.existsByIdAndCompanyId(projectId, companyId)) {
            throw new ResourceNotFoundException("Prosjektet ble ikke funnet, ID: " + projectId);
        }

        // 使用并行处理和异步查询提高性能
        CompletableFuture<List<ProjectChecklist>> checklistsFuture = CompletableFuture.supplyAsync(() ->
            projectChecklistRepository.findByProjectId(projectId)
        );

        // 创建返回结果
        WrapperMultiProjectChecklistInspDataDto result = new WrapperMultiProjectChecklistInspDataDto();
        List<ProjectChecklistInspDataDto> checklistDtos = new ArrayList<>();

        try {
            // 获取项目检查清单列表
            List<ProjectChecklist> checklists = checklistsFuture.get();

            if (checklists.isEmpty()) {
                result.setMultiProjectChecklistInspData(checklistDtos);
                return result;
            }

            // 收集所有检查清单ID，用于批量查询
            List<Integer> checklistIds = checklists.stream()
                .map(ProjectChecklist::getId)
                .collect(Collectors.toList());

            // 异步批量获取所有检查清单项
            CompletableFuture<Map<Integer, List<ChecklistItem>>> itemsFuture = CompletableFuture.supplyAsync(() -> {
                List<ChecklistItem> allItems = checklistItemRepository.findByChecklistIdIn(checklistIds);
                return allItems.stream()
                    .collect(Collectors.groupingBy(ChecklistItem::getChecklistId));
            });

            // 异步批量获取所有检查清单项图片
            CompletableFuture<Map<Integer, List<ChecklistItemImage>>> imagesFuture = CompletableFuture.supplyAsync(() -> {
                // 先获取所有检查单项
                List<ChecklistItem> allItems = checklistItemRepository.findByChecklistIdIn(checklistIds);
                List<Integer> itemIds = allItems.stream()
                    .map(ChecklistItem::getId)
                    .collect(Collectors.toList());

                if (itemIds.isEmpty()) {
                    return Collections.emptyMap();
                }

                // 批量获取所有图片
                List<ChecklistItemImage> allImages = new ArrayList<>();
                for (Integer itemId : itemIds) {
                    List<ChecklistItemImage> images = checklistItemImageRepository.findByChecklistItemId(itemId);
                    allImages.addAll(images);
                }
                return allImages.stream()
                    .collect(Collectors.groupingBy(ChecklistItemImage::getChecklistItemId));
            });

            // 等待所有异步查询完成
            Map<Integer, List<ChecklistItem>> itemsByChecklistId = itemsFuture.get();
            Map<Integer, List<ChecklistItemImage>> imagesByItemId = imagesFuture.get();

            // 使用批量数据填充DTO
            for (ProjectChecklist checklist : checklists) {
                ProjectChecklistInspDataDto checklistDto = mapChecklistToDto(checklist);

                // 填充检查清单项
                List<ChecklistItem> checklistItems = itemsByChecklistId.getOrDefault(checklist.getId(), Collections.emptyList());
                List<ProjectChecklistItemsInspDataDto> itemDtos = new ArrayList<>();

                for (ChecklistItem item : checklistItems) {
                    ProjectChecklistItemsInspDataDto itemDto = mapChecklistItemToDto(item);

                    // 填充检查清单项图片
                    List<ChecklistItemImage> images = imagesByItemId.getOrDefault(item.getId(), Collections.emptyList());
                    List<ProjectChecklistItemImageInspDataDto> imageDtos = images.stream()
                        .map(image -> mapChecklistItemImageToDto(image, s3Service))
                        .collect(Collectors.toList());

                    itemDto.setProjectChecklistItemImageInspData(imageDtos);
                    itemDtos.add(itemDto);
                }

                checklistDto.setProjectChecklistItemsInspData(itemDtos.stream()
                    .map(itemDto -> {
                        ProjectChecklistInspDataDto.ProjectChecklistItemsInspDataDto innerDto =
                            new ProjectChecklistInspDataDto.ProjectChecklistItemsInspDataDto();
                        innerDto.setId(itemDto.getId());
                        innerDto.setChecklistId(itemDto.getChecklistId());
                        innerDto.setTitle(itemDto.getTitle());
                        innerDto.setStatus(itemDto.getStatus());
                        innerDto.setComment(itemDto.getComment());
                        innerDto.setWasDev(itemDto.getWasDev());

                        // 转换图片列表
                        if (itemDto.getProjectChecklistItemImageInspData() != null) {
                            List<ProjectChecklistInspDataDto.ProjectChecklistItemImageInspDataDto> innerImageDtos =
                                itemDto.getProjectChecklistItemImageInspData().stream()
                                    .map(imageDto -> {
                                        ProjectChecklistInspDataDto.ProjectChecklistItemImageInspDataDto innerImageDto =
                                            new ProjectChecklistInspDataDto.ProjectChecklistItemImageInspDataDto();
                                        innerImageDto.setId(imageDto.getId());
                                        innerImageDto.setChecklistItemId(imageDto.getChecklistItemId());
                                        innerImageDto.setImageName(imageDto.getImageName());
                                        innerImageDto.setImageType(imageDto.getImageType());

                                        // 转换日期
                                        if (imageDto.getCaptureDate() != null) {
                                            innerImageDto.setCaptureDate(imageDto.getCaptureDate().toInstant()
                                                .atZone(java.time.ZoneId.systemDefault())
                                                .toLocalDateTime());
                                        }

                                        innerImageDto.setPartyId(imageDto.getPartyId());
                                        return innerImageDto;
                                    })
                                    .collect(Collectors.toList());

                            innerDto.setProjectChecklistItemImageInspData(innerImageDtos);
                        }

                        return innerDto;
                    })
                    .collect(Collectors.toList()));

                checklistDtos.add(checklistDto);
            }

        } catch (Exception e) {
            log.error("Error fetching project checklists data: {}", e.getMessage(), e);
            // 返回空结果而非抛出异常，这样客户端仍然能得到有效响应
        }

        result.setMultiProjectChecklistInspData(checklistDtos);
        log.debug("Found {} checklists with inspection data for project ID: {}", checklistDtos.size(), projectId);

        return result;
    }

    /**
     * 将ProjectChecklist实体转换为DTO
     */
    private ProjectChecklistInspDataDto mapChecklistToDto(ProjectChecklist checklist) {
        ProjectChecklistInspDataDto dto = new ProjectChecklistInspDataDto();
        dto.setId(checklist.getId());
        dto.setProjectId(checklist.getProjectId());
        dto.setChecklistName(checklist.getChecklistName());
        dto.setComment(checklist.getComment());

        if (checklist.getStartDate() != null) {
            dto.setStartDate(java.util.Date.from(checklist.getStartDate()
                    .atZone(java.time.ZoneId.systemDefault()).toInstant()));
        }

        if (checklist.getEndDate() != null) {
            dto.setEndDate(java.util.Date.from(checklist.getEndDate()
                    .atZone(java.time.ZoneId.systemDefault()).toInstant()));
        }

        return dto;
    }

    /**
     * 将ChecklistItem实体转换为DTO
     */
    private ProjectChecklistItemsInspDataDto mapChecklistItemToDto(ChecklistItem item) {
        ProjectChecklistItemsInspDataDto dto = new ProjectChecklistItemsInspDataDto();
        dto.setId(item.getId());
        dto.setChecklistId(item.getChecklistId());
        dto.setTitle(item.getTitle());
        dto.setStatus(item.getStatus());
        dto.setComment(item.getComment());
        dto.setWasDev(item.getWasDev());

        if (item.getFixDate() != null) {
            dto.setFixDate(java.util.Date.from(item.getFixDate()
                    .atZone(java.time.ZoneId.systemDefault()).toInstant()));
        }

        if (item.getEmailPartyDate() != null) {
            dto.setEmailPartyDate(java.util.Date.from(item.getEmailPartyDate()
                    .atZone(java.time.ZoneId.systemDefault()).toInstant()));
        }

        if (item.getPartyUploadedImgDate() != null) {
            dto.setPartyUploadedImgDate(java.util.Date.from(item.getPartyUploadedImgDate()
                    .atZone(java.time.ZoneId.systemDefault()).toInstant()));
        }

        dto.setEmailTempToPartiesIds(item.getEmailTempToPartiesIds());
        dto.setIsImageUploadedByParty(item.getIsImageUploadedByParty());

        return dto;
    }

    /**
     * 将ChecklistItemImage实体转换为DTO
     */
    private ProjectChecklistItemImageInspDataDto mapChecklistItemImageToDto(ChecklistItemImage image, IS3Service s3Service) {
        ProjectChecklistItemImageInspDataDto dto = new ProjectChecklistItemImageInspDataDto();
        dto.setId(image.getId());
        dto.setChecklistItemId(image.getChecklistItemId());
        dto.setImageName(image.getImageName());
        dto.setImageType(image.getImageType());

        if (image.getCaptureDate() != null) {
            dto.setCaptureDate(java.util.Date.from(image.getCaptureDate()
                    .atZone(java.time.ZoneId.systemDefault()).toInstant()));
        }

        // 创建图片URL (如果需要)
        if (image.getImageName() != null && !image.getImageName().isEmpty()) {
            try {
                String bucketName = "project-inspection-images"; // 根据实际情况配置
                String bucketFolder = "checklist-images"; // 根据实际情况配置
                String urlStaticPart = ""; // 根据实际CDN配置

                String imageUrl = s3Service.createPublicURL(bucketName, urlStaticPart, bucketFolder, image.getImageName());
                dto.setImageURL(imageUrl);
            } catch (Exception e) {
                log.warn("Error creating URL for image {}: {}", image.getImageName(), e.getMessage());
            }
        }

        return dto;
    }

    @Override
    @Transactional
    @CacheEvict(value = "projectChecklistsCache", key = "#param.projectChecklistItemInspData.checklistId + '_*'", allEntries = true)
    public WrapperProjectChecklistItemInspDataDto updateSingleProjectChecklistItemInspData(
            WrapperProjectChecklistItemInspDataDto param, Integer companyId) {
        log.debug("Updating single project checklist item inspection data for company ID: {}", companyId);

        // 获取检查单项目数据
        ProjectChecklistItemsInspDataDto checklistItemDto = param.getProjectChecklistItemInspData();

        if (checklistItemDto == null || checklistItemDto.getId() == null) {
            throw new IllegalArgumentException("Sjekklistepunktdata mangler eller ID er ugyldig");
        }

        log.debug("Updating checklist item with ID: {}", checklistItemDto.getId());

        // 使用单一查询获取检查单项目和验证权限
        ChecklistItem checklistItem = checklistItemRepository.findById(checklistItemDto.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Sjekklistepunkt ble ikke funnet, ID: " + checklistItemDto.getId()));

        // 检查项目所属权限
        Integer checklistId = checklistItem.getChecklistId();

        // 批量查询与验证，减少数据库交互
        ProjectChecklist checklist = projectChecklistRepository.findById(checklistId)
                .orElseThrow(() -> new ResourceNotFoundException("Sjekkliste ble ikke funnet, ID: " + checklistId));

        // 验证项目是否存在并属于指定公司
        Integer projectId = checklist.getProjectId();
        if (!projectRepository.existsByIdAndCompanyId(projectId, companyId)) {
            throw new ResourceNotFoundException("Du har ikke tilgang til dette prosjektets sjekklisteelement");
        }

        // 使用选择性更新，只更新变化的字段
        boolean hasChanges = false;

        // 更新检查单项目字段
        if (checklistItemDto.getStatus() != null && !checklistItemDto.getStatus().equals(checklistItem.getStatus())) {
            checklistItem.setStatus(checklistItemDto.getStatus());
            hasChanges = true;
        } else if (checklistItem.getStatus() == null) {
            checklistItem.setStatus("Dev");
            hasChanges = true;
        }

        if ((checklistItemDto.getComment() == null && checklistItem.getComment() != null) ||
                (checklistItemDto.getComment() != null && !checklistItemDto.getComment().equals(checklistItem.getComment()))) {
            checklistItem.setComment(checklistItemDto.getComment());
            hasChanges = true;
        }

        if (checklistItemDto.getWasDev() != null && !checklistItemDto.getWasDev().equals(checklistItem.getWasDev())) {
            checklistItem.setWasDev(checklistItemDto.getWasDev());
            hasChanges = true;
        }

        // 转换日期格式
        if (checklistItemDto.getFixDate() != null) {
            java.time.LocalDateTime fixDate = checklistItemDto.getFixDate().toInstant()
                    .atZone(java.time.ZoneId.systemDefault()).toLocalDateTime();
            if (!fixDate.equals(checklistItem.getFixDate())) {
                checklistItem.setFixDate(fixDate);
                hasChanges = true;
            }
        } else if (checklistItem.getFixDate() != null) {
            checklistItem.setFixDate(null);
            hasChanges = true;
        }

        if (checklistItemDto.getEmailPartyDate() != null) {
            java.time.LocalDateTime emailDate = checklistItemDto.getEmailPartyDate().toInstant()
                    .atZone(java.time.ZoneId.systemDefault()).toLocalDateTime();
            if (!emailDate.equals(checklistItem.getEmailPartyDate())) {
                checklistItem.setEmailPartyDate(emailDate);
                hasChanges = true;
            }
        } else if (checklistItem.getEmailPartyDate() != null) {
            checklistItem.setEmailPartyDate(null);
            hasChanges = true;
        }

        if (checklistItemDto.getPartyUploadedImgDate() != null) {
            java.time.LocalDateTime uploadDate = checklistItemDto.getPartyUploadedImgDate().toInstant()
                    .atZone(java.time.ZoneId.systemDefault()).toLocalDateTime();
            if (!uploadDate.equals(checklistItem.getPartyUploadedImgDate())) {
                checklistItem.setPartyUploadedImgDate(uploadDate);
                hasChanges = true;
            }
        } else if (checklistItem.getPartyUploadedImgDate() != null) {
            checklistItem.setPartyUploadedImgDate(null);
            hasChanges = true;
        }

        if ((checklistItemDto.getEmailTempToPartiesIds() == null && checklistItem.getEmailTempToPartiesIds() != null) ||
                (checklistItemDto.getEmailTempToPartiesIds() != null &&
                !checklistItemDto.getEmailTempToPartiesIds().equals(checklistItem.getEmailTempToPartiesIds()))) {
            checklistItem.setEmailTempToPartiesIds(checklistItemDto.getEmailTempToPartiesIds());
            hasChanges = true;
        }

        if (checklistItemDto.getIsImageUploadedByParty() != null &&
                !checklistItemDto.getIsImageUploadedByParty().equals(checklistItem.getIsImageUploadedByParty())) {
            checklistItem.setIsImageUploadedByParty(checklistItemDto.getIsImageUploadedByParty());
            hasChanges = true;
        }

        // 只有在有变更时才保存，减少数据库交互
        ChecklistItem savedItem = hasChanges ? checklistItemRepository.save(checklistItem) : checklistItem;

        // 创建返回的DTO
        ProjectChecklistItemsInspDataDto resultItemDto = mapChecklistItemToDto(savedItem);

        // 获取检查单项目的图片
        List<ChecklistItemImage> images = checklistItemImageRepository.findByChecklistItemId(savedItem.getId());

        // 使用批量转换，减少循环处理
        List<ProjectChecklistItemImageInspDataDto> imageDtos = images.stream()
            .map(image -> mapChecklistItemImageToDto(image, s3Service))
            .collect(Collectors.toList());

        resultItemDto.setProjectChecklistItemImageInspData(imageDtos);

        // 返回包装好的更新后的检查单项目数据
        WrapperProjectChecklistItemInspDataDto result = new WrapperProjectChecklistItemInspDataDto();
        result.setProjectChecklistItemInspData(resultItemDto);

        log.debug("Successfully updated checklist item with ID: {}", savedItem.getId());

        return result;
    }
}
