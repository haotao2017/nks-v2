package no.nks.dto.third.tripletex.auth;

import lombok.Data;

@Data
public class SessionToken {
    private String token;
    /**
     * Tripletex 返回的 token 过期日期（yyyy-MM-dd）。
     * 用于本地缓存推导 TTL；旧代码未使用该字段，现补齐以支持带 TTL 的 session 缓存。
     */
    private String expirationDate;
}
