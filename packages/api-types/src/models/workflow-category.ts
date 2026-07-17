/**
 * 工作流类别(WorkflowCategory)域类型 —— 对齐 no.nks.dto.WorkflowCategory* 系列 DTO。
 */

/** 工作流类别。 */
export interface WorkflowCategoryDto {
  id?: number;
  name?: string;
  isDefault?: boolean;
}

/** 工作流类别步骤。 */
export interface WorkflowCategoryStepDto {
  id?: number;
  workflowCategoryId?: number;
  stepName?: string;
  stepSequence?: number;
  isActive?: boolean;
  isTransferable?: boolean;
}

/** 单个工作流类别包装。 */
export interface WrapperWorkflowCategory {
  workflowCategory?: WorkflowCategoryDto;
}

/** 多个工作流类别包装。 */
export interface WrapperMultiWorkflowCategory {
  multiWorkflowCategory?: WorkflowCategoryDto[];
}

/** 单个工作流类别步骤包装。 */
export interface WrapperWorkflowCategoryStep {
  workflowCategoryStep?: WorkflowCategoryStepDto;
}

/** 多个工作流类别步骤包装。 */
export interface WrapperMultiWorkflowCategorySteps {
  multiWorkflowCategorySteps?: WorkflowCategoryStepDto[];
}
