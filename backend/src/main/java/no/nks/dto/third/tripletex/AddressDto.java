package no.nks.dto.third.tripletex;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class AddressDto {
    private Integer id;
    private Integer version;
    private List<ChangeDto> changes;
    private String url;
    private String addressLine1;
    private String addressLine2;
    private String postalCode;
    private String city;
    private CountryDto country;
}
