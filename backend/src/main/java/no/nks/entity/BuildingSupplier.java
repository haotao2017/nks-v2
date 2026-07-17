package no.nks.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
@Entity
@Table(name = "BuildingSupplierTemplate")
public class BuildingSupplier {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @NotBlank(message = "Title is required")
    private String title;
    
    @JsonIgnore
    private Integer sortOrder;
    
    @JsonIgnore
    private Integer companyId;
} 