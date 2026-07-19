package no.nks.service.impl;

import no.nks.entity.User;
import no.nks.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PasswordMigrationServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private PasswordMigrationService service;

    @Test
    void encodesAndPersistsBcryptHash() {
        User user = new User();
        user.setId(42);
        user.setPassword("legacy-des");
        when(userRepository.findById(42)).thenReturn(Optional.of(user));
        when(passwordEncoder.encode("secret"))
                .thenReturn("$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy");

        service.migrateToBcrypt(42, "secret");

        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).saveAndFlush(captor.capture());
        String hash = captor.getValue().getPassword();
        assertTrue(hash.startsWith("$2a$"));
        assertTrue(hash.length() >= 60, "bcrypt must fit widened Password column");
        assertEquals(
                "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy",
                hash);
    }

    @Test
    void noOpWhenUserMissing() {
        when(userRepository.findById(7)).thenReturn(Optional.empty());

        service.migrateToBcrypt(7, "secret");

        verify(passwordEncoder, never()).encode(any());
        verify(userRepository, never()).saveAndFlush(any());
    }
}
