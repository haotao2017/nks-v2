package no.nks.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 包装简化版检查清单项的响应
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class WrapperChecklistItemSimpleDto {
    private ChecklistItemSimpleDto projectChecklistItems;
    
    /**
     * 从WrapperProjectChecklistItemDto转换为标准格式的包装DTO
     */
    public static WrapperChecklistItemSimpleDto fromWrapperProjectChecklistItemDto(
            WrapperProjectChecklistItemDto wrapper) {
        if (wrapper == null || wrapper.getProjectChecklistItems() == null) {
            return new WrapperChecklistItemSimpleDto();
        }
        
        ChecklistItemSimpleDto simpleDto = ChecklistItemSimpleDto.fromChecklistItemDto(
                wrapper.getProjectChecklistItems());
        
        return new WrapperChecklistItemSimpleDto(simpleDto);
    }
} 