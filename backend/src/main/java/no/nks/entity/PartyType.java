package no.nks.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Entity
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "PartyType", schema = "Party")
public class PartyType {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Integer id;
    
    @Column(name = "Name", length = 500)
    private String name;
    
    @Column(name = "SortOrder")
    private Integer sortOrder;
    
    @Column(name = "IsDefault", nullable = false)
    private boolean isDefault;
    
    @Column(name = "WorkflowCategoryID")
    private Integer workflowCategoryId;
    
    @Column(name = "CompanyID")
    private Integer companyId;
    
    // Custom getter and setter to handle the isDefault field
    public boolean isDefault() {
        return isDefault;
    }
    
    public void setDefault(boolean isDefault) {
        this.isDefault = isDefault;
    }
} 