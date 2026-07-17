package no.nks.dto.api;

import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.validation.constraints.NotBlank;

@Data
@NoArgsConstructor
public class CreateChecklistItemRequest {
    
    @NotBlank(message = "检查项标题不能为空")
    private String title;
    
    private Integer sortOrder;
}
