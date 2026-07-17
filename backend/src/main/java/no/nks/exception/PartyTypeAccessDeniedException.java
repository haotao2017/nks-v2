package no.nks.exception;

import org.springframework.security.access.AccessDeniedException;

public class PartyTypeAccessDeniedException extends AccessDeniedException {

    public PartyTypeAccessDeniedException(Integer partyTypeId) {
        super(String.format("You don't have permission to access party type with ID: %d", partyTypeId));
    }

    public PartyTypeAccessDeniedException(String message) {
        super(message);
    }
}
