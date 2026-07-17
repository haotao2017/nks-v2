package no.nks.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import no.nks.dto.LoginRequestDto;
import no.nks.dto.LoginResponseDto;
import no.nks.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class AuthController {

    private final UserService userService;

    @PostMapping("/Authenticate")
    public ResponseEntity<LoginResponseDto> authenticateUser(@Valid @RequestBody LoginRequestDto loginRequest) {
        log.info("Received authentication request for user: {}", loginRequest.getUserName());
        LoginResponseDto loginResponse = userService.authenticate(loginRequest);
        log.info("Authentication successful for user: {}", loginRequest.getUserName());
        return ResponseEntity.ok(loginResponse);
    }
}
