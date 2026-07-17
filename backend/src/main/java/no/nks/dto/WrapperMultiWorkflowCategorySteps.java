package no.nks.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class WrapperMultiWorkflowCategorySteps {

    private List<WorkflowCategoryStepDto> multiWorkflowCategorySteps;
}
