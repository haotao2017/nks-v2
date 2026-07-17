package no.nks.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChecklistItemTemplateWrapperDto {

    private ChecklistItemTemplateDto checklistItemTemplate;
}
