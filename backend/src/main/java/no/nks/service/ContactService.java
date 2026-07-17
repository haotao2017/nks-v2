package no.nks.service;

import no.nks.dto.ContactDto;
import no.nks.dto.DeleteContactResponseDto;

import java.util.List;

public interface ContactService {

    ContactDto createContact(ContactDto contactDto, Integer companyId);

    List<ContactDto> getAllContactsByCompanyId(Integer companyId);

    ContactDto updateContact(ContactDto contactDto, Integer requestingUserCompanyId);

    DeleteContactResponseDto deleteContact(Integer contactId, Integer requestingUserCompanyId);

    ContactDto getContactByIdAndCompanyId(Integer contactId, Integer requestingUserCompanyId);
}
