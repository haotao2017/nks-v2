package no.nks.dto;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PartyTypeDto {
    private Integer id;
    private String name;

    @JsonIgnore
    private Integer sortOrder;

    @JsonProperty("isDefault")
    private boolean isDefault;

    private Integer workflowCategoryID;

    @JsonIgnore
    private Integer companyID;
}
