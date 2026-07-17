package no.nks.repository;

import no.nks.entity.PartyType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PartyTypeRepository extends JpaRepository<PartyType, Integer> {
    
    /**
     * Find a party type by its ID and companyId for authorization
     * 
     * @param id the party type ID
     * @param companyId the company ID
     * @return an Optional containing the party type if found
     */
    Optional<PartyType> findByIdAndCompanyId(Integer id, Integer companyId);
    
    /**
     * Find all party types for a specific company
     * 
     * @param companyId the company ID
     * @return a list of party types
     */
    List<PartyType> findAllByCompanyId(Integer companyId);
    
    /**
     * 查询指定公司的默认参与方类型，且工作流程类别ID在给定列表中
     * 
     * @param companyId 公司ID
     * @param workflowCategoryIds 工作流程类别ID列表
     * @return 符合条件的参与方类型列表
     */
    @Query("SELECT pt FROM PartyType pt WHERE pt.companyId = :companyId AND pt.isDefault = true " +
           "AND pt.workflowCategoryId IN :workflowCategoryIds AND pt.workflowCategoryId IS NOT NULL")
    List<PartyType> findDefaultByCompanyIdAndWorkflowCategoryIdIn(
            @Param("companyId") Integer companyId,
            @Param("workflowCategoryIds") List<Integer> workflowCategoryIds);
} 