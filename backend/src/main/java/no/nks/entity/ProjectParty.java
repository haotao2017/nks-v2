package no.nks.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@Entity
@Table(name = "ProjectParty")
public class ProjectParty {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Integer id;

    @Column(name = "ProjectID")
    private Integer projectId;

    @Column(name = "PartyID")
    private Integer partyId;

    @Column(name = "PartyTypeID")
    private Integer partyTypeId;

    @ManyToOne
    @JoinColumn(name = "ProjectID", insertable = false, updatable = false)
    private Project project;

    @ManyToOne
    @JoinColumn(name = "PartyID", insertable = false, updatable = false)
    private ContactBook party;

    @ManyToOne
    @JoinColumn(name = "PartyTypeID", insertable = false, updatable = false)
    private PartyType partyType;

    @Transient
    private String partyTypeName;
    
    @Transient
    private String partyName;
    
    @Transient
    private String email;
    
    @Transient
    private String contactNumber;
} 