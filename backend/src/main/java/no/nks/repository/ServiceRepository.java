package no.nks.repository;

import no.nks.entity.Service;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ServiceRepository extends JpaRepository<Service, Integer> {
    
    // 根据公司ID查询所有服务
    List<Service> findByCompanyId(Integer companyId);
    
    // 根据名称和公司ID查询服务 - 精确匹配
    List<Service> findByNameAndCompanyId(String name, Integer companyId);
    
    // 根据名称和公司ID查询服务 - 模糊匹配
    List<Service> findByNameContainingAndCompanyId(String name, Integer companyId);
    
    // 根据描述和公司ID查询服务 - 精确匹配
    List<Service> findByDescriptionAndCompanyId(String description, Integer companyId);
    
    // 根据描述和公司ID查询服务 - 模糊匹配
    List<Service> findByDescriptionContainingAndCompanyId(String description, Integer companyId);
    
    // 分页查询所有服务（按公司ID）
    List<Service> findByCompanyId(Integer companyId, Pageable pageable);
    
    // 分页查询（按名称和公司ID）- 精确匹配
    List<Service> findByNameAndCompanyId(String name, Integer companyId, Pageable pageable);
    
    // 分页查询（按名称和公司ID）- 模糊匹配
    List<Service> findByNameContainingAndCompanyId(String name, Integer companyId, Pageable pageable);
    
    // 分页查询（按描述和公司ID）- 精确匹配
    List<Service> findByDescriptionAndCompanyId(String description, Integer companyId, Pageable pageable);
    
    // 分页查询（按描述和公司ID）- 模糊匹配
    List<Service> findByDescriptionContainingAndCompanyId(String description, Integer companyId, Pageable pageable);
    
    // 检查服务是否与项目关联
    @Query("SELECT CASE WHEN COUNT(ps) > 0 THEN true ELSE false END FROM ProjectService ps WHERE ps.serviceId = :serviceId")
    boolean checkIfServiceAssociatedWithProject(@Param("serviceId") Integer serviceId);

    Optional<Service> findByChecklistTempId(Integer checklistTempId);
    
    Optional<Service> findByChecklistTempIdAndCompanyId(Integer checklistTempId, Integer companyId);
    
    // 批量查询多个模板ID对应的服务
    List<Service> findByChecklistTempIdIn(List<Integer> checklistTempIds);
} 