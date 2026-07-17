package no.nks.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MultiEmailTemplatesResponse {
    private List<EmailTemplateDto> multiEmailTemplates;
}
