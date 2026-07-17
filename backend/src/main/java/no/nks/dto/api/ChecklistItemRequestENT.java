package no.nks.dto.api;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class ChecklistItemRequestENT {
    private int ProjectID;
    private int CheckListID;
    private int QuestionID;
    private String Status;
    private String Comment;
} 