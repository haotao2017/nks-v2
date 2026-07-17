package no.nks.dto;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class ServicePerSlabDto {
    private Integer id;
    private Integer serviceId;
    private Integer rangeFrom;
    private Integer rangeTo;
    private String rate;
}
