package no.nks.repository;

import no.nks.entity.Doc;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * 文档仓库接口
 */
@Repository
public interface DocRepository extends JpaRepository<Doc, Integer> {
    
    /**
     * 根据项目ID查找文档
     * 
     * @param projectId 项目ID
     * @return 文档列表
     */
    List<Doc> findByProjectId(Integer projectId);
    
    /**
     * 根据项目ID和参与方ID查找文档
     * 
     * @param projectId 项目ID
     * @param partyId 参与方ID
     * @return 文档列表
     */
    List<Doc> findByProjectIdAndPartyId(Integer projectId, Integer partyId);
    
    /**
     * 根据项目ID和参与方类型ID查找文档
     * 
     * @param projectId 项目ID
     * @param partyTypeId 参与方类型ID
     * @return 文档列表
     */
    List<Doc> findByProjectIdAndPartyTypeId(Integer projectId, Integer partyTypeId);
    
    /**
     * 根据项目ID、参与方ID和参与方类型ID查找文档
     * 
     * @param projectId 项目ID
     * @param partyId 参与方ID
     * @param partyTypeId 参与方类型ID
     * @return 文档列表
     */
    List<Doc> findByProjectIdAndPartyIdAndPartyTypeId(Integer projectId, Integer partyId, Integer partyTypeId);
    
    /**
     * 根据项目ID、参与方ID、参与方类型ID和工作流ID查找文档
     * 
     * @param projectId 项目ID
     * @param partyId 参与方ID
     * @param partyTypeId 参与方类型ID
     * @param workflowId 工作流ID
     * @return 文档列表
     */
    List<Doc> findByProjectIdAndPartyIdAndPartyTypeIdAndWorkflowId(Integer projectId, Integer partyId, Integer partyTypeId, Integer workflowId);
    
    /**
     * 根据项目ID和工作流ID查找文档
     * 
     * @param projectId 项目ID
     * @param workflowId 工作流ID
     * @return 文档列表
     */
    List<Doc> findByProjectIdAndWorkflowId(Integer projectId, Integer workflowId);

    /**
     * 根据项目ID和工作流步骤ID查找文档
     *
     * @param projectId 项目ID
     * @param workflowStepId 工作流步骤ID
     * @return 文档列表
     */
    List<Doc> findByProjectIdAndWorkflowStepId(Integer projectId, Integer workflowStepId);
} 