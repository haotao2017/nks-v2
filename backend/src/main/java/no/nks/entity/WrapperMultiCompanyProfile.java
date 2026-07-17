package no.nks.entity;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
public class WrapperMultiCompanyProfile {
    
    @JsonProperty("multiCompanyProfile")
    private List<CompanyProfile> multiCompanyProfile = new ArrayList<>();
} 