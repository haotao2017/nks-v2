package no.nks.dto.api;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class ChecklistItemUpdateResponseData {
    private int ProjectID;
    private int ChecklistID;
    private int QuestionID;
} 