package no.nks.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import no.nks.dto.*;
import no.nks.entity.*;
import no.nks.repository.ChecklistItemImageRepository;
import no.nks.repository.ChecklistItemRepository;
import no.nks.repository.DocRepository;
import no.nks.repository.EmailHistoryRepository;
import no.nks.repository.DocTypeRepository;
import no.nks.repository.ProjectChecklistRepository;
import no.nks.service.IS3Service;
import no.nks.service.PartyDocService;
import org.springframework.beans.factory.DisposableBean;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

/**
 * 参与方文档服务实现类
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class PartyDocServiceImpl implements PartyDocService {

    private final EmailHistoryRepository emailHistoryRepository;
    private final DocRepository docRepository;
    private final DocTypeRepository docTypeRepository;
    private final ProjectChecklistRepository projectChecklistRepository;
    private final ChecklistItemRepository checklistItemRepository;
    private final ChecklistItemImageRepository checklistItemImageRepository;
    private final IS3Service s3Service;

    @Qualifier("dbCallbackExecutor")
    private final ExecutorService dbCallbackExecutor;


    private static final String STATIC_DETAILS_URL_KEY_FOR_OLD_SYSTEM_REDIRECT = "hZ8ygadsDaOLDSYS";

    @Override
    public boolean authenticateThirdPartyDocRequiredRequest(Integer workflowId, Integer projectId, Integer partyId, Integer partyTypeId, String urlKey) {
        if (STATIC_DETAILS_URL_KEY_FOR_OLD_SYSTEM_REDIRECT.equals(urlKey)) {
            return emailHistoryRepository.existsByProjectIdAndPartyIdAndPartyTypeIdAndWorkflowId(
                    projectId, partyId, partyTypeId, workflowId);
        } else {
            return emailHistoryRepository.existsByProjectIdAndPartyIdAndPartyTypeIdAndWorkflowIdAndUrlKey(
                    projectId, partyId, partyTypeId, workflowId, urlKey);
        }
    }

    @Override
    public WrapperProjectPartyDocsMulti getProjectPartyDocsList(WrapperProjectPartyDocsMulti request) {
        // 获取该参与方类型的所有文档类型
        List<DocType> docTypes = docTypeRepository.findByPartyTypeIdOrderBySortOrder(request.getPartyTypeID());

        // 将DocType实体映射到DocTypeDto对象
        List<DocTypeDto> docTypeDtos = docTypes.stream()
                .map(docType -> new DocTypeDto(
                        docType.getId(),
                        docType.getDocName(),
                        docType.getIsRequired()))
                .collect(Collectors.toList());

        // 设置响应结果
        request.setProjectPartyDocsMulti(docTypeDtos);
        return request;
    }

    @Override
    public no.nks.dto.RequestResponse uploadDocumentFromParty(WrapperProjectPartyDocsSingle request, List<MultipartFile> files) {
        if (files == null || files.isEmpty()) {
            return no.nks.dto.RequestResponse.failure("没有文件被上传");
        }

        try {
            MultipartFile file = files.get(0);
            String originalFilename = file.getOriginalFilename();

            // 创建文件夹路径
            String folderPath = String.format("projects/%d/party/%d/%d",
                    request.getProjectID(), request.getPartyTypeID(), request.getPartyID());

            // 生成唯一文件名
            String uniqueFileName = UUID.randomUUID().toString() + "_" + originalFilename;

            // 异步上传文件到S3
            s3Service.uploadFileAsync(folderPath, file, uniqueFileName).thenAccept(uploadedPath -> {
                // 保存文档信息到数据库
                Doc doc = new Doc();
                doc.setPartyId(request.getPartyID());
                doc.setPartyTypeId(request.getPartyTypeID());
                doc.setPartyDocTypeId(request.getProjectPartyDocsSingle().getPartyDocTypeId());
                doc.setProjectId(request.getProjectID());
                doc.setFileName(uniqueFileName);
                doc.setDate(LocalDateTime.now());
                doc.setWorkflowId(request.getWorkflowId());
                doc.setIsApproved(false);

                docRepository.save(doc);
            });

            return no.nks.dto.RequestResponse.success("文档已成功上传");
        } catch (Exception e) {
            log.error("上传文档失败", e);
            return no.nks.dto.RequestResponse.failure("上传文档失败: " + e.getMessage());
        }
    }

    @Override
    public CountProjectPartyDocsUploaded getDocumentsListCountUploadByParty(WrapperProjectPartyDocsMulti request) {
        CountProjectPartyDocsUploaded result = new CountProjectPartyDocsUploaded();
        result.setWorkflowId(request.getWorkflowId());
        result.setProjectID(request.getProjectID());
        result.setPartyID(request.getPartyID());
        result.setPartyTypeID(request.getPartyTypeID());
        result.setUrlKey(request.getUrlKey());

        // 获取已上传的文档
        List<Doc> docs = docRepository.findByProjectIdAndPartyIdAndPartyTypeIdAndWorkflowId(
                request.getProjectID(), request.getPartyID(), request.getPartyTypeID(), request.getWorkflowId());

        result.setUploadedFilesCount(docs.size());

        // 统计按文档类型的上传数量
        if (!docs.isEmpty()) {
            // 按文档类型ID分组并计数
            Map<Integer, Long> docTypeCountMap = docs.stream()
                    .filter(doc -> doc.getPartyDocTypeId() != null)
                    .collect(Collectors.groupingBy(Doc::getPartyDocTypeId, Collectors.counting()));

            // 转换为DTO列表
            List<CountProjectPartyDocsUploaded.DocumentCountByDocTypeIdDto> docTypeCountList = docTypeCountMap.entrySet().stream()
                    .map(entry -> new CountProjectPartyDocsUploaded.DocumentCountByDocTypeIdDto(
                            entry.getKey(), entry.getValue().intValue()))
                    .collect(Collectors.toList());

            result.setDocumentsCountByDocType(docTypeCountList);
        }

        return result;
    }

    @Override
    public WrapperProjectSinglePartyDocsUploadedFileList getProjectSinglePartyDocsUploadedFileList(WrapperProjectSinglePartyDocsUploadedFileList request) {
        // 获取已上传的文档
        List<Doc> docs = docRepository.findByProjectIdAndPartyIdAndPartyTypeIdAndWorkflowId(
                request.getProjectID(), request.getPartyID(), request.getPartyTypeID(), request.getWorkflowId());

        // 转换为DTO列表
        List<ProjectSinglePartyDocsFilesListDto> filesList = docs.stream()
                .map(doc -> {
                    ProjectSinglePartyDocsFilesListDto dto = new ProjectSinglePartyDocsFilesListDto();
                    dto.setId(doc.getId());
                    dto.setFileName(doc.getFileName());
                    dto.setPartyDocTypeId(doc.getPartyDocTypeId());
                    return dto;
                })
                .collect(Collectors.toList());

        request.setFilesList(filesList);
        return request;
    }

    @Override
    public WrapperProjectPartyDocsInspection getProjectChecklistsItemPartyData(WrapperProjectPartyDocsInspection request) {
        // 解析检查清单项目ID列表
        String[] checklistItemIds = request.getChecklistItemIdCommaSeperated().split(",");
        List<Integer> checklistItemIdList = Arrays.stream(checklistItemIds)
                .map(Integer::parseInt)
                .collect(Collectors.toList());

        // 获取检查清单项目
        List<ChecklistItem> checklistItems = checklistItemRepository.findByIdIn(checklistItemIdList);

        if (checklistItems.isEmpty()) {
            return request;
        }

        // 获取第一个检查清单项目的检查清单ID
        Integer checklistId = checklistItems.get(0).getChecklistId();

        // 获取检查清单
        ProjectChecklist projectChecklist = projectChecklistRepository.findById(checklistId)
                .orElse(null);

        if (projectChecklist == null) {
            return request;
        }

        // 创建检查清单检查数据DTO
        ProjectChecklistInspDataDto projectChecklistInspData = new ProjectChecklistInspDataDto();
        projectChecklistInspData.setId(projectChecklist.getId());
        projectChecklistInspData.setProjectId(projectChecklist.getProjectId());
        projectChecklistInspData.setChecklistName(projectChecklist.getChecklistName());
        projectChecklistInspData.setComment(projectChecklist.getComment());

        // 创建检查清单项目检查数据DTO列表
        List<ProjectChecklistInspDataDto.ProjectChecklistItemsInspDataDto> itemsInspData = new ArrayList<>();

        for (ChecklistItem checklistItem : checklistItems) {
            // 创建内部类实例
            ProjectChecklistInspDataDto.ProjectChecklistItemsInspDataDto itemInspData =
                    new ProjectChecklistInspDataDto.ProjectChecklistItemsInspDataDto();

            // 设置基本字段
            itemInspData.setId(checklistItem.getId());
            itemInspData.setChecklistId(checklistItem.getChecklistId());
            itemInspData.setTitle(checklistItem.getTitle());
            itemInspData.setStatus(checklistItem.getStatus());
            itemInspData.setComment(checklistItem.getComment());
            itemInspData.setWasDev(checklistItem.getWasDev());

            // 设置日期字段
            if (checklistItem.getFixDate() != null) {
                itemInspData.setFixDate(Date.from(checklistItem.getFixDate()
                        .atZone(java.time.ZoneId.systemDefault()).toInstant()));
            }

            if (checklistItem.getEmailPartyDate() != null) {
                itemInspData.setEmailPartyDate(Date.from(checklistItem.getEmailPartyDate()
                        .atZone(java.time.ZoneId.systemDefault()).toInstant()));
            }

            if (checklistItem.getPartyUploadedImgDate() != null) {
                itemInspData.setPartyUploadedImgDate(Date.from(checklistItem.getPartyUploadedImgDate()
                        .atZone(java.time.ZoneId.systemDefault()).toInstant()));
            }

            // 设置其他必需字段
            itemInspData.setEmailTempToPartiesIds(checklistItem.getEmailTempToPartiesIds());
            itemInspData.setIsImageUploadedByParty(checklistItem.getIsImageUploadedByParty());

            // 获取检查清单项目图片
            List<ChecklistItemImage> images = checklistItemImageRepository
                    .findByChecklistItemIdAndPartyId(checklistItem.getId(), request.getPartyID());

            // 创建检查清单项目图片检查数据DTO列表
            List<ProjectChecklistInspDataDto.ProjectChecklistItemImageInspDataDto> imageInspData = new ArrayList<>();
            for (ChecklistItemImage image : images) {
                ProjectChecklistInspDataDto.ProjectChecklistItemImageInspDataDto imageDto =
                        new ProjectChecklistInspDataDto.ProjectChecklistItemImageInspDataDto();

                // 设置基本字段
                imageDto.setId(image.getId());
                imageDto.setChecklistItemId(image.getChecklistItemId());
                imageDto.setImageName(image.getImageName());
                imageDto.setImageType(image.getImageType());
                imageDto.setPartyId(image.getPartyId());
                imageDto.setIsOkForFinalPdf(image.getIsOkForFinalPdf());

                // 设置日期和URL字段
                if (image.getCaptureDate() != null) {
                    imageDto.setCaptureDate(image.getCaptureDate());
                }

                // 这里不实际设置URL，URL会在控制器层通过S3Service生成
                // imageDto.setImageURL("URL将在控制器层设置");

                imageInspData.add(imageDto);
            }

            itemInspData.setProjectChecklistItemImageInspData(imageInspData);
            itemsInspData.add(itemInspData);
        }

        projectChecklistInspData.setProjectChecklistItemsInspData(itemsInspData);
        request.setProjectChecklistThirdPartyInspData(projectChecklistInspData);

        return request;
    }

    @Override
    public no.nks.dto.RequestResponse uploadChecklistItemImageInspectinDataFromParty(WrapperProjectPartyDocsInspection request, List<MultipartFile> files) {
        if (files == null || files.isEmpty()) {
            return no.nks.dto.RequestResponse.failure("没有文件被上传");
        }

        try {
            String[] checklistItemIdsRaw = request.getChecklistItemIdCommaSeperated().split(",");
            List<Integer> checklistItemIdList = Arrays.stream(checklistItemIdsRaw)
                    .map(s -> {
                        try {
                            return Integer.parseInt(s.trim());
                        } catch (NumberFormatException e) {
                            log.warn("无法解析检查清单项ID: '{}'. 将跳过此ID.", s, e);
                            return null;
                        }
                    })
                    .filter(Objects::nonNull)
                    .collect(Collectors.toList());

            if (checklistItemIdList.isEmpty()) {
                log.warn("在解析后，没有提供有效的检查清单项目ID。原始输入: {}", request.getChecklistItemIdCommaSeperated());
                return no.nks.dto.RequestResponse.failure("没有提供有效的检查清单项目ID");
            }
            log.info("开始处理检查清单项目ID列表: {} (共 {} 个有效ID)", checklistItemIdList, checklistItemIdList.size());

            List<ChecklistItem> checklistItems = checklistItemRepository.findByIdIn(checklistItemIdList);
            if (checklistItems.isEmpty()) {
                log.warn("根据提供的ID列表 {} 未找到任何检查清单项目实体.", checklistItemIdList);
                return no.nks.dto.RequestResponse.failure("未找到指定的检查清单项目");
            }
            log.info("找到了 {} 个匹配的检查清单项目实体.", checklistItems.size());

            for (MultipartFile file : files) {
                String originalFilename = file.getOriginalFilename();
                String uniqueFileName = UUID.randomUUID().toString() + "_" + (originalFilename == null ? "unknown_file" : originalFilename);

                String fileExtension = "";
                if (originalFilename != null && originalFilename.lastIndexOf(".") != -1) {
                    fileExtension = originalFilename.substring(originalFilename.lastIndexOf(".") + 1);
                }
                final String finalFileExtension = fileExtension;
                final String finalUniqueFileName = uniqueFileName;

                log.debug("准备上传文件: {}, 唯一名: {}", originalFilename, finalUniqueFileName);

                for (ChecklistItem checklistItem : checklistItems) {
                    final Integer currentChecklistItemId = checklistItem.getId();
                    String folderPath = String.format("projects/%d/checklist/%d",
                            request.getProjectID(), currentChecklistItemId);

                    log.debug("计划上传文件 {} 到路径 {} (检查项ID: {})", finalUniqueFileName, folderPath, currentChecklistItemId);

                    s3Service.uploadFileAsync(folderPath, file, finalUniqueFileName)
                        .thenRunAsync(() -> {
                            try {
                                log.debug("S3上传成功: {}/{}. 开始更新数据库 (检查项ID: {}) 使用 dbCallbackExecutor", folderPath, finalUniqueFileName, currentChecklistItemId);
                                ChecklistItemImage image = new ChecklistItemImage();
                                image.setChecklistItemId(currentChecklistItemId);
                                image.setImageName(finalUniqueFileName);
                                image.setImageType(finalFileExtension);
                                image.setCaptureDate(LocalDateTime.now());
                                image.setPartyId(request.getPartyID());
                                image.setIsOkForFinalPdf(false);

                                checklistItemImageRepository.save(image);
                                log.debug("DB: ChecklistItemImage 已保存 (ID: {}, 检查项ID: {})", image.getId(), currentChecklistItemId);

                                ChecklistItem itemToUpdate = checklistItemRepository.findById(currentChecklistItemId).orElse(null);
                                if (itemToUpdate != null) {
                                    itemToUpdate.setIsImageUploadedByParty(true);
                                    itemToUpdate.setPartyUploadedImgDate(LocalDateTime.now());
                                    checklistItemRepository.save(itemToUpdate);
                                    log.debug("DB: ChecklistItem 已更新 (ID: {}), isImageUploadedByParty=true", itemToUpdate.getId());
                                } else {
                                    log.warn("S3回调: 更新ChecklistItem时未找到实体 (ID: {}). ChecklistItemImage (ID: {}) 可能已保存.",
                                        currentChecklistItemId, image.getId());
                                }
                            } catch (Exception e) {
                                log.error("S3回调处理失败 (检查项ID: {}, 文件: {}): {}",
                                    currentChecklistItemId, finalUniqueFileName, e.getMessage(), e);
                            }
                        }, dbCallbackExecutor)
                        .exceptionally(ex -> {
                            log.error("S3上传或回调链中发生严重错误 (检查项ID: {}, 文件: {}): {}",
                                currentChecklistItemId, finalUniqueFileName, ex.getMessage(), ex);
                            return null;
                        });
                }
            }

            log.info("所有图片上传任务已分派到后台处理 (处理了 {} 个文件，对应 {} 个检查清单项).", files.size(), checklistItems.size());
            return no.nks.dto.RequestResponse.success("图片上传请求已接受，正在后台处理。");

        } catch (Exception e) {
            log.error("在安排图片上传任务的同步阶段发生错误: {}", e.getMessage(), e);
            return no.nks.dto.RequestResponse.failure("图片上传请求初始化失败: " + e.getMessage());
        }
    }
}
