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
public class TripletexOrderDto {
    private Integer id;
    private TripletexCustomerDto customer;
    private String orderDate;
    private String deliveryDate;
    private EmployeeDto ourContactEmployee;
    private CurrencyDto currency;
    private Integer invoicesDueIn;
    private String invoicesDueInType;
    private String orderLineSorting;
    private String reference;
    private List<TripletexOrderLineDto> orderLines;
}
