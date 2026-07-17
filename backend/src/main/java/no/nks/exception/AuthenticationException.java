package no.nks.exception;

/**
 * 认证失败异常（由 GlobalExceptionHandler 映射为 401）。
 */
public class AuthenticationException extends RuntimeException {
    public AuthenticationException(String message) {
        super(message);
    }
}
