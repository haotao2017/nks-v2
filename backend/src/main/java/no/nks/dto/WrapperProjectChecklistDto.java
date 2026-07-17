package no.nks.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 包装单个项目检查清单的响应
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class WrapperProjectChecklistDto {
    private ProjectChecklistDto projectChecklist;
} 