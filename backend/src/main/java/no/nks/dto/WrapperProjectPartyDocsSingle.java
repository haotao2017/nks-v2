package no.nks.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 项目参与方单个文档包装DTO
 * 用于UploadDocumentFromParty接口
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class WrapperProjectPartyDocsSingle {
    private Integer workflowId;
    private Integer projectID;
    private Integer partyID;
    private Integer partyTypeID;
    private String urlKey;
    private ProjectPartyDocsDto projectPartyDocsSingle;
}
