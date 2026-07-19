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

    @NotNull(message = "Arbeidsflytkategori-ID mangler")
    @Positive(message = "Arbeidsflytkategori-ID må være positiv")
    private Integer workflowCategoryId;

    @NotBlank(message = "Stegnavn mangler")
    private String stepName;

    @NotNull(message = "Stegrekkefølge mangler")
    @Positive(message = "Stegrekkefølge må være positiv")
    private Integer stepSequence;

    private Boolean isActive;

    private Boolean isTransferable;
}
