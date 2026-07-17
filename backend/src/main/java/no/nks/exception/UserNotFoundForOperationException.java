package no.nks.exception;

public class UserNotFoundForOperationException extends RuntimeException {
    public UserNotFoundForOperationException(String message) {
        super(message);
    }
}
