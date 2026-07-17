package no.nks.repository;

import no.nks.entity.DocType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DocTypeRepository extends JpaRepository<DocType, Integer> {
    /**
     * 根据公司ID查找文档类型
     * 
     * @param companyId 公司ID
     * @return 文档类型列表
     */
    List<DocType> findByCompanyId(Integer companyId);
    
    /**
     * 根据参与方类型ID查找文档类型并按排序顺序排序
     * 
     * @param partyTypeId 参与方类型ID
     * @return 文档类型列表
     */
    List<DocType> findByPartyTypeIdOrderBySortOrder(Integer partyTypeId);
    
    /**
     * 根据参与方类型ID和公司ID查找文档类型并按排序顺序排序
     * 
     * @param partyTypeId 参与方类型ID
     * @param companyId 公司ID
     * @return 文档类型列表
     */
    List<DocType> findByPartyTypeIdAndCompanyIdOrderBySortOrder(Integer partyTypeId, Integer companyId);
} 