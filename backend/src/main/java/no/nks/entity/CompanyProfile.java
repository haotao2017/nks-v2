package no.nks.entity;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class CompanyProfile {

    private Integer id;

    @NotEmpty(message = "CompanyName is required")
    @JsonProperty("companyName")
    private String companyName;

    @JsonProperty("organizationalNumber")
    private String organizationalNumber;

    @JsonProperty("address")
    private String address;

    @JsonProperty("ownerName")
    private String ownerName;

    @JsonProperty("postCode")
    private Integer postCode;

    @Size(min = 8, max = 8, message = "Number must be of 8 digits")
    @JsonProperty("telephone")
    private String telephone;

    @Size(min = 8, max = 8, message = "Number must be of 8 digits")
    @JsonProperty("mobile")
    private String mobile;

    @JsonProperty("nameOnEmailAddress")
    private String nameOnEmailAddress;

    @NotEmpty(message = "SenderEmailAddress is required")
    @JsonProperty("senderEmailAddress")
    private String senderEmailAddress;

    @JsonProperty("emailAddress")
    private String emailAddress;

    @JsonProperty("isSystemOwner")
    private Boolean isSystemOwner;

    @JsonProperty("signatureImageName")
    private String signatureImageName;

    @JsonProperty("compEmailHost")
    private String compEmailHost;

    @JsonProperty("compEmailPort")
    private String compEmailPort;

    @JsonProperty("compEmailUserName")
    private String compEmailUserName;

    @JsonProperty("compEmailPassword")
    private String compEmailPassword;

    @JsonProperty("compEmailDisplayName")
    private String compEmailDisplayName;

    @JsonProperty("isActive")
    private Boolean isActive;
} 