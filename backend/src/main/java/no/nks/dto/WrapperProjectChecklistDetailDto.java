package no.nks.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 包装单个项目检查清单详情的响应
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class WrapperProjectChecklistDetailDto {
    private ProjectChecklistDetailDto projectChecklist;
    
    /**
     * 从WrapperProjectChecklistDto转换为标准格式的包装DTO
     */
    public static WrapperProjectChecklistDetailDto fromWrapperProjectChecklistDto(
            WrapperProjectChecklistDto wrapper) {
        if (wrapper == null || wrapper.getProjectChecklist() == null) {
            return new WrapperProjectChecklistDetailDto();
        }
        
        ProjectChecklistDetailDto detailDto = 
                ProjectChecklistDetailDto.fromProjectChecklistDto(wrapper.getProjectChecklist());
        
        return new WrapperProjectChecklistDetailDto(detailDto);
    }
} 