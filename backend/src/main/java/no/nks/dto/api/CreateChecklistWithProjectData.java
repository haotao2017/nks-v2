package no.nks.dto.api;

import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
public class CreateChecklistWithProjectData {
    private Integer projectId;
    private String projectTitle;
    private Integer checklistId;
    private String checklistName;
    private List<ChecklistItemData> checklistItems = new ArrayList<>();
}
