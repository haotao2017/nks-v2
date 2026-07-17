package no.nks.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ProjectServiceDto {
    private Integer id;
    private Integer projectId;
    private Integer serviceId;
    private Integer quantity;
    private String price;
    private Boolean isNewAdded;
    private ServiceDto service;
} 