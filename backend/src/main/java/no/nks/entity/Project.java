package no.nks.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

@Entity
@Data
@NoArgsConstructor
@Table(name = "Project")
public class Project {
    @Id
    private Integer id;
    
    @Column(name = "VismaID", length = 200)
    private String vismaId;
    
    @Column(name = "Title", columnDefinition = "nvarchar(max)")
    private String title;
    
    @Column(name = "Dated")
    private LocalDateTime dated;
    
    @Column(name = "CustomerID")
    private Integer customerId;
    
    @Column(name = "ContactPersonID")
    private Integer contactPersonId;
    
    @Column(name = "BuildingSupplierId")
    private Integer buildingSupplierId;
    
    @Column(name = "GardsNo", columnDefinition = "nvarchar(max)")
    private String gardsNo;
    
    @Column(name = "Bruksnmmer", columnDefinition = "nvarchar(max)")
    private String bruksnmmer;
    
    @Column(name = "Address", columnDefinition = "nvarchar(max)")
    private String address;
    
    @Column(name = "PostNo", columnDefinition = "nvarchar(max)")
    private String postNo;
    
    @Column(name = "Poststed", columnDefinition = "nvarchar(max)")
    private String poststed;
    
    @Column(name = "Kommune", columnDefinition = "nvarchar(max)")
    private String kommune;
    
    @Column(name = "Comments", columnDefinition = "nvarchar(max)")
    private String comments;
    
    @Column(name = "InspectorId")
    private Integer inspectorId;
    
    @Column(name = "ProjectLeaderID")
    private Integer projectLeaderId;
    
    @Column(name = "RemContactCustomerDate")
    private LocalDateTime remContactCustomerDate;
    
    @Column(name = "RemContactCustomerDDL")
    private Integer remContactCustomerDDL;
    
    @Column(name = "Description", columnDefinition = "nvarchar(max)")
    private String description;
    
    @Column(name = "CompleteDate")
    private LocalDateTime completeDate;
    
    @Column(name = "isSubmitted")
    private Boolean isSubmitted;
    
    @Column(name = "Longitude", length = 100)
    private String longitude;
    
    @Column(name = "Latitude", length = 100)
    private String latitude;
    
    @Column(name = "InspectionEventComment", columnDefinition = "nvarchar(max)")
    private String inspectionEventComment;
    
    @Column(name = "InspectionDate")
    private LocalDateTime inspectionDate;
    
    @Column(name = "GodkjensDate")
    private LocalDateTime godkjensDate;
    
    @Column(name = "ProjectStatus", length = 50)
    private String projectStatus;
    
    @Column(name = "ProjectImage", length = 200)
    private String projectImage;
    
    @Column(name = "InspectorComment", columnDefinition = "nvarchar(max)")
    private String inspectorComment;
    
    @Column(name = "InspectorSignature", length = 100)
    private String inspectorSignature;
    
    @Column(name = "TakkBestillingenCDate")
    private LocalDateTime takkBestillingenCDate;
    
    @Column(name = "SoknadOmAnsvarsrettCDate")
    private LocalDateTime soknadOmAnsvarsrettCDate;
    
    @Column(name = "AnsvarligSokerCDate")
    private LocalDateTime ansvarligSokerCDate;
    
    @Column(name = "GratulererGodkjentCDate")
    private LocalDateTime gratulererGodkjentCDate;
    
    @Column(name = "CreateChecklistCDate")
    private LocalDateTime createChecklistCDate;
    
    @Column(name = "AddPartiesCDate")
    private LocalDateTime addPartiesCDate;
    
    @Column(name = "SetProLeaderContactCustomerCDate")
    private LocalDateTime setProLeaderContactCustomerCDate;
    
    @Column(name = "EmailCustomerUpInspectionCD")
    private LocalDateTime emailCustomerUpInspectionCD;
    
    @Column(name = "UpcomingInspectionCDate")
    private LocalDateTime upcomingInspectionCDate;
    
    @Column(name = "PartiesDataCDate")
    private LocalDateTime partiesDataCDate;
    
    @Column(name = "AssignInspectorCDate")
    private LocalDateTime assignInspectorCDate;
    
    @Column(name = "ProjectSubProcessCDate")
    private LocalDateTime projectSubProcessCDate;
    
    @Column(name = "ProjectSubCompleteCD")
    private LocalDateTime projectSubCompleteCD;
    
    @Column(name = "ReviewInspReportCD")
    private LocalDateTime reviewInspReportCD;
    
    @Column(name = "InvoiceSetCD")
    private LocalDateTime invoiceSetCD;
    
    @Column(name = "SubmitInspectionRepRemindCD")
    private LocalDateTime submitInspectionRepRemindCD;
    
    @Column(name = "SubmitInspectionRepRemindAgainCD")
    private LocalDateTime submitInspectionRepRemindAgainCD;
    
    @Column(name = "KontrollerklaeringPdfCD")
    private LocalDateTime kontrollerklaeringPdfCD;
    
    @Column(name = "FinalReportPdfCDate")
    private LocalDateTime finalReportPdfCDate;
    
    @Column(name = "ModifiedDate")
    private LocalDateTime modifiedDate;
    
    @Column(name = "isDeleted")
    private Boolean isDeleted;
    
    @Column(name = "isArchived")
    private Boolean isArchived;
    
    @Column(name = "isApprovedInspReport")
    private Boolean isApprovedInspReport;
    
    @Column(name = "VismaInvoiceID", length = 200)
    private String vismaInvoiceId;
    
    @Column(name = "TakkBestillingenIsCompleted")
    private Boolean takkBestillingenIsCompleted;
    
    @Column(name = "SoknadOmAnsvarsrettIsCompleted")
    private Boolean soknadOmAnsvarsrettIsCompleted;
    
    @Column(name = "AnsvarligSokerIsCompleted")
    private Boolean ansvarligSokerIsCompleted;
    
    @Column(name = "GratulererGodkjentIsCompleted")
    private Boolean gratulererGodkjentIsCompleted;
    
    @Column(name = "CreateChecklistIsCompleted")
    private Boolean createChecklistIsCompleted;
    
    @Column(name = "AddPartiesIsCompleted")
    private Boolean addPartiesIsCompleted;
    
    @Column(name = "SetProLeaderContactCustomerIsCompleted")
    private Boolean setProLeaderContactCustomerIsCompleted;
    
    @Column(name = "EmailCustomerUpInspectionIsCompleted")
    private Boolean emailCustomerUpInspectionIsCompleted;
    
    @Column(name = "PartiesDataIsCompleted")
    private Boolean partiesDataIsCompleted;
    
    @Column(name = "AssignInspectorIsCompleted")
    private Boolean assignInspectorIsCompleted;
    
    @Column(name = "isApprovedInspReportIsCompleted")
    private Boolean isApprovedInspReportIsCompleted;
    
    @Column(name = "InvoiceTripletexID", length = 200)
    private String invoiceTripletexID;
    
    @Column(name = "TepmlateValue", length = 50)
    private String tepmlateValue;
    
    @Column(name = "Avvik", columnDefinition = "nvarchar(max)")
    private String avvik;
    
    @Column(name = "AvvikSendtKommune", columnDefinition = "nvarchar(max)")
    private String avvikSendtKommune;
    
    @Column(name = "skip_inspection")
    private Boolean skipInspection;

    @JsonIgnore
    @Column(name = "CompanyID")
    private Integer companyId;

    @JsonIgnore
    @Column(name = "UserID")
    private Integer userId;

    @OneToMany(mappedBy = "project", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<ProjectService> projectServices = new ArrayList<>();
    
    @OneToMany(mappedBy = "project")
    private List<ProjectChecklist> projectChecklists = new ArrayList<>();
    
    @OneToMany(mappedBy = "project")
    private List<ProjectParty> projectParties = new ArrayList<>();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "CustomerId", referencedColumnName = "Id", insertable = false, updatable = false)
    private ContactBook customer;
} 