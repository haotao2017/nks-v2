package no.nks.exception;

/**
 * 业务逻辑异常
 * 用于表示业务规则验证失败等情况
 */
public class BusinessException extends RuntimeException {

    public BusinessException(String message) {
        super(message);
    }

    public BusinessException(String message, Throwable cause) {
        super(message, cause);
    }
}
