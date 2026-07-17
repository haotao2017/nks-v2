package no.nks.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotEmpty;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "DocType", schema = "Party")
public class DocType {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Integer id;

    @Column(name = "PartyTypeID")
    private Integer partyTypeId;

    @NotEmpty(message = "DocName is required")
    @Column(name = "DocName")
    private String docName;

    @Column(name = "isRequired")
    private Boolean isRequired;

    @JsonIgnore
    @Column(name = "SortOrder")
    private Integer sortOrder;

    @JsonIgnore
    @Column(name = "CompanyID")
    private Integer companyId;
} 