package no.nks.dto.api;

import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
public class CreateChecklistWithProjectRequest {

    // 项目基本信息 - 只需要标题
    @NotBlank(message = "Prosjekttittel mangler")
    private String projectTitle;

    // 可选的项目信息
    private String projectDescription;
    private String address;
    private String postNo;
    private String poststed;
    private String kommune;
    private String comments;
    private Integer customerId;
    private Integer contactPersonId;
    private String longitude;
    private String latitude;

    // 检查清单信息 - 简化为可选
    private String checklistName; // 如果不提供，使用默认名称
    private String checklistComment;

    // 检查清单项 - 如果不提供，创建默认的检查项
    private List<CreateChecklistItemRequest> checklistItems = new ArrayList<>();
}
