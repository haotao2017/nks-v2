package no.nks.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChecklistItemTemplateDto {

    private Integer id;

    private Integer checklistId;

    private String title;

    @JsonIgnore
    private Integer sortOrder;
}
