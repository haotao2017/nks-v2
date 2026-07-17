package no.nks.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import no.nks.dto.ContactDto;
import no.nks.dto.CreateContactRequest;
import no.nks.dto.CreateContactResponse;
import no.nks.dto.DeleteContactResponseDto;
import no.nks.dto.UpdateContactRequest;
import no.nks.entity.User;
import no.nks.service.ContactService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/Contact")
@RequiredArgsConstructor
@Slf4j
public class ContactController {

    private final ContactService contactService;

    @PostMapping("/CreatContact")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<CreateContactResponse> createContact(@Valid @RequestBody CreateContactRequest request,
                                                               @AuthenticationPrincipal User user) {
        log.info("Received request to create contact: Name = {}", request.getContact().getName());
        Integer companyId = (user != null) ? user.getCompanyID() : null;

        ContactDto createdContactDto = contactService.createContact(request.getContact(), companyId);
        CreateContactResponse response = new CreateContactResponse(createdContactDto);

        log.info("Successfully created contact with ID: {}", createdContactDto.getId());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/GetAllContact")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, List<ContactDto>>> getAllContacts(@AuthenticationPrincipal User user) {
        log.info("Received request to get all contacts.");
        Integer companyId = (user != null) ? user.getCompanyID() : null;

        if (companyId == null) {
            log.warn("CompanyID is null, returning empty list of contacts.");
            Map<String, List<ContactDto>> emptyResponse = new HashMap<>();
            emptyResponse.put("multiContact", List.of());
            return ResponseEntity.ok(emptyResponse);
        }

        List<ContactDto> contactDtos = contactService.getAllContactsByCompanyId(companyId);

        Map<String, List<ContactDto>> response = new HashMap<>();
        response.put("multiContact", contactDtos);

        log.info("Successfully retrieved {} contacts for CompanyID: {}", contactDtos.size(), companyId);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/UpdateContact")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ContactDto> updateContact(@Valid @RequestBody UpdateContactRequest request,
                                                    @AuthenticationPrincipal User user) {
        log.debug("Received request to update contact with ID: {}", request.getContact().getId());
        Integer requestingUserCompanyId = (user != null) ? user.getCompanyID() : null;

        if (requestingUserCompanyId == null) {
            log.error("Update CANCELED: Could not determine CompanyID for the authenticated user.");
            throw new AccessDeniedException("Authenticated user's CompanyID could not be determined. Update not allowed.");
        }

        ContactDto updatedContactDto = contactService.updateContact(request.getContact(), requestingUserCompanyId);
        log.info("Successfully updated contact with ID: {}", updatedContactDto.getId());
        return ResponseEntity.ok(updatedContactDto);
    }

    @DeleteMapping("/DeleteContact")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<DeleteContactResponseDto> deleteContact(@RequestParam Integer contactId,
                                                                  @AuthenticationPrincipal User user) {
        log.info("Received request to delete contact with ID: {}", contactId);

        if (user == null || user.getCompanyID() == null) {
            log.warn("User details or CompanyID not available for delete request.");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new DeleteContactResponseDto("User authentication error or CompanyID missing.", false));
        }

        if (contactId == null) {
            return ResponseEntity.badRequest().body(new DeleteContactResponseDto("contactId parameter is required.", false));
        }

        DeleteContactResponseDto response = contactService.deleteContact(contactId, user.getCompanyID());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/GetContact")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getContactById(@RequestParam Integer contactId, @AuthenticationPrincipal User user) {
        log.info("Received request to get contact with ID: {}", contactId);

        if (user == null || user.getCompanyID() == null) {
            throw new AccessDeniedException("User authentication error or CompanyID missing.");
        }

        if (contactId == null) {
            throw new IllegalArgumentException("contactId parameter is required.");
        }

        ContactDto contactDto = contactService.getContactByIdAndCompanyId(contactId, user.getCompanyID());

        Map<String, ContactDto> response = new HashMap<>();
        response.put("contact", contactDto);

        log.info("Successfully retrieved contact with ID: {}", contactId);
        return ResponseEntity.ok(response);
    }
}
