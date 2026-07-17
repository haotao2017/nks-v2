package no.nks.service;

import no.nks.dto.GenericApiResponseDto;
import no.nks.dto.PartyTypeDto;
import no.nks.dto.PartyTypeResponseDto;

import java.util.List;

public interface PartyTypeService {

    /**
     * Get a single party type by ID
     *
     * @param partyTypeId the ID of the party type to retrieve
     * @param companyId the ID of the company (for authorization)
     * @return the party type wrapped in a response DTO
     */
    PartyTypeResponseDto getSinglePartyType(Integer partyTypeId, Integer companyId);

    /**
     * Update an existing party type
     *
     * @param partyTypeDto the party type with updated values
     * @param companyId the ID of the company (for authorization)
     * @return the updated party type wrapped in a response DTO
     */
    PartyTypeResponseDto updatePartyType(PartyTypeDto partyTypeDto, Integer companyId);

    /**
     * Delete a party type by ID
     *
     * @param partyTypeId the ID of the party type to delete
     * @param companyId the ID of the company (for authorization)
     * @return a response indicating success or failure
     */
    GenericApiResponseDto deletePartyType(Integer partyTypeId, Integer companyId);

    /**
     * Create a new party type
     *
     * @param partyTypeDto the party type data to create
     * @param companyId the ID of the company to associate with the party type
     * @return the created party type (with assigned ID) wrapped in a response DTO
     */
    PartyTypeResponseDto createPartyType(PartyTypeDto partyTypeDto, Integer companyId);

    /**
     * Get all party types for a company
     *
     * @param companyId the ID of the company
     * @return a list of party types
     */
    List<PartyTypeDto> getAllPartyTypes(Integer companyId);
}
