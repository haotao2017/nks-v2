package no.nks.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 项目参与方文档检查数据包装DTO
 * 用于GetChecklistItemInspectinDataForParty和UploadChecklistItemImageInspectinDataFromParty接口
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class WrapperProjectPartyDocsInspection {
    private Integer workflowId;
    private Integer projectID;
    private Integer partyID;
    private Integer partyTypeID;
    private String urlKey;
    private String checklistItemIdCommaSeperated;
    private ProjectChecklistInspDataDto projectChecklistThirdPartyInspData;
}
