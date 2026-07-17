package no.nks.dto.api;

import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
public class ChecklistItemList {
    private int checklistItemID;
    private String question;
    private String comment;
    private String status;
    private List<String> ItemImageUrls = new ArrayList<>();
} 