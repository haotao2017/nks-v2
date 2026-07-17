package no.nks.service;

import no.nks.dto.LoginRequestDto;
import no.nks.dto.LoginResponseDto;

public interface UserService {

    /**
     * 认证用户并返回登录响应（含 JWT）。
     * 失败时抛出 no.nks.exception.AuthenticationException。
     */
    LoginResponseDto authenticate(LoginRequestDto request);
}
