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
public class EmailProjectPartiesSentDto {
    private Integer partyID;
    private Integer partyTypeID;
    private String emailContent;
    private String emailFrom;
    private String emailTo;
    private String emailSubject;
}
