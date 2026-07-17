package no.nks.repository;

import no.nks.entity.ChecklistItemImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * 检查清单项图片仓库接口
 */
@Repository
public interface ChecklistItemImageRepository extends JpaRepository<ChecklistItemImage, Integer> {
    
    /**
     * 根据检查清单项ID查找所有图片
     * 
     * @param checklistItemId 检查清单项ID
     * @return 图片列表
     */
    List<ChecklistItemImage> findByChecklistItemId(Integer checklistItemId);
    
    /**
     * 根据检查清单项ID和参与方ID查找图片
     * 
     * @param checklistItemId 检查清单项ID
     * @param partyId 参与方ID
     * @return 图片列表
     */
    List<ChecklistItemImage> findByChecklistItemIdAndPartyId(Integer checklistItemId, Integer partyId);
    
    /**
     * 根据检查清单项ID删除图片
     * 
     * @param checklistItemId 检查清单项ID
     */
    @Modifying
    @Query("DELETE FROM ChecklistItemImage cii WHERE cii.checklistItemId = :checklistItemId")
    void deleteByChecklistItemId(@Param("checklistItemId") Integer checklistItemId);
    
    /**
     * 根据检查清单项ID列表批量删除图片
     * 
     * @param checklistItemIds 检查清单项ID列表
     */
    @Modifying
    @Query("DELETE FROM ChecklistItemImage cii WHERE cii.checklistItemId IN :checklistItemIds")
    void deleteByChecklistItemIdIn(@Param("checklistItemIds") List<Integer> checklistItemIds);
    
    List<ChecklistItemImage> findByChecklistItemIdIn(List<Integer> checklistItemIds);

    List<ChecklistItemImage> findByChecklistItemIdAndIsOkForFinalPdf(Integer checklistItemId, Boolean isOkForFinalPdf);
} 