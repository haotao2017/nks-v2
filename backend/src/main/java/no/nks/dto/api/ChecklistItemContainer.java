package no.nks.dto.api;

import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
public class ChecklistItemContainer {
    private Response Response = new Response();
    private List<ChecklistItemList> ListOfChecklistItems = new ArrayList<>();
} 