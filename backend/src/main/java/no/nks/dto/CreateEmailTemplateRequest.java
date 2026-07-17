package no.nks.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateEmailTemplateRequest {
    @Valid
    @NotNull(message = "EmailTemplate is required")
    private EmailTemplateDto emailTemplate;
}
