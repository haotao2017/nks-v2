package no.nks.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "Doc", schema = "Party")
public class Doc {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Integer id;

    @Column(name = "PartyID")
    private Integer partyId;

    @Column(name = "PartyTypeID")
    private Integer partyTypeId;

    @Column(name = "PartyDocTypeID")
    private Integer partyDocTypeId;

    @Column(name = "ProjectID")
    private Integer projectId;

    @Column(name = "OtherDocs")
    private Integer otherDocs;

    @Column(name = "FileName")
    private String fileName;

    @Column(name = "Date")
    private LocalDateTime date;

    @Column(name = "isApproved")
    private Boolean isApproved;

    @Column(name = "WorkflowId")
    private Integer workflowId;

    @Column(name = "WorkflowStepId")
    private Integer workflowStepId;

    @Column(name = "CompanyID")
    private Integer companyId;
} 