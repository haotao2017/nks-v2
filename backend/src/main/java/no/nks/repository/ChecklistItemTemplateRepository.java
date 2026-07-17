package no.nks.repository;

import no.nks.entity.ChecklistItemTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChecklistItemTemplateRepository extends JpaRepository<ChecklistItemTemplate, Integer> {
    
    List<ChecklistItemTemplate> findByChecklistId(Integer checklistId);
    
    List<ChecklistItemTemplate> findByChecklistIdAndCompanyId(Integer checklistId, Integer companyId);
    
    void deleteByChecklistId(Integer checklistId);
} 