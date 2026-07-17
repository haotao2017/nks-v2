package no.nks.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 包装单个检查清单项的响应
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class WrapperProjectChecklistItemDto {
    private ChecklistItemDto projectChecklistItems;
} 