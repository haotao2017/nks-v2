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
public class BuildingSupplierDto {
    private Integer id;
    private String title;
    private String address;
    private String contactNo;
    private String email;
    private Integer companyId;
} 