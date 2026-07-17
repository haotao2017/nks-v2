package no.nks.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import no.nks.dto.LoginRequestDto;
import no.nks.dto.LoginResponseDto;
import no.nks.entity.User;
import no.nks.exception.AuthenticationException;
import no.nks.repository.UserRepository;
import no.nks.service.JwtService;
import no.nks.service.UserService;
import no.nks.util.DesEncryptionUtil;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;
    private final PasswordMigrationService passwordMigrationService;

    @Override
    @Transactional
    public LoginResponseDto authenticate(LoginRequestDto request) {
        log.info("Authenticating user: {}", request.getUserName());

        Optional<User> userOptional = userRepository.findByUserName(request.getUserName());
        if (userOptional.isEmpty()) {
            log.warn("Authentication failed: User not found - {}", request.getUserName());
            throw new AuthenticationException("User not authenticated, Please check user name or password!");
        }

        User user = userOptional.get();
        String rawPassword = request.getPassword();
        String storedPassword = user.getPassword();

        // ---- 密码校验 + 平滑迁移判定 ----
        boolean passwordMatches;
        boolean needsMigration = false;

        if (storedPassword != null && storedPassword.startsWith("$2")) {
            // DB 中已是 bcrypt 密文
            passwordMatches = passwordEncoder.matches(rawPassword, storedPassword);
        } else {
            // 旧 DES 密文：加密明文后与库中密文比对
            String desEncrypted = DesEncryptionUtil.encrypt(rawPassword);
            passwordMatches = desEncrypted != null && desEncrypted.equals(storedPassword);
            needsMigration = passwordMatches; // 校验通过则迁移为 bcrypt
        }

        if (!passwordMatches) {
            log.warn("Authentication failed: Password mismatch for user - {}", request.getUserName());
            throw new AuthenticationException("User not authenticated, Please check user name or password!");
        }

        // ---- isMobileApp × UserTypeID 交叉校验 (1=Web, 2=Mobile) ----
        Integer userTypeId = user.getUserTypeID();
        Boolean isMobileApp = request.getIsMobileApp();

        if (Boolean.FALSE.equals(isMobileApp) && userTypeId != null && userTypeId == 2) {
            log.warn("Authentication failed: User (ID:{}) is UserType 2, not allowed for non-mobile app login.", user.getId());
            throw new AuthenticationException("User not authenticated, Please check user name or password!");
        }
        if (Boolean.TRUE.equals(isMobileApp) && userTypeId != null && userTypeId == 1) {
            log.warn("Authentication failed: User (ID:{}) is UserType 1, not allowed for mobile app login.", user.getId());
            throw new AuthenticationException("User not authenticated, Please check user name or password!");
        }

        // ---- 生成 JWT，回写 token 有效期 ----
        String token = jwtService.generateToken(user.getId());
        LocalDateTime now = LocalDateTime.now();
        user.setToken(token);
        user.setTokenValidFrom(now);
        user.setTokenValidTo(now.plusDays(7));
        userRepository.save(user);

        // ---- 密码平滑迁移（独立事务，best-effort，绝不阻断登录）----
        if (needsMigration) {
            try {
                passwordMigrationService.migrateToBcrypt(user.getId(), rawPassword);
            } catch (Exception e) {
                log.warn("Password migration to bcrypt skipped for user {} (login not affected): {}",
                        user.getUsername(), e.getMessage());
            }
        }

        log.info("User {} authenticated successfully.", user.getUsername());

        return new LoginResponseDto(
                user.getId(),
                user.getFullName(),
                user.getUsername(),
                token,
                user.getIsAdmin(),
                isMobileApp,
                user.getCompanyID()
        );
    }
}
