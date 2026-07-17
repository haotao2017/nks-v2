package no.nks.repository;

import no.nks.entity.ChecklistItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * 检查清单项仓库接口
 */
@Repository
public interface ChecklistItemRepository extends JpaRepository<ChecklistItem, Integer> {
    
    /**
     * 根据检查清单ID查找所有检查清单项
     * 
     * @param checklistId 检查清单ID
     * @return 检查清单项列表
     */
    List<ChecklistItem> findByChecklistId(Integer checklistId);
    
    /**
     * 根据多个检查清单ID查找对应的所有检查清单项
     * 
     * @param checklistIds 检查清单ID列表
     * @return 检查清单项列表
     */
    List<ChecklistItem> findByChecklistIdIn(List<Integer> checklistIds);
    
    /**
     * 根据多个ID查找对应的所有检查清单项
     * 
     * @param ids ID列表
     * @return 检查清单项列表
     */
    List<ChecklistItem> findByIdIn(List<Integer> ids);
    
    /**
     * 根据检查清单ID删除所有检查清单项
     * 
     * @param checklistId 检查清单ID
     */
    @Modifying
    @Query("DELETE FROM ChecklistItem ci WHERE ci.checklistId = :checklistId")
    void deleteByChecklistId(@Param("checklistId") Integer checklistId);
} 