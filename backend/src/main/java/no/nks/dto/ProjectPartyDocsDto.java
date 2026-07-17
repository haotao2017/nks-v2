package no.nks.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProjectPartyDocsDto {
    private Integer id;
    private Integer partyDocTypeId;
    private String docName;
    private String fileName;
    private String date;
    private Integer sortOrder;
} 