package no.nks.service.impl;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import no.nks.dto.ContactDto;
import no.nks.dto.DeleteContactResponseDto;
import no.nks.entity.ContactBook;
import no.nks.repository.ContactRepository;
import no.nks.repository.ProjectRepository;
import no.nks.service.ContactService;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ContactServiceImpl implements ContactService {

    private final ContactRepository contactRepository;
    private final ProjectRepository projectRepository;

    @Override
    @Transactional
    public ContactDto createContact(ContactDto contactDto, Integer companyId) {
        log.info("Attempting to create contact for name: {}, CompanyID: {}", contactDto.getName(), companyId);

        ContactBook contactBook = mapDtoToEntity(contactDto);
        contactBook.setCompanyId(companyId);

        if (contactBook.getIsCompany() == null) {
            contactBook.setIsCompany(false);
        }
        if (contactBook.getToBeDeleted() == null) {
            contactBook.setToBeDeleted(false);
        }

        ContactBook savedContact = contactRepository.save(contactBook);
        log.info("Successfully created contact with ID: {}", savedContact.getId());

        return mapEntityToDto(savedContact);
    }

    @Override
    public List<ContactDto> getAllContactsByCompanyId(Integer companyId) {
        log.info("Attempting to retrieve all contacts for CompanyID: {}", companyId);
        List<ContactBook> contactBooks = contactRepository.findByCompanyId(companyId);
        List<ContactDto> contactDtos = contactBooks.stream()
                .map(this::mapEntityToDto)
                .collect(Collectors.toList());

        contactDtos.sort(Comparator.comparing(ContactDto::getName, Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER)));

        log.info("Successfully retrieved and sorted {} contacts for CompanyID: {}", contactDtos.size(), companyId);
        return contactDtos;
    }

    @Override
    @Transactional
    public ContactDto updateContact(ContactDto contactDtoToUpdate, Integer requestingUserCompanyId) {
        log.info("Attempting to update contact with ID: {} by user with CompanyID: {}", contactDtoToUpdate.getId(), requestingUserCompanyId);

        if (contactDtoToUpdate.getId() == null) {
            throw new IllegalArgumentException("Contact ID cannot be null for an update operation.");
        }

        ContactBook existingContact = contactRepository.findById(contactDtoToUpdate.getId())
                .orElseThrow(() -> new EntityNotFoundException("Contact not found with id: " + contactDtoToUpdate.getId()));

        if (!existingContact.getCompanyId().equals(requestingUserCompanyId)) {
            log.warn("Authorization failed: User with CompanyID {} attempted to update contact {} belonging to CompanyID {}.",
                    requestingUserCompanyId, existingContact.getId(), existingContact.getCompanyId());
            throw new AccessDeniedException("User is not authorized to update this contact.");
        }

        existingContact.setName(contactDtoToUpdate.getName());
        existingContact.setContactNo(contactDtoToUpdate.getContactNo());
        existingContact.setEmail(contactDtoToUpdate.getEmail());
        existingContact.setCompanyName(contactDtoToUpdate.getCompanyName());

        ContactBook updatedContact = contactRepository.save(existingContact);
        log.info("Successfully updated contact with ID: {}", updatedContact.getId());

        return mapEntityToDto(updatedContact);
    }

    @Override
    @Transactional
    public DeleteContactResponseDto deleteContact(Integer contactId, Integer requestingUserCompanyId) {
        log.info("Attempting to delete contact with ID: {} by user with CompanyID: {}", contactId, requestingUserCompanyId);

        if (contactId == null) {
            return new DeleteContactResponseDto("Contact ID cannot be null for a delete operation.", false);
        }

        Optional<ContactBook> contactOptional = contactRepository.findById(contactId);
        if (contactOptional.isEmpty()) {
            return new DeleteContactResponseDto("Contact not found with id: " + contactId, false);
        }
        ContactBook contactToDelete = contactOptional.get();

        if (contactToDelete.getCompanyId() == null || !contactToDelete.getCompanyId().equals(requestingUserCompanyId)) {
            log.warn("Authorization failed: User with CompanyID {} attempted to delete contact {} belonging to CompanyID {}.",
                    requestingUserCompanyId, contactToDelete.getId(), contactToDelete.getCompanyId());
            return new DeleteContactResponseDto("User is not authorized to delete this contact.", false);
        }

        try {
            boolean isInUseByProject = projectRepository.existsByContactPersonIdAndCompanyId(contactId, requestingUserCompanyId);
            if (isInUseByProject) {
                log.info("Delete failed: Contact {} is in use by a project for CompanyID {}.", contactId, requestingUserCompanyId);
                return new DeleteContactResponseDto("Not deleted, Record is used in Project.", false);
            }

            contactRepository.delete(contactToDelete);
            log.info("Successfully deleted contact with ID: {}", contactId);
            return new DeleteContactResponseDto("Record deleted", true);

        } catch (Exception e) {
            log.error("Error during contact deletion process for ID: {}: {}", contactId, e.getMessage(), e);
            return new DeleteContactResponseDto("An error occurred during deletion: " + e.getMessage(), false);
        }
    }

    @Override
    public ContactDto getContactByIdAndCompanyId(Integer contactId, Integer requestingUserCompanyId) {
        log.info("Attempting to retrieve contact with ID: {} for user with CompanyID: {}", contactId, requestingUserCompanyId);

        if (contactId == null) {
            throw new IllegalArgumentException("Contact ID cannot be null.");
        }

        ContactBook contactBook = contactRepository.findById(contactId)
                .orElseThrow(() -> new EntityNotFoundException("Contact not found with id: " + contactId));

        if (contactBook.getCompanyId() == null || !contactBook.getCompanyId().equals(requestingUserCompanyId)) {
            log.warn("Authorization failed: User with CompanyID {} attempted to access contact {} belonging to CompanyID {}.",
                    requestingUserCompanyId, contactBook.getId(), contactBook.getCompanyId());
            throw new AccessDeniedException("User is not authorized to access this contact.");
        }

        return mapEntityToDto(contactBook);
    }

    // --- Helper Mapping Methods --- //

    private ContactBook mapDtoToEntity(ContactDto dto) {
        return ContactBook.builder()
                .name(dto.getName())
                .contactNo(dto.getContactNo())
                .email(dto.getEmail())
                .companyName(dto.getCompanyName())
                .build();
    }

    private ContactDto mapEntityToDto(ContactBook entity) {
        return ContactDto.builder()
                .id(entity.getId())
                .name(entity.getName())
                .contactNo(entity.getContactNo())
                .email(entity.getEmail())
                .companyName(entity.getCompanyName())
                .companyId(entity.getCompanyId())
                .build();
    }
}
