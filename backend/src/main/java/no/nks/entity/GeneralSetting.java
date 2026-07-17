package no.nks.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@Entity
@Table(name = "GeneralSetting")
public class GeneralSetting {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Integer id;

    @Column(name = "CompanyName", length = 500)
    private String companyName;

    @Column(name = "OrganizationalNumber", length = 250)
    private String organizationalNumber;

    @Lob
    @Column(name = "Address", columnDefinition = "nvarchar(max)")
    private String address;

    @Column(name = "OwnerName", length = 500)
    private String ownerName;

    @Column(name = "PostCode")
    private Integer postCode;

    @Column(name = "CityID")
    private Integer cityID;

    @Column(name = "EmailAddress", length = 500)
    private String emailAddress;

    @Column(name = "Telephone", length = 500)
    private String telephone;

    @Column(name = "Mobile", length = 500)
    private String mobile;

    @Column(name = "EmailSenderName", length = 500)
    private String emailSenderName;

    @Column(name = "SenderEmailAddress", length = 500)
    private String senderEmailAddress;

    @Column(name = "IsSystemOwner")
    private Boolean isSystemOwner;

    @Column(name = "SignatureImageName", length = 500)
    private String signatureImageName;

    @Column(name = "CompEmailHost", length = 200)
    private String compEmailHost;

    @Column(name = "CompEmailPort", length = 200)
    private String compEmailPort;

    @Column(name = "CompEmailUserName", length = 200)
    private String compEmailUserName;

    @Column(name = "CompEmailPassword", length = 200)
    private String compEmailPassword;

    @Column(name = "CompEmailDisplayName", length = 200)
    private String compEmailDisplayName;

    @Column(name = "IsActive")
    private Boolean isActive;
} 