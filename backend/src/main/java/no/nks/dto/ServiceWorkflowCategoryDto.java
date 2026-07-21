package no.nks.dto;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class ServiceWorkflowCategoryDto {
    private Integer id;
    private Integer workflowCategoryId;
    private Integer serviceId;
    /** 工作流类别名称(GetProject 填充,便于选择器区分同服务多工作流)。 */
    private String workflowCategoryName;
}
