package no.nks.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import no.nks.dto.*;
import no.nks.service.PartyDocService;
import no.nks.service.IS3Service;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.CacheEvict;

import java.util.List;

/**
 * 参与方文档控制器
 * 处理参与方文档相关请求
 * 注：外部参与方通过 UrlKey 免登录访问，端点保持公开，不加 @PreAuthorize。
 */
@RestController
@RequestMapping("/api/PartyDoc")
@RequiredArgsConstructor
@Slf4j
public class PartyDocController {

    private final PartyDocService partyDocService;
    private final ObjectMapper objectMapper;
    private final IS3Service s3Service;

    /**
     * 获取参与方需要上传的文档列表
     *
     * @param WorkflowId 工作流ID
     * @param ProjectID 项目ID
     * @param PartyID 参与方ID
     * @param PartyTypeID 参与方类型ID
     * @param UrlKey URL密钥
     * @return 文档列表
     */
    @GetMapping("/GetDocumentsListRequiredFromParty")
    @Cacheable(value = "partyDocs", key = "{#WorkflowId, #ProjectID, #PartyID, #PartyTypeID, #UrlKey}")
    public ResponseEntity<?> getDocumentsListRequiredFromParty(
            @RequestParam Integer WorkflowId,
            @RequestParam Integer ProjectID,
            @RequestParam Integer PartyID,
            @RequestParam Integer PartyTypeID,
            @RequestParam String UrlKey) {

        WrapperProjectPartyDocsMulti requestWrapper = new WrapperProjectPartyDocsMulti();
        requestWrapper.setWorkflowId(WorkflowId);
        requestWrapper.setProjectID(ProjectID);
        requestWrapper.setPartyID(PartyID);
        requestWrapper.setPartyTypeID(PartyTypeID);
        requestWrapper.setUrlKey(UrlKey);

        WrapperProjectPartyDocsMulti response = partyDocService.getProjectPartyDocsList(requestWrapper);
        return ResponseEntity.ok(response);
    }

    /**
     * 从参与方上传文档
     *
     * @param requestJson 请求JSON
     * @param files 上传的文件
     * @return 上传结果
     */
    @PostMapping("/UploadDocumentFromParty")
    @CacheEvict(value = {"partyDocCounts", "partyUploadedFiles"}, allEntries = true)
    public ResponseEntity<?> uploadDocumentFromParty(
            @RequestParam("request") String requestJson,
            @RequestParam(value = "files", required = false) List<MultipartFile> files)
            throws com.fasterxml.jackson.core.JsonProcessingException {

        WrapperProjectPartyDocsSingle request = objectMapper.readValue(requestJson, WrapperProjectPartyDocsSingle.class);

        RequestResponse response = partyDocService.uploadDocumentFromParty(request, files);
        return ResponseEntity.ok(response);
    }

    /**
     * 获取参与方已上传文档数量
     *
     * @param WorkflowId 工作流ID
     * @param ProjectID 项目ID
     * @param PartyID 参与方ID
     * @param PartyTypeID 参与方类型ID
     * @param UrlKey URL密钥
     * @return 上传数量
     */
    @GetMapping("/GetDocumentsListCountUploadByParty")
    @Cacheable(value = "partyDocCounts", key = "{#WorkflowId, #ProjectID, #PartyID, #PartyTypeID, #UrlKey}")
    public ResponseEntity<?> getDocumentsListCountUploadByParty(
            @RequestParam Integer WorkflowId,
            @RequestParam Integer ProjectID,
            @RequestParam Integer PartyID,
            @RequestParam Integer PartyTypeID,
            @RequestParam String UrlKey) {

        WrapperProjectPartyDocsMulti requestWrapper = new WrapperProjectPartyDocsMulti();
        requestWrapper.setWorkflowId(WorkflowId);
        requestWrapper.setProjectID(ProjectID);
        requestWrapper.setPartyID(PartyID);
        requestWrapper.setPartyTypeID(PartyTypeID);
        requestWrapper.setUrlKey(UrlKey);

        CountProjectPartyDocsUploaded response = partyDocService.getDocumentsListCountUploadByParty(requestWrapper);
        return ResponseEntity.ok(response);
    }

    /**
     * 获取项目单个参与方已上传文件列表
     *
     * @param WorkflowId 工作流ID
     * @param ProjectID 项目ID
     * @param PartyID 参与方ID
     * @param PartyTypeID 参与方类型ID
     * @param UrlKey URL密钥
     * @return 文件列表
     */
    @GetMapping("/GetProjectSinglePartyDocsUploadedFileList")
    @Cacheable(value = "partyUploadedFiles", key = "{#WorkflowId, #ProjectID, #PartyID, #PartyTypeID, #UrlKey}")
    public ResponseEntity<?> getProjectSinglePartyDocsUploadedFileList(
            @RequestParam Integer WorkflowId,
            @RequestParam Integer ProjectID,
            @RequestParam Integer PartyID,
            @RequestParam Integer PartyTypeID,
            @RequestParam String UrlKey) {

        WrapperProjectSinglePartyDocsUploadedFileList requestWrapper = new WrapperProjectSinglePartyDocsUploadedFileList();
        requestWrapper.setWorkflowId(WorkflowId);
        requestWrapper.setProjectID(ProjectID);
        requestWrapper.setPartyID(PartyID);
        requestWrapper.setPartyTypeID(PartyTypeID);
        requestWrapper.setUrlKey(UrlKey);

        WrapperProjectSinglePartyDocsUploadedFileList response =
                partyDocService.getProjectSinglePartyDocsUploadedFileList(requestWrapper);
        return ResponseEntity.ok(response);
    }

    /**
     * 获取检查清单项目检查数据（用于第三方）
     *
     * @param WorkflowId 工作流ID
     * @param ProjectID 项目ID
     * @param PartyID 参与方ID
     * @param PartyTypeID 参与方类型ID
     * @param CKII 检查清单项目ID（逗号分隔）
     * @param UrlKey URL密钥
     * @return 检查数据
     */
    @GetMapping("/GetChecklistItemInspectinDataForParty")
    @Cacheable(value = "checklistItemInspectionData", key = "{#WorkflowId, #ProjectID, #PartyID, #PartyTypeID, #CKII, #UrlKey}")
    public ResponseEntity<?> getChecklistItemInspectinDataForParty(
            @RequestParam Integer WorkflowId,
            @RequestParam Integer ProjectID,
            @RequestParam Integer PartyID,
            @RequestParam Integer PartyTypeID,
            @RequestParam String CKII,
            @RequestParam String UrlKey) {

        WrapperProjectPartyDocsInspection requestWrapper = new WrapperProjectPartyDocsInspection();
        requestWrapper.setWorkflowId(WorkflowId);
        requestWrapper.setProjectID(ProjectID);
        requestWrapper.setPartyID(PartyID);
        requestWrapper.setPartyTypeID(PartyTypeID);
        requestWrapper.setChecklistItemIdCommaSeperated(CKII);
        requestWrapper.setUrlKey(UrlKey);

        WrapperProjectPartyDocsInspection response = partyDocService.getProjectChecklistsItemPartyData(requestWrapper);

        // Generate and set imageURL
        if (response != null && response.getProjectChecklistThirdPartyInspData() != null &&
            response.getProjectChecklistThirdPartyInspData().getProjectChecklistItemsInspData() != null) {

            ProjectChecklistInspDataDto checklistInspData = response.getProjectChecklistThirdPartyInspData();
            Integer projectId = requestWrapper.getProjectID(); // Get projectID from the request

            checklistInspData.getProjectChecklistItemsInspData().parallelStream().forEach(itemInspData -> {
                if (itemInspData.getProjectChecklistItemImageInspData() != null) {
                    Integer checklistItemId = itemInspData.getId(); // This is the ID of the checklist item

                    itemInspData.getProjectChecklistItemImageInspData().parallelStream().forEach(imageDto -> {
                        if (imageDto.getImageName() != null && !imageDto.getImageName().isEmpty()) {
                            String folderPath = String.format("projects/%d/checklist/%d", projectId, checklistItemId);
                            String imageUrl = s3Service.createPublicURL(null, null, folderPath, imageDto.getImageName());
                            imageDto.setImageURL(imageUrl);
                        }
                    });
                }
            });
        }

        return ResponseEntity.ok(response);
    }

    /**
     * 从参与方上传检查清单项目图片检查数据
     *
     * @param requestJson 请求JSON
     * @param files 上传的文件
     * @return 上传结果
     */
    @PostMapping("/UploadChecklistItemImageInspectinDataFromParty")
    @CacheEvict(value = "checklistItemInspectionData", allEntries = true)
    public ResponseEntity<?> uploadChecklistItemImageInspectinDataFromParty(
            @RequestParam("request") String requestJson,
            @RequestParam(value = "files", required = false) List<MultipartFile> files)
            throws com.fasterxml.jackson.core.JsonProcessingException {

        WrapperProjectPartyDocsInspection request = objectMapper.readValue(requestJson, WrapperProjectPartyDocsInspection.class);

        RequestResponse response = partyDocService.uploadChecklistItemImageInspectinDataFromParty(request, files);
        return ResponseEntity.ok(response);
    }
}
