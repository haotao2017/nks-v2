package no.nks.dto.workflow;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProjectInvoiceDataDto {
    private Integer projectId;
    private Integer workflowId;
    private Integer workflowStepId;
    private String invoiceDetails;
    private Double amount;
}
