package no.nks.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnore;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProjectDto {
    private Integer id;
    private String vismaId;
    private String title;
    
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss.SS'Z'", timezone = "UTC", shape = JsonFormat.Shape.STRING)
    private LocalDateTime dated;
    
    private Integer customerId;
    private Integer contactPersonId;
    private Integer buildingSupplierId;
    private String gardsNo;
    private String bruksnmmer;
    private String address;
    private String postNo;
    private String poststed;
    private String kommune;
    private String comments;
    private Integer inspectorId;
    private Integer projectLeaderId;
    
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss.SS'Z'", timezone = "UTC", shape = JsonFormat.Shape.STRING)
    private LocalDateTime remContactCustomerDate;
    
    private String description;
    
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss.SS'Z'", timezone = "UTC", shape = JsonFormat.Shape.STRING)
    private LocalDateTime completeDate;
    
    private Boolean isSubmitted;
    private String longitude;
    private String latitude;
    private String inspectionEventComment;
    
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss.SS'Z'", timezone = "UTC", shape = JsonFormat.Shape.STRING)
    private LocalDateTime inspectionDate;
    
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss.SS'Z'", timezone = "UTC", shape = JsonFormat.Shape.STRING)
    private LocalDateTime godkjensDate;
    
    private String projectStatus;
    private String projectImage;
    private String inspectorComment;
    private String inspectorSignature;
    
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss.SS'Z'", timezone = "UTC", shape = JsonFormat.Shape.STRING)
    private LocalDateTime takkBestillingenCdate;
    
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss.SS'Z'", timezone = "UTC", shape = JsonFormat.Shape.STRING)
    private LocalDateTime soknadOmAnsvarsrettCdate;
    
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss.SS'Z'", timezone = "UTC", shape = JsonFormat.Shape.STRING)
    private LocalDateTime ansvarligSokerCdate;
    
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss.SS'Z'", timezone = "UTC", shape = JsonFormat.Shape.STRING)
    private LocalDateTime gratulererGodkjentCdate;
    
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss.SS'Z'", timezone = "UTC", shape = JsonFormat.Shape.STRING)
    private LocalDateTime createChecklistCdate;
    
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss.SS'Z'", timezone = "UTC", shape = JsonFormat.Shape.STRING)
    private LocalDateTime addPartiesCdate;
    
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss.SS'Z'", timezone = "UTC", shape = JsonFormat.Shape.STRING)
    private LocalDateTime setProLeaderContactCustomerCdate;
    
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss.SS'Z'", timezone = "UTC", shape = JsonFormat.Shape.STRING)
    private LocalDateTime emailCustomerUpInspectionCd;
    
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss.SS'Z'", timezone = "UTC", shape = JsonFormat.Shape.STRING)
    private LocalDateTime upcomingInspectionCdate;
    
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss.SS'Z'", timezone = "UTC", shape = JsonFormat.Shape.STRING)
    private LocalDateTime partiesDataCdate;
    
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss.SS'Z'", timezone = "UTC", shape = JsonFormat.Shape.STRING)
    private LocalDateTime assignInspectorCdate;
    
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss.SS'Z'", timezone = "UTC", shape = JsonFormat.Shape.STRING)
    private LocalDateTime projectSubProcessCdate;
    
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss.SS'Z'", timezone = "UTC", shape = JsonFormat.Shape.STRING)
    private LocalDateTime projectSubCompleteCd;
    
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss.SS'Z'", timezone = "UTC", shape = JsonFormat.Shape.STRING)
    private LocalDateTime reviewInspReportCd;
    
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss.SS'Z'", timezone = "UTC", shape = JsonFormat.Shape.STRING)
    private LocalDateTime invoiceSetCd;
    
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss.SS'Z'", timezone = "UTC", shape = JsonFormat.Shape.STRING)
    private LocalDateTime submitInspectionRepRemindCd;
    
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss.SS'Z'", timezone = "UTC", shape = JsonFormat.Shape.STRING)
    private LocalDateTime submitInspectionRepRemindAgainCd;
    
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss.SS'Z'", timezone = "UTC", shape = JsonFormat.Shape.STRING)
    private LocalDateTime kontrollerklaeringPdfCd;
    
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss.SS'Z'", timezone = "UTC", shape = JsonFormat.Shape.STRING)
    private LocalDateTime finalReportPdfCdate;
    
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss.SS'Z'", timezone = "UTC", shape = JsonFormat.Shape.STRING)
    private LocalDateTime modifiedDate;
    
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss.SS'Z'", timezone = "UTC", shape = JsonFormat.Shape.STRING)
    private LocalDateTime invoiceSetDate;
    
    private Boolean isDeleted;
    private Boolean isArchived;
    private Boolean isApprovedInspReport;
    
    private Boolean takkBestillingenIsCompleted;
    private Boolean soknadOmAnsvarsrettIsCompleted;
    private Boolean ansvarligSokerIsCompleted;
    private Boolean gratulererGodkjentIsCompleted;
    private Boolean createChecklistIsCompleted;
    private Boolean addPartiesIsCompleted;
    private Boolean setProLeaderContactCustomerIsCompleted;
    private Boolean emailCustomerUpInspectionIsCompleted;
    private Boolean partiesDataIsCompleted;
    private Boolean assignInspectorIsCompleted;
    private Boolean isApprovedInspReportIsCompleted;
    
    private String vismaInvoiceId;
    private String invoiceTripletexID;
    private String tepmlateValue;
    private String avvik;
    private Boolean avvikSendtKommune;
    private Boolean skipInspection;
    
    @JsonIgnore
    private Integer companyId;
    @JsonIgnore
    private Integer userId;
    
    // 相关联的实体数据，仅在需要时包含
    private Object customer;
    private Object contactPerson;
    private Object buildingSupplier;
    private List<ProjectServiceDto> projectService;
    private List<ServiceWorkflowCategoryDto> projectServiceWorkflowList;
    private Object projectParties;
} 