package no.nks.repository;

import no.nks.entity.ServiceWorkflowCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ServiceWorkflowCategoryRepository extends JpaRepository<ServiceWorkflowCategory, Integer> {
    
    // 根据服务ID查找所有相关工作流类别
    List<ServiceWorkflowCategory> findByServiceId(Integer serviceId);
    
    // 根据服务ID集合批量查询工作流类别
    List<ServiceWorkflowCategory> findByServiceIdIn(List<Integer> serviceIds);
    
    // 删除特定服务的所有工作流类别关联
    void deleteByServiceId(Integer serviceId);
} 