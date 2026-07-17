package no.nks.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

@Entity
@Table(name = "ContactBook")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ContactBook {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Integer id;

    @Column(name = "OldID")
    private Integer oldId;

    @Column(name = "CityID")
    private Integer cityId;

    @Column(name = "Name", length = 500)
    private String name;

    @Column(name = "ContactNo", length = 250)
    private String contactNo;

    @Column(name = "Email", length = 500)
    private String email;

    @Column(name = "Address")
    private String address;

    @Column(name = "CompanyName")
    private String companyName;

    @Column(name = "VismaID", length = 200)
    private String vismaId;

    @Column(name = "ContactName")
    private String contactName; // Corresponds to SQL ContactName

    @Column(name = "PartyTypeID")
    private Integer partyTypeId;

    @Column(name = "Comment")
    private String comment;

    @Column(name = "IsCompany")
    private Boolean isCompany;

    @Column(name = "compName")
    private String compName; // Corresponds to SQL compName

    @Column(name = "toBeDeleted")
    private Boolean toBeDeleted;

    @Column(name = "PostNo")
    private String postNo;

    @Column(name = "Poststed")
    private String poststed;

    @Column(name = "Kommune")
    private String kommune;

    @Column(name = "TripletexID", length = 200)
    private String tripletexId;

    @Column(name = "Temp_Email", length = 500)
    private String tempEmail;

    @Column(name = "IsAdmin")
    private Boolean isAdmin;

    @Column(name = "CompanyID")
    private Integer companyId; // Corresponds to SQL CompanyID

    // Note: JPA identity strategy relies on the database's auto-increment feature.
    // The 'identity (3000, 1)' specific starting seed in SQL DDL is handled by the database itself.
} 