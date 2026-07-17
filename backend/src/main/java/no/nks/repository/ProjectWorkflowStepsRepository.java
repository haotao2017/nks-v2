package no.nks.repository;

import no.nks.entity.ProjectWorkflowSteps;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProjectWorkflowStepsRepository extends JpaRepository<ProjectWorkflowSteps, Integer> {
    List<ProjectWorkflowSteps> findByProjectIdAndWorkflowIdAndWorkflowStepId(Integer projectId, Integer workflowId, Integer workflowStepId);
    
    List<ProjectWorkflowSteps> findByProjectIdAndWorkflowIdOrderByWorkflowStepId(Integer projectId, Integer workflowId);

    long countByProjectIdAndWorkflowStepIdIn(Integer projectId, List<Integer> workflowStepIds);
} 