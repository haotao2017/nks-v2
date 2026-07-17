package no.nks.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.fasterxml.jackson.annotation.JsonIgnore;
/**
 * 项目单个参与方文档文件列表项DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProjectSinglePartyDocsFilesListDto {
    private Integer id;
    private Integer partyDocTypeId;
    @JsonIgnore
    private String docName;
    private String fileName;
    @JsonIgnore
    private String date;
} 