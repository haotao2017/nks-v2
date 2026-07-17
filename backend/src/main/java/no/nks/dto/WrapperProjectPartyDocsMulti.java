package no.nks.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

/**
 * 项目参与方文档列表包装DTO
 * 用于GetDocumentsListRequiredFromParty接口
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class WrapperProjectPartyDocsMulti {
    private Integer workflowId;
    private Integer projectID;
    private Integer partyID;
    private Integer partyTypeID;
    private String urlKey;
    private List<DocTypeDto> projectPartyDocsMulti = new ArrayList<>();
} 