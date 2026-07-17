package no.nks.dto;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class ServiceWorkflowCategoryDto {
    private Integer id;
    private Integer workflowCategoryId;
    private Integer serviceId;
}
