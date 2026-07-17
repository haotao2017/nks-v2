package no.nks.repository;

import no.nks.entity.ChecklistTemplate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChecklistTemplateRepository extends JpaRepository<ChecklistTemplate, Integer> {
    
    List<ChecklistTemplate> findByCompanyId(Integer companyId);
    
    List<ChecklistTemplate> findByTitleAndCompanyId(String title, Integer companyId);
    
    Page<ChecklistTemplate> findByCompanyId(Integer companyId, Pageable pageable);
    
    Page<ChecklistTemplate> findByTitleAndCompanyId(String title, Integer companyId, Pageable pageable);
    
    /**
     * 使用单一Join fetch查询模板和项目（解决MultipleBagFetchException）
     * 不再同时fetch多个集合
     */
    @Query("SELECT DISTINCT t FROM ChecklistTemplate t " +
           "LEFT JOIN FETCH t.checklistItemTemplates " +
           "WHERE t.companyId = :companyId")
    List<ChecklistTemplate> findByCompanyIdWithItems(@Param("companyId") Integer companyId);
    
    /**
     * 使用单一Join fetch的分页查询
     */
    @Query(value = "SELECT DISTINCT t FROM ChecklistTemplate t " +
                  "LEFT JOIN FETCH t.checklistItemTemplates " +
                  "WHERE t.companyId = :companyId",
           countQuery = "SELECT COUNT(DISTINCT t) FROM ChecklistTemplate t WHERE t.companyId = :companyId")
    List<ChecklistTemplate> findByCompanyIdWithItems(@Param("companyId") Integer companyId, Pageable pageable);
    
    /**
     * 使用单一Join fetch优化的按标题和公司ID查询
     */
    @Query("SELECT DISTINCT t FROM ChecklistTemplate t " +
           "LEFT JOIN FETCH t.checklistItemTemplates " +
           "WHERE t.title = :title AND t.companyId = :companyId")
    List<ChecklistTemplate> findByTitleAndCompanyIdWithItems(
            @Param("title") String title, @Param("companyId") Integer companyId);
    
    /**
     * 使用单一Join fetch优化的按标题和公司ID分页查询
     */
    @Query(value = "SELECT DISTINCT t FROM ChecklistTemplate t " +
                  "LEFT JOIN FETCH t.checklistItemTemplates " +
                  "WHERE t.title = :title AND t.companyId = :companyId",
           countQuery = "SELECT COUNT(DISTINCT t) FROM ChecklistTemplate t WHERE t.title = :title AND t.companyId = :companyId")
    List<ChecklistTemplate> findByTitleAndCompanyIdWithItems(
            @Param("title") String title, @Param("companyId") Integer companyId, Pageable pageable);
} 