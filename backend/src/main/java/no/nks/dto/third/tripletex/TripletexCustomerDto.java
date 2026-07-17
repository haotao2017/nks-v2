package no.nks.dto.third.tripletex;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class TripletexCustomerDto {
    private Integer id;
    private String name;
    private String email;
    private String invoiceEmail;
    private String phoneNumberMobile;
    private EmployeeDto accountManager;
    private String organizationNumber; // Mapped from C#'s use of vatNumber
    private String customerNumber;
    private String phoneNumber;
    private AddressDto invoiceAddress;
    private String invoiceSendMethod;
}
