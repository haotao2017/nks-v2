package no.nks.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

/**
 * 项目参与方已上传文档数量DTO
 * 用于GetDocumentsListCountUploadByParty接口
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CountProjectPartyDocsUploaded {
    private Integer workflowId;
    private Integer projectID;
    private Integer partyID;
    private Integer partyTypeID;
    private String urlKey;
    private Integer uploadedFilesCount;
    private List<DocumentCountByDocTypeIdDto> documentsCountByDocType = new ArrayList<>();
    
    /**
     * 按文档类型统计文档数量的内部DTO
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DocumentCountByDocTypeIdDto {
        private Integer docTypeID;
        private Integer uploadedFilesCount;
    }
} 