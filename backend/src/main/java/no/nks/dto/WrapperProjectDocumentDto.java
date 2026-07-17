package no.nks.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WrapperProjectDocumentDto {
    private Integer projectId;
    private Integer workflowId;
    private Integer workflowStepId;
    private List<ProjectDocumentDto> projectDocumentList;
} 