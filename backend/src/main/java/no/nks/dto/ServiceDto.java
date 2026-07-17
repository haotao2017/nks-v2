package no.nks.dto;

import java.util.List;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ServiceDto {
    private Integer id;

    @NotBlank(message = "Name is required")
    private String name;

    private String description;

    @NotNull(message = "ServiceTypeId is required")
    private Integer serviceTypeId;

    @NotNull(message = "Pricing strategy is required")
    private Integer serviceChargedAs;

    @NotBlank(message = "Rate is required")
    private String rate;

    private Integer checklistTempId;

    private List<ServicePerSlabDto> servicePerSlabList;

    private List<ServiceWorkflowCategoryDto> serviceWorkflowCategory;
}
