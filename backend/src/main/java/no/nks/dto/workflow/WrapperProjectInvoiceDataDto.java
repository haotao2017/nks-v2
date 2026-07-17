package no.nks.dto.workflow;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WrapperProjectInvoiceDataDto {

    // This field holds the actual invoice data.
    private ProjectInvoiceDataDto projectInvoiceDataENT;
}
