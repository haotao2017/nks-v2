package no.nks.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ServiceItemTemplateDto {

    private Integer id;

    private Integer serviceTypeId;

    private String name;

    private String rate;

    private String description;

    private Integer serviceChargedAs;

    private Integer checklistTempId;
}
