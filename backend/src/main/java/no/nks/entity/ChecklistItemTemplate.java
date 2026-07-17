package no.nks.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "ChecklistItemTemplate")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChecklistItemTemplate {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "Id")
    private Integer id;
    
    @Column(name = "ChecklistId")
    private Integer checklistId;
    
    @Column(name = "Title")
    private String title;
    
    @Column(name = "SortOrder")
    private Integer sortOrder;
    
    @Column(name = "CompanyID")
    private Integer companyId;
    
    @ManyToOne
    @JoinColumn(name = "ChecklistId", insertable = false, updatable = false)
    private ChecklistTemplate checklist;
} 