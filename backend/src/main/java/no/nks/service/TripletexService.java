package no.nks.service;

import no.nks.dto.RequestResponse;
import no.nks.dto.workflow.WrapperProjectInvoiceDataDto;

public interface TripletexService {

    /**
     * Creates an invoice (order) in the Tripletex system.
     * This involves finding/creating the customer, finding/creating products for each service,
     * and then creating the order itself.
     *
     * @param projectId The ID of the project to create an invoice for.
     * @return A RequestResponse indicating success or failure.
     */
    RequestResponse createTripletexOrderFromProject(Integer projectId);

    WrapperProjectInvoiceDataDto getInvoiceDetails(Integer projectId);

    RequestResponse sendInvoice(Integer projectId);
}
