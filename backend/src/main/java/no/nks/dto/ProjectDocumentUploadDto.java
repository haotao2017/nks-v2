package no.nks.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class ProjectDocumentUploadDto {
    @JsonAlias({"ProjectId", "ProjectID", "projectID", "PROJECTID"})
    private Integer projectId;
    
    @JsonAlias({"WorkflowId", "WorkflowID", "workflowID", "WORKFLOWID"})
    private Integer workflowId;
    
    @JsonAlias({"PartyId", "PartyID", "partyID", "PARTYID"})
    private Integer partyId;
    
    @JsonAlias({"PartyTypeId", "PartyTypeID", "partyTypeID", "PARTYTYPEID"})
    private Integer partyTypeId;
    
    @JsonAlias({"DocumenTypeId", "DocumenTypeID", "documenTypeID", "DOCUENTYPEID", 
                "DocumentTypeId", "DocumentTypeID", "documentTypeID", "DOCUMENTTYPEID"})
    private Integer documenTypeId;
    
    @JsonAlias({"OtherDocs", "otherDOCS", "OTHERDOCS"})
    private Integer otherDocs;
    
    @JsonAlias({"FileName", "fileName", "FILENAME"})
    private String fileName;
    
    @JsonAlias({"InsertDate", "insertDate", "INSERTDATE"})
    private LocalDateTime insertDate;
    
    @JsonAlias({"InsertedBy", "insertedBy", "INSERTEDBY"})
    private Integer insertedBy;
} 