package no.nks.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProjectPartyDetailsDto {
    private Integer partyId;
    private Integer partyTypeId;
    private String partyName;
    private String partyTypeName;
    private String email;
} 