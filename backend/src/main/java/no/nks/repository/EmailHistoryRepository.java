package no.nks.repository;

import no.nks.entity.EmailHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EmailHistoryRepository extends JpaRepository<EmailHistory, Integer> {
    
    /**
     * 根据项目ID查找邮件历史记录
     * 
     * @param projectId 项目ID
     * @return 邮件历史记录列表
     */
    List<EmailHistory> findByProjectId(Integer projectId);
    
    /**
     * 根据项目ID和工作流ID查找邮件历史记录
     * 
     * @param projectId 项目ID
     * @param workflowId 工作流ID
     * @return 邮件历史记录列表
     */
    List<EmailHistory> findByProjectIdAndWorkflowId(Integer projectId, Integer workflowId);
    
    /**
     * 根据项目ID、工作流ID和工作流步骤ID查找邮件历史记录
     * 
     * @param projectId 项目ID
     * @param workflowId 工作流ID
     * @param workflowStepId 工作流步骤ID
     * @return 邮件历史记录列表
     */
    List<EmailHistory> findByProjectIdAndWorkflowIdAndWorkflowStepId(
            Integer projectId, Integer workflowId, Integer workflowStepId);
            
    /**
     * 检查是否存在满足条件的邮件历史记录（用于验证第三方请求的有效性）
     * 
     * @param projectId 项目ID
     * @param partyId 参与方ID
     * @param partyTypeId 参与方类型ID
     * @param workflowId 工作流ID
     * @return 如果存在返回true，否则返回false
     */
    boolean existsByProjectIdAndPartyIdAndPartyTypeIdAndWorkflowId(
            Integer projectId, Integer partyId, Integer partyTypeId, Integer workflowId);
            
    /**
     * 检查是否存在满足条件的邮件历史记录（用于验证带URL密钥的第三方请求的有效性）
     * 
     * @param projectId 项目ID
     * @param partyId 参与方ID
     * @param partyTypeId 参与方类型ID
     * @param workflowId 工作流ID
     * @param urlKey URL密钥
     * @return 如果存在返回true，否则返回false
     */
    boolean existsByProjectIdAndPartyIdAndPartyTypeIdAndWorkflowIdAndUrlKey(
            Integer projectId, Integer partyId, Integer partyTypeId, Integer workflowId, String urlKey);

    List<EmailHistory> findByProjectIdAndWorkflowStepIdOrderByDateDesc(Integer projectId, Integer workflowStepId);
} 