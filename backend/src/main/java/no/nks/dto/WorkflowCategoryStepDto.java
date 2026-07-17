package no.nks.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class WorkflowCategoryStepDto {

    private Integer id;

    @NotNull(message = "工作流类别ID不能为空")
    @Positive(message = "工作流类别ID必须为正数")
    private Integer workflowCategoryId;

    @NotBlank(message = "步骤名称不能为空")
    private String stepName;

    @NotNull(message = "步骤序列不能为空")
    @Positive(message = "步骤序列必须为正数")
    private Integer stepSequence;

    private Boolean isActive;

    private Boolean isTransferable;
}
