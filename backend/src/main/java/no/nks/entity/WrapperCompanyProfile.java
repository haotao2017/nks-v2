package no.nks.entity;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class WrapperCompanyProfile {
    
    @JsonProperty("companyProfile")
    private CompanyProfile companyProfile;
} 