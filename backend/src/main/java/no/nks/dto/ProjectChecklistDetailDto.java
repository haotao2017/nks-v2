package no.nks.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * 详细的项目检查清单DTO，用于与标准返回格式兼容
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProjectChecklistDetailDto {
    
    private Integer id;
    private Integer projectId;
    private String checklistName;
    private List<ChecklistItemSimpleDto> projectChecklistItems = new ArrayList<>();
    
    /**
     * 从完整的ProjectChecklistDto转换为标准格式的详情DTO
     */
    public static ProjectChecklistDetailDto fromProjectChecklistDto(ProjectChecklistDto dto) {
        if (dto == null) {
            return null;
        }
        
        List<ChecklistItemSimpleDto> simpleItems = new ArrayList<>();
        
        // 处理checklistItems
        if (dto.getChecklistItems() != null && !dto.getChecklistItems().isEmpty()) {
            simpleItems.addAll(dto.getChecklistItems().stream()
                    .map(ChecklistItemSimpleDto::fromChecklistItemDto)
                    .collect(Collectors.toList()));
        }
        
        // 处理projectChecklistItems (如果有)
        if (dto.getProjectChecklistItems() != null && !dto.getProjectChecklistItems().isEmpty()) {
            simpleItems.addAll(dto.getProjectChecklistItems());
        }
        
        return ProjectChecklistDetailDto.builder()
                .id(dto.getId())
                .projectId(dto.getProjectId())
                .checklistName(dto.getChecklistName())
                .projectChecklistItems(simpleItems)
                .build();
    }
} 