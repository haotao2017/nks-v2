package no.nks.dto.api;

import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
public class ChecklistTemplateContainer {
    private Response Response = new Response();
    private List<ChecklistTemplateDto> ListOfTemplates = new ArrayList<>();
}
