package no.nks.dto.workflow;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ProjectWorkflowDto {
    private Integer id;
    private Integer projectId;
    private Integer workflowId;
    private Integer workflowStepId;
    private Integer serviceWorkflowCategoryId;
    private Boolean isTransfer;
    private Integer emailHistoryId;
    private LocalDateTime insertDate;
    private Integer insertedBy;
    private Integer taskId;
    private String emailContent;
    private String emailSubject;
    private String emailTo;
    private String projectLeaderEmailTo;
    private String emailFrom;
    private String attachmentURL;
    private List<String> attachmentURLs;
    private String fileName;
    private List<String> fileNames;
    private String rootURL;
    private Integer emailTempId;
    private LocalDateTime contactCustomerDate;
    private EmailProjectPartiesWorkflowDto emailProjectParties;
    private String baseURLSite;
    private String projectInspectionEventComment;
    private Integer projectInspectorId;
    private LocalDateTime projectInspectionDate;
    private Boolean projectSkipInspection;
    private Boolean isInspectorEmail;
    private Boolean isApprovedInspReport;
    private String checklistItemIdCommaSeperated;
    private String tepmlateValue;
    private String avvik;
    private String avvikSendtKommune;
    private List<EmailProjectPartiesSentDto> emailProjectPartiesSent;

    // Fields for party-specific email history
    private Integer partyId;
    private Integer partyTypeId;
    private String urlKey;

    private String toEmail;
    private String fromEmail;
    private String fileUrl;
    private List<String> fileUrls;

    public void addFileUrl(String fileUrl) {
        if (fileUrls == null) {
            fileUrls = new ArrayList<>();
        }
        fileUrls.add(fileUrl);
    }
}
