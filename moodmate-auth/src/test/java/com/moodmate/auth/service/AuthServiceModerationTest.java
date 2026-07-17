package com.moodmate.auth.service;

import com.moodmate.auth.config.JwtProperties;
import com.moodmate.auth.config.PasswordResetProperties;
import com.moodmate.auth.dto.AuthResponse;
import com.moodmate.auth.dto.LoginRequest;
import com.moodmate.auth.dto.ModerationStatusResponse;
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

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/** Covers Feature 7's account-level moderation contract: banUser/unbanUser/warnUser, and that
 * login()/refresh() reject a banned account. Same manual-mock construction pattern as
 * AuthServiceRefreshTokenTest. */
class AuthServiceModerationTest {

    private UserRepository userRepo;
    private RefreshTokenRepository refreshTokenRepo;
    private PasswordEncoder passwordEncoder;
    private AuthService service;
    private User user;

    @BeforeEach
    void setUp() {
        userRepo = mock(UserRepository.class);
        refreshTokenRepo = mock(RefreshTokenRepository.class);
        passwordEncoder = mock(PasswordEncoder.class);
        JwtService jwtService = mock(JwtService.class);
        PasswordResetTokenRepository resetTokenRepo = mock(PasswordResetTokenRepository.class);
        MailService mailService = mock(MailService.class);
        PasswordResetProperties passwordResetProperties = new PasswordResetProperties(15, "noreply@moodmate.local");
        AvatarStorageService avatarStorageService = mock(AvatarStorageService.class);
        JwtProperties jwtProperties = new JwtProperties("dev-only-secret-change-me-before-deploy-32chars-min", 1440, 30);

        service = new AuthService(userRepo, passwordEncoder, jwtService, jwtProperties, resetTokenRepo,
                refreshTokenRepo, mailService, passwordResetProperties, avatarStorageService);

        user = User.builder().id(1L).email("student@example.com").passwordHash("hashed")
                .fullName("Student").role(Role.STUDENT).build();
        when(userRepo.findById(1L)).thenReturn(Optional.of(user));
        when(userRepo.findByEmail("student@example.com")).thenReturn(Optional.of(user));
        when(userRepo.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));
        when(jwtService.generateToken(any(User.class))).thenReturn("token");
        when(refreshTokenRepo.save(any(RefreshToken.class))).thenAnswer(inv -> inv.getArgument(0));
    }

    @Test
    void banUserSetsBannedStateAndRevokesAllRefreshTokens() {
        RefreshToken active = RefreshToken.builder().id(5L).userId(1L).tokenHash("h").revoked(false)
                .expiresAt(Instant.now().plusSeconds(3600)).build();
        when(refreshTokenRepo.findByUserIdAndRevokedFalse(1L)).thenReturn(List.of(active));
        when(refreshTokenRepo.saveAll(any())).thenAnswer(inv -> inv.getArgument(0));

        ModerationStatusResponse response = service.banUser(1L, "spamming the community feed");

        assertTrue(response.banned());
        assertEquals("spamming the community feed", response.bannedReason());
        assertTrue(active.isRevoked(), "banning must revoke every outstanding refresh token");
    }

    @Test
    void unbanUserClearsBannedState() {
        user.setBanned(true);
        user.setBannedReason("prior violation");
        user.setBannedAt(Instant.now());

        ModerationStatusResponse response = service.unbanUser(1L);

        assertFalse(response.banned());
        assertNull(response.bannedReason());
    }

    @Test
    void warnUserIncrementsRunningCountAndDoesNotBan() {
        ModerationStatusResponse first = service.warnUser(1L, "off-topic post");
        assertEquals(1, first.warningCount());
        assertFalse(first.banned());

        ModerationStatusResponse second = service.warnUser(1L, "second warning");
        assertEquals(2, second.warningCount());
    }

    @Test
    void loginRejectsBannedAccountEvenWithCorrectPassword() {
        user.setBanned(true);
        user.setBannedReason("terms of service violation");
        when(passwordEncoder.matches("correct-password", "hashed")).thenReturn(true);

        ApiException ex = assertThrows(ApiException.class,
                () -> service.login(new LoginRequest("student@example.com", "correct-password")));
        assertEquals(HttpStatus.FORBIDDEN, ex.getStatus());
    }

    @Test
    void loginSucceedsForNonBannedAccountWithCorrectPassword() {
        when(passwordEncoder.matches("correct-password", "hashed")).thenReturn(true);

        AuthResponse response = service.login(new LoginRequest("student@example.com", "correct-password"));

        assertEquals("token", response.token());
    }

    @Test
    void refreshRejectsBannedAccountEvenWithAnUnrevokedUnexpiredToken() {
        user.setBanned(true);
        RefreshToken existing = RefreshToken.builder().id(10L).userId(1L).tokenHash("h").revoked(false)
                .expiresAt(Instant.now().plusSeconds(3600)).build();
        when(refreshTokenRepo.findByTokenHash(any())).thenReturn(Optional.of(existing));

        ApiException ex = assertThrows(ApiException.class, () -> service.refresh("some-token"));
        assertEquals(HttpStatus.FORBIDDEN, ex.getStatus());
    }
}
