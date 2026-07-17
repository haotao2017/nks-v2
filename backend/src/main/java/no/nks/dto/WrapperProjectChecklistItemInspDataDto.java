package no.nks.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 项目检查清单项检查数据包装DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class WrapperProjectChecklistItemInspDataDto {
    
    /**
     * 项目检查清单项检查数据
     */
    private ProjectChecklistItemsInspDataDto projectChecklistItemInspData;
} 