package no.nks.dto.api;

import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.validation.constraints.NotBlank;

import java.util.List;

@Data
@NoArgsConstructor
public class CreateChecklistFromTemplateRequest {

    // 检查清单名称（同时也是项目标题）- 必填
    @NotBlank(message = "检查清单名称不能为空")
    private String checklistName;

    // 可选：选择的模板ID数组
    private List<Integer> templateIds;

    // 可选：自定义检查清单项
    private List<CreateChecklistItemRequest> customChecklistItems;
}
