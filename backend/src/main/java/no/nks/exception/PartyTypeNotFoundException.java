package no.nks.exception;

import jakarta.persistence.EntityNotFoundException;

public class PartyTypeNotFoundException extends EntityNotFoundException {

    public PartyTypeNotFoundException(Integer id) {
        super(String.format("Party type not found with ID: %d", id));
    }

    public PartyTypeNotFoundException(String message) {
        super(message);
    }
}
