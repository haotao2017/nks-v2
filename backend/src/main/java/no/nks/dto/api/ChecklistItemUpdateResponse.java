package no.nks.dto.api;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class ChecklistItemUpdateResponse {
    private Response Response = new Response();
    private ChecklistItemUpdateResponseData ChecklistItemUpdate = new ChecklistItemUpdateResponseData();
} 