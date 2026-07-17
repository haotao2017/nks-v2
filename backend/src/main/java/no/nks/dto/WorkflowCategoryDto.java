package no.nks.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class WorkflowCategoryDto {

    private Integer id;

    @NotBlank(message = "工作流类别名称不能为空")
    private String name;

    private Boolean isDefault;
}
