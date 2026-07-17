package no.nks.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "Service")
public class Service {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "Id")
    private Integer id;

    @Column(name = "ServiceTypeId")
    private Integer serviceTypeId;

    @Column(name = "Name")
    private String name;

    @Column(name = "Rate")
    private String rate;

    @Column(name = "Description")
    private String description;

    @Column(name = "ServiceChargedAs")
    private Integer serviceChargedAs;

    @Column(name = "ChecklistTempId")
    private Integer checklistTempId;

    @Column(name = "CompanyID")
    private Integer companyId;

    @Column(name = "TripletexId", length = 200)
    private String tripletexId;

    @ManyToOne
    @JoinColumn(name = "ChecklistTempId", insertable = false, updatable = false)
    private ChecklistTemplate checklistTemplate;

    @OneToMany(mappedBy = "service", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ServicePerSlab> servicePerSlabs;

    @OneToMany(mappedBy = "service", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ServiceWorkflowCategory> serviceWorkflowCategories;
} 