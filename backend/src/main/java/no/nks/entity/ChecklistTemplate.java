package no.nks.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Entity
@Table(name = "ChecklistTemplate")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChecklistTemplate {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "Id")
    private Integer id;
    
    @Column(name = "Title")
    private String title;
    
    @Column(name = "isDefault")
    private Boolean isDefault;
    
    @Column(name = "SortOrder")
    private Integer sortOrder;
    
    @Column(name = "CompanyID")
    private Integer companyId;
    
    @OneToMany(mappedBy = "checklistId", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ChecklistItemTemplate> checklistItemTemplates;
    
    @OneToMany(mappedBy = "checklistTempId")
    private List<Service> services;
} 