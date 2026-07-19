package no.nks.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import no.nks.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

/**
 * 旧 DES 密码 -> BCrypt 的平滑迁移。
 * <p>
 * 单独一个 bean + REQUIRES_NEW 独立事务：迁移写库在独立事务中进行，
 * 其失败/回滚 (例如旧库 Password 列宽 50 不足以容纳 60 字符的 bcrypt 密文)
 * 与登录主事务完全隔离。调用方负责 try/catch 吞掉异常，从而绝不影响登录响应。
 * <p>
 * 注意：异常不能在本方法内部 catch —— 否则 REQUIRES_NEW 事务已被标记 rollback-only，
 * 提交时仍会抛 UnexpectedRollbackException。必须由调用方在事务边界外捕获。
 * <p>
 * V5 迁移会将 Password 列扩宽至 NVARCHAR(255)；此后迁移可实际落库。
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PasswordMigrationService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void migrateToBcrypt(Integer userId, String rawPassword) {
        userRepository.findById(userId).ifPresent(u -> {
            u.setPassword(passwordEncoder.encode(rawPassword));
            userRepository.saveAndFlush(u);
            log.info("Password for user id={} migrated to bcrypt.", userId);
        });
    }
}
