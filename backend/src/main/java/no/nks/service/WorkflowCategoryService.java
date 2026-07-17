package no.nks.service;

import no.nks.dto.RequestResponse;
import no.nks.dto.WorkflowCategoryDto;
import no.nks.dto.WorkflowCategoryStepDto;
import no.nks.dto.WrapperMultiWorkflowCategory;
import no.nks.dto.WrapperMultiWorkflowCategorySteps;
import no.nks.dto.WrapperWorkflowCategory;
import no.nks.dto.WrapperWorkflowCategoryStep;

public interface WorkflowCategoryService {

    // 工作流类别相关方法
    WrapperWorkflowCategory getSingleWorkflowCategory(Integer workflowCategoryId);

    WrapperWorkflowCategory updateSingleWorkflowCategory(WorkflowCategoryDto workflowCategoryDto);

    RequestResponse deleteSingleWorkflowCategory(Integer workflowCategoryId);

    WrapperWorkflowCategory createSingleWorkflowCategory(WorkflowCategoryDto workflowCategoryDto);

    WrapperMultiWorkflowCategory getAllWorkflowCategory();

    // 工作流类别步骤相关方法
    WrapperMultiWorkflowCategorySteps getSingleWorkflowCategoryStepsForOneWorkflow(Integer workflowCategoryId);

    WrapperWorkflowCategoryStep createSingleWorkflowCategoryStep(WorkflowCategoryStepDto workflowCategoryStepDto);

    WrapperWorkflowCategoryStep getSingleWorkflowCategoryStep(Integer workflowCategoryStepId);

    WrapperWorkflowCategoryStep updateSingleWorkflowCategoryStep(WorkflowCategoryStepDto workflowCategoryStepDto);

    RequestResponse deleteSingleWorkflowCategoryStep(Integer workflowCategoryStepId);
}
