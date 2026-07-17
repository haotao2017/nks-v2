package no.nks.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

/**
 * 项目单个参与方已上传文档文件列表包装DTO
 * 用于GetProjectSinglePartyDocsUploadedFileList接口
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class WrapperProjectSinglePartyDocsUploadedFileList {
    private Integer workflowId;
    private Integer projectID;
    private Integer partyID;
    private Integer partyTypeID;
    private String urlKey;
    private List<ProjectSinglePartyDocsFilesListDto> filesList = new ArrayList<>();
}
