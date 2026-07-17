package no.nks.dto.third.tripletex;

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
public class CountryDto {
    private Integer id;
    private Integer version;
    private String url;
    private String name;
    private String isoAlpha2Code;
    private String isoAlpha3Code;
    private String isoNumericCode;
}
