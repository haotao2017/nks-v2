package no.nks.dto.api;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class ChecklistItemData {
    private Integer id;
    private String title;
    private Integer sortOrder;
    private String status;
}
