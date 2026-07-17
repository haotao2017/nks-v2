package no.nks.repository;

import no.nks.entity.WorkflowCategoryStep;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WorkflowCategoryStepRepository extends JpaRepository<WorkflowCategoryStep, Integer> {
    
    List<WorkflowCategoryStep> findByWorkflowCategoryIdOrderByStepSequenceAsc(Integer workflowCategoryId);
} 