package no.nks.service;

import no.nks.dto.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/**
 * 参与方文档服务接口
 */
public interface PartyDocService {
    /**
     * 验证第三方文档请求的有效性
     * @param workflowId 工作流ID
     * @param projectId 项目ID
     * @param partyId 参与方ID
     * @param partyTypeId 参与方类型ID
     * @param urlKey URL密钥
     * @return 如果请求有效返回true，否则返回false
     */
    boolean authenticateThirdPartyDocRequiredRequest(Integer workflowId, Integer projectId, Integer partyId, Integer partyTypeId, String urlKey);

    /**
     * 获取项目参与方需要的文档列表
     * @param request 请求包装对象
     * @return 文档列表包装对象
     */
    WrapperProjectPartyDocsMulti getProjectPartyDocsList(WrapperProjectPartyDocsMulti request);

    /**
     * 从参与方上传文档
     * @param request 请求包装对象
     * @param files 上传的文件
     * @return 请求响应
     */
    RequestResponse uploadDocumentFromParty(WrapperProjectPartyDocsSingle request, List<MultipartFile> files);

    /**
     * 获取参与方已上传文档数量
     * @param request 请求包装对象
     * @return 文档数量包装对象
     */
    CountProjectPartyDocsUploaded getDocumentsListCountUploadByParty(WrapperProjectPartyDocsMulti request);

    /**
     * 获取项目单个参与方已上传文件列表
     * @param request 请求包装对象
     * @return 文件列表包装对象
     */
    WrapperProjectSinglePartyDocsUploadedFileList getProjectSinglePartyDocsUploadedFileList(WrapperProjectSinglePartyDocsUploadedFileList request);

    /**
     * 获取项目检查清单项目参与方数据
     * @param request 请求包装对象
     * @return 检查清单检查数据包装对象
     */
    WrapperProjectPartyDocsInspection getProjectChecklistsItemPartyData(WrapperProjectPartyDocsInspection request);

    /**
     * 从参与方上传检查清单项目图片检查数据
     * @param request 请求包装对象
     * @param files 上传的文件
     * @return 请求响应
     */
    RequestResponse uploadChecklistItemImageInspectinDataFromParty(WrapperProjectPartyDocsInspection request, List<MultipartFile> files);
}
