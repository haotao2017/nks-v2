package no.nks.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.stream.Collectors;

/**
 * 包装多个简化项目检查清单的响应
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class WrapperMultiProjectChecklistSimpleDto {
    private List<ProjectChecklistSimpleDto> multiProjectChecklist;
    
    /**
     * 从包装的完整项目检查清单转换为简化版
     */
    public static WrapperMultiProjectChecklistSimpleDto fromWrapperMultiProjectChecklistDto(
            WrapperMultiProjectChecklistDto wrapper) {
        if (wrapper == null || wrapper.getMultiProjectChecklist() == null) {
            return new WrapperMultiProjectChecklistSimpleDto();
        }
        
        List<ProjectChecklistSimpleDto> simpleDtos = wrapper.getMultiProjectChecklist().stream()
                .map(ProjectChecklistSimpleDto::fromProjectChecklistDto)
                .collect(Collectors.toList());
        
        return new WrapperMultiProjectChecklistSimpleDto(simpleDtos);
    }
} 