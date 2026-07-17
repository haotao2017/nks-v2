package no.nks.dto;

import jakarta.validation.constraints.NotBlank;
import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmailTemplateDto {
    private Integer id;

    @NotBlank(message = "Title is required")
    private String title;

    @NotBlank(message = "Template is required")
    private String template;

    @JsonIgnore
    private Integer companyId;
}
