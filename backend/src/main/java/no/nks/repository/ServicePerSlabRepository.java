package no.nks.repository;

import no.nks.entity.ServicePerSlab;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ServicePerSlabRepository extends JpaRepository<ServicePerSlab, Integer> {
    
    // 根据服务ID查找所有服务分级定价
    List<ServicePerSlab> findByServiceId(Integer serviceId);
    
    // 根据服务ID集合批量查询服务分级定价
    List<ServicePerSlab> findByServiceIdIn(List<Integer> serviceIds);
    
    // 删除特定服务的所有分级定价
    void deleteByServiceId(Integer serviceId);
} 