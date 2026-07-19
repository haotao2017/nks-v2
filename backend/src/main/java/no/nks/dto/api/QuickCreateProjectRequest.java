package no.nks.dto.api;

import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.validation.constraints.NotBlank;

import java.util.List;

@Data
@NoArgsConstructor
public class QuickCreateProjectRequest {
    
    // 只需要项目标题
    @NotBlank(message = "Prosjekttittel mangler")
    private String projectTitle;
    
    // 可选：选择的模板ID列表
    private List<Integer> templateIds;
    
    // 可选：项目描述
    private String projectDescription;
}
