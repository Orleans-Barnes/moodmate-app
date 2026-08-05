package com.moodmate.auth.service;

import com.moodmate.auth.config.JwtProperties;
import com.moodmate.auth.config.PasswordResetProperties;
import com.moodmate.auth.dto.AuthResponse;
import com.moodmate.auth.entity.RefreshToken;
import com.moodmate.auth.entity.Role;
import com.moodmate.auth.entity.User;
import com.moodmate.auth.exception.ApiException;
import com.moodmate.auth.repository.PasswordResetTokenRepository;
import com.moodmate.auth.repository.RefreshTokenRepository;
import com.moodmate.auth.repository.UserRepository;
import com.moodmate.auth.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/** Covers Feature 4's rotation / reuse-detection / expiration contract, documented on
 * AuthService.refresh() and AuthService.logout(). */
class AuthServiceRefreshTokenTest {

    private UserRepository userRepo;
    private RefreshTokenRepository refreshTokenRepo;
    private JwtService jwtService;
    private AuthService service;
    private User user;

    @BeforeEach
    void setUp() {
        userRepo = mock(UserRepository.class);
        refreshTokenRepo = mock(RefreshTokenRepository.class);
        jwtService = mock(JwtService.class);
        PasswordEncoder passwordEncoder = mock(PasswordEncoder.class);
        PasswordResetTokenRepository resetTokenRepo = mock(PasswordResetTokenRepository.class);
        MailService mailService = mock(MailService.class);
        PasswordResetProperties passwordResetProperties = new PasswordResetProperties(15, "noreply@moodmate.local");
        AvatarStorageService avatarStorageService = mock(AvatarStorageService.class);
        JwtProperties jwtProperties = new JwtProperties("dev-only-secret-change-me-before-deploy-32chars-min", 1440, 30);

        service = new AuthService(userRepo, passwordEncoder, jwtService, jwtProperties, resetTokenRepo,
                refreshTokenRepo, mailService, passwordResetProperties, avatarStorageService);

        user = User.builder().id(1L).email("student@example.com").fullName("Student").role(Role.STUDENT).build();
        when(userRepo.findById(1L)).thenReturn(Optional.of(user));
        when(jwtService.generateToken(any(User.class))).thenReturn("new-access-token");
        when(refreshTokenRepo.save(any(RefreshToken.class))).thenAnswer(inv -> inv.getArgument(0));
    }

    @Test
    void validUnexpiredTokenRotatesAndReturnsNewTokens() {
        RefreshToken existing = RefreshToken.builder()
                .id(10L).userId(1L).tokenHash(anyHash()).revoked(false)
                .expiresAt(Instant.now().plusSeconds(3600)).build();
        when(refreshTokenRepo.findByTokenHash(any())).thenReturn(Optional.of(existing));

        AuthResponse response = service.refresh("some-raw-refresh-token");

        assertEquals("new-access-token", response.token());
        assertNotNull(response.refreshToken());
        assertTrue(existing.isRevoked(), "the presented token must be revoked after a successful rotation");
        assertNotNull(existing.getReplacedByHash());
    }

    @Test
    void unknownTokenIsRejected() {
        when(refreshTokenRepo.findByTokenHash(any())).thenReturn(Optional.empty());

        ApiException ex = assertThrows(ApiException.class, () -> service.refresh("nonexistent-token"));
        assertEquals(HttpStatus.UNAUTHORIZED, ex.getStatus());
    }

    @Test
    void expiredTokenIsRejected() {
        RefreshToken expired = RefreshToken.builder()
                .id(11L).userId(1L).tokenHash(anyHash()).revoked(false)
                .expiresAt(Instant.now().minusSeconds(1)).build();
        when(refreshTokenRepo.findByTokenHash(any())).thenReturn(Optional.of(expired));

        ApiException ex = assertThrows(ApiException.class, () -> service.refresh("expired-token"));
        assertEquals(HttpStatus.UNAUTHORIZED, ex.getStatus());
    }

    @Test
    void reusingAnAlreadyRevokedTokenRevokesAllOtherActiveSessionsForThatUser() {
        RefreshToken revoked = RefreshToken.builder()
                .id(12L).userId(1L).tokenHash(anyHash()).revoked(true)
                .expiresAt(Instant.now().plusSeconds(3600)).build();
        RefreshToken otherActiveSession = RefreshToken.builder()
                .id(13L).userId(1L).tokenHash("other-hash").revoked(false)
                .expiresAt(Instant.now().plusSeconds(3600)).build();

        when(refreshTokenRepo.findByTokenHash(any())).thenReturn(Optional.of(revoked));
        when(refreshTokenRepo.findByUserIdAndRevokedFalse(1L)).thenReturn(List.of(otherActiveSession));
        when(refreshTokenRepo.saveAll(any())).thenAnswer(inv -> inv.getArgument(0));

        ApiException ex = assertThrows(ApiException.class, () -> service.refresh("stolen-or-replayed-token"));

        assertEquals(HttpStatus.UNAUTHORIZED, ex.getStatus());
        assertTrue(otherActiveSession.isRevoked(), "reuse of a revoked token must revoke every other active session");
    }

    @Test
    void logoutRevokesTheGivenTokenAndIsSilentOnUnknownToken() {
        RefreshToken active = RefreshToken.builder()
                .id(14L).userId(1L).tokenHash(anyHash()).revoked(false)
                .expiresAt(Instant.now().plusSeconds(3600)).build();
        when(refreshTokenRepo.findByTokenHash(any())).thenReturn(Optional.of(active));

        assertDoesNotThrow(() -> service.logout("some-token"));
        assertTrue(active.isRevoked());

        // Unknown token: must not throw (no information leak about session state)
        when(refreshTokenRepo.findByTokenHash(any())).thenReturn(Optional.empty());
        assertDoesNotThrow(() -> service.logout("unknown-token"));
    }

    private String anyHash() {
        return "0".repeat(64);
    }
}
