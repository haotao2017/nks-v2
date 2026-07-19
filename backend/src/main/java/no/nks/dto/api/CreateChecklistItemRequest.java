package no.nks.dto.api;

import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.validation.constraints.NotBlank;

@Data
@NoArgsConstructor
public class CreateChecklistItemRequest {
    
    @NotBlank(message = "Sjekklistepunkt-tittel mangler")
    private String title;
    
    private Integer sortOrder;
}
