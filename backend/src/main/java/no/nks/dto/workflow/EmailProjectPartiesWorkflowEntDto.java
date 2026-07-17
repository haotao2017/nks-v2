package no.nks.dto.workflow;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class EmailProjectPartiesWorkflowEntDto {
    private Integer partyID;
    private Integer partyTypeID;
    private String partyName;
    private String partyTypeName;
    private String content;
    private String title;
    private String emailTo;
    private String emailFrom;
    private Boolean sendEmail;
    private String urlKey;
}
