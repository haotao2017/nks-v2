package no.nks.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@Entity
@Table(name = "ProjectService")
public class ProjectService {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "Id")
    private Integer id;

    @Column(name = "ProjectId")
    private Integer projectId;

    @Column(name = "ServiceId")
    private Integer serviceId;
    
    @Column(name = "Quantity")
    private Integer quantity;
    
    @Column(name = "Price")
    private String price;
    
    @Column(name = "IsNewAdded")
    private Boolean isNewAdded;

    @ManyToOne
    @JoinColumn(name = "ProjectId", insertable = false, updatable = false)
    private Project project;

    @ManyToOne
    @JoinColumn(name = "ServiceId", insertable = false, updatable = false)
    private Service service;
} 