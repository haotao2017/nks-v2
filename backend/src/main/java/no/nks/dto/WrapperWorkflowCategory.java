package no.nks.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class WrapperWorkflowCategory {

    @NotNull(message = "工作流类别不能为空")
    @Valid
    private WorkflowCategoryDto workflowCategory;
}
