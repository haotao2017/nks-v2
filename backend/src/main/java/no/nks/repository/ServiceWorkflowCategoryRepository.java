package no.nks.repository;

import no.nks.entity.ServiceWorkflowCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ServiceWorkflowCategoryRepository extends JpaRepository<ServiceWorkflowCategory, Integer> {

    /** 按服务查绑定（JOIN 工作流名，供项目 Tjeneste 下拉展示）。 */
    @Query("SELECT swc FROM ServiceWorkflowCategory swc LEFT JOIN FETCH swc.workflowCategory WHERE swc.serviceId = :serviceId")
    List<ServiceWorkflowCategory> findByServiceId(@Param("serviceId") Integer serviceId);

    /** 批量按服务查绑定（JOIN 工作流名）。 */
    @Query("SELECT DISTINCT swc FROM ServiceWorkflowCategory swc LEFT JOIN FETCH swc.workflowCategory WHERE swc.serviceId IN :serviceIds")
    List<ServiceWorkflowCategory> findByServiceIdIn(@Param("serviceIds") List<Integer> serviceIds);

    void deleteByServiceId(Integer serviceId);
}
