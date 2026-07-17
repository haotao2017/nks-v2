package no.nks.dto.api;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class ProjectChecklists {
    private int checklistId;
    private String checklistName;
    private int checklistItemTypes;
} 