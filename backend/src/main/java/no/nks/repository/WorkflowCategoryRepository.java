package no.nks.repository;

import no.nks.entity.WorkflowCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Repository
public interface WorkflowCategoryRepository extends JpaRepository<WorkflowCategory, Integer> {
    
    Optional<WorkflowCategory> findByIsDefaultTrue();
    
    /**
     * 清除所有默认工作流类别（将所有isDefault=true的记录设置为false）
     */
    @Modifying
    @Transactional
    @Query("UPDATE WorkflowCategory w SET w.isDefault = false WHERE w.isDefault = true")
    int clearAllDefaults();
} 