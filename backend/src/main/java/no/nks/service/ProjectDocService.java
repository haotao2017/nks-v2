package no.nks.service;

import no.nks.dto.RequestResponse;
import no.nks.dto.WrapperProjectDocumentDto;
import no.nks.dto.ProjectDocumentUploadDto;
import no.nks.dto.workflow.ProjectWorkflowDto;
import no.nks.dto.workflow.WrapperProjectWorkflowDto;
import org.springframework.web.multipart.MultipartFile;

public interface ProjectDocService {
    /**
     * 获取第三方检查邮件格式化内容
     */
    WrapperProjectWorkflowDto getProjectInspThirPartyEmailFormated(ProjectWorkflowDto projectWorkflow, Integer companyId, Integer userId);

    /**
     * 发送项目第三方检查邮件
     */
    RequestResponse sendProjectInspThirPartyEmail(ProjectWorkflowDto projectWorkflow, MultipartFile file, Integer companyId, Integer userId);

    /**
     * 获取项目所需文档列表(所有相关方)
     */
    WrapperProjectDocumentDto getProjectRequiredDocList(Integer projectId, Integer workflowId, Integer companyId);

    /**
     * 获取项目所需文档列表(单一相关方)
     */
    WrapperProjectDocumentDto getProjectRequiredDocBySingleParty(Integer projectId, Integer workflowId,
                                                         Integer partyId, Integer partyTypeId, Integer companyId);

    /**
     * 获取需要批准的项目文档列表
     */
    WrapperProjectDocumentDto getProjectApprovalRequiredDocList(Integer projectId, Integer workflowId, Integer companyId);

    /**
     * 上传项目文档
     */
    RequestResponse uploadProjectDocument(ProjectDocumentUploadDto uploadDto, MultipartFile file, Integer companyId, Integer userId);

    /**
     * 获取系统生成的所有步骤文档列表
     */
    WrapperProjectDocumentDto getProjectSystemGeneratedDocListAllSteps(Integer projectId, Integer workflowId, Integer companyId);

    /**
     * 删除项目文档
     */
    RequestResponse deleteProjectDocument(Integer documentId, Integer projectId, Integer companyId);
}
