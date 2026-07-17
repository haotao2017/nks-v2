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
public class TripletexOrderLineDto {
    private TripletexProductDto product;
    private BigDecimal count;
    private BigDecimal unitPriceExcludingVatCurrency;
    private BigDecimal unitCostCurrency;
    private VatTypeDto vatType;
    private TripletexOrderDto order;
}
