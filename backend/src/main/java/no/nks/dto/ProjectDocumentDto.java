package no.nks.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProjectDocumentDto {
    @JsonProperty("documentID")
    private Integer documentId;
    
    @JsonProperty("partyID")
    private Integer partyId;
    
    @JsonProperty("partyTypeID")
    private Integer partyTypeId;
    
    private Integer documenTypeId;
    
    private String fileName;
    
    private LocalDateTime date;
    
    private String documentName;
    
    @JsonProperty("projectPartyID")
    private Integer projectPartyId;
    
    @JsonProperty("imageURL")
    private String imageUrl;
    
    private Integer workflowStepId;
    
    private String workflowStepName;
    
    @JsonProperty("isRequired")
    private Boolean isRequired;
    
    @JsonProperty("isApproved")
    private Boolean isApproved;
} 