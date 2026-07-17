package no.nks.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.fasterxml.jackson.annotation.JsonIgnore;


import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChecklistTemplateDto {

    private Integer id;

    @NotBlank(message = "Title is required")
    private String title;

    private Boolean isDefault;

    @JsonIgnore
    private Integer sortOrder;

    private Integer serviceSelectedID;

    private List<ChecklistItemTemplateDto> checklistItemTemplateList;

    private ServiceItemTemplateDto checkListAttchedWithService;
}
