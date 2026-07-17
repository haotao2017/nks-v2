package no.nks.dto.api;

import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
public class ChecklistTemplateDto {
    private Integer id;
    private String title;
    private Boolean isDefault;
    private Integer sortOrder;
    private List<ChecklistItemTemplateDto> items = new ArrayList<>();
}
