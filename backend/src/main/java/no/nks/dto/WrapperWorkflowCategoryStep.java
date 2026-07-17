package no.nks.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class WrapperWorkflowCategoryStep {

    @NotNull(message = "工作流类别步骤不能为空")
    @Valid
    private WorkflowCategoryStepDto workflowCategoryStep;
}
