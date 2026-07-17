package no.nks.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@Entity
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "EmailHistory", schema = "nbkUser")
public class EmailHistory {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Integer id;
    
    @Column(name = "ProjectID")
    private Integer projectId;
    
    @Column(name = "PartyId")
    private Integer partyId;
    
    @Column(name = "Subject")
    private String subject;
    
    @Column(name = "ToEmail")
    private String toEmail;
    
    @Column(name = "FromEmail")
    private String fromEmail;
    
    @Column(name = "Message")
    private String message;
    
    @Column(name = "FileName")
    private String fileName;
    
    @Column(name = "ProjectStatus")
    private Integer projectStatus;
    
    @Column(name = "Status")
    private Boolean status;
    
    @Column(name = "Date")
    private LocalDateTime date;
    
    @Column(name = "PartyTypeId")
    private Integer partyTypeId;
    
    @Column(name = "Is_email")
    private Boolean isEmail;
    
    @Column(name = "WorkflowId")
    private Integer workflowId;
    
    @Column(name = "WorkflowStepId")
    private Integer workflowStepId;
    
    @Column(name = "UrlKey")
    private String urlKey;
    
    @Column(name = "CompanyID")
    private Integer companyId;
} 