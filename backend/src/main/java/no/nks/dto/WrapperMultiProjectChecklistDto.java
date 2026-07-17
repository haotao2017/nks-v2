package no.nks.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * 包装多个项目检查清单的响应
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class WrapperMultiProjectChecklistDto {
    private List<ProjectChecklistDto> multiProjectChecklist;
} 