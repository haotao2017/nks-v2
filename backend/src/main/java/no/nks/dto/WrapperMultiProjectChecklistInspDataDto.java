package no.nks.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * 项目多检查清单检查数据包装DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class WrapperMultiProjectChecklistInspDataDto {
    
    /**
     * 多项目检查清单检查数据
     */
    private List<ProjectChecklistInspDataDto> multiProjectChecklistInspData;
} 