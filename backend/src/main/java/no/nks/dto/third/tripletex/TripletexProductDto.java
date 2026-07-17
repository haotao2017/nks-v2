package no.nks.dto.third.tripletex;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class TripletexProductDto {
    private Integer id;
    private String name;
    private String number;
    private BigDecimal priceExcludingVatCurrency;
    private BigDecimal costExcludingVatCurrency;
    private VatTypeDto vatType;
    private ProductUnitDto productUnit;
}
