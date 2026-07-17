package no.nks.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 简化的检查清单项DTO，用于与标准返回格式兼容
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChecklistItemSimpleDto {
    
    private Integer id;
    private Integer checklistId;
    private String title;
    
    /**
     * 从完整的ChecklistItemDto转换为简化版
     */
    public static ChecklistItemSimpleDto fromChecklistItemDto(ChecklistItemDto dto) {
        if (dto == null) {
            return null;
        }
        return ChecklistItemSimpleDto.builder()
                .id(dto.getId())
                .checklistId(dto.getChecklistId())
                .title(dto.getTitle())
                .build();
    }
} 