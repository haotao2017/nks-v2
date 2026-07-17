package no.nks.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 简化的项目检查清单DTO，用于与标准返回格式兼容
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProjectChecklistSimpleDto {
    
    private Integer id;
    private Integer projectId;
    private String checklistName;
    // 项目检查清单项，按标准格式需要为null
    private Object projectChecklistItems = null;
    
    /**
     * 从完整的ProjectChecklistDto转换为简化版
     */
    public static ProjectChecklistSimpleDto fromProjectChecklistDto(ProjectChecklistDto dto) {
        return ProjectChecklistSimpleDto.builder()
                .id(dto.getId())
                .projectId(dto.getProjectId())
                .checklistName(dto.getChecklistName())
                .projectChecklistItems(null)
                .build();
    }
} 