package com.moodmate.auth.service;

import com.moodmate.auth.config.JwtProperties;
import com.moodmate.auth.config.PasswordResetProperties;
import com.moodmate.auth.dto.UserDto;
import com.moodmate.auth.entity.Role;
import com.moodmate.auth.entity.User;
import com.moodmate.auth.repository.PasswordResetTokenRepository;
import com.moodmate.auth.repository.RefreshTokenRepository;
import com.moodmate.auth.repository.UserRepository;
import com.moodmate.auth.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/** Covers Feature 13 (Avatar Management)'s explicit deleteAvatar() - distinct from
 * uploadAvatar()'s implicit replace-and-cleanup (already exercised indirectly wherever
 * uploadAvatar is used; this file is specifically the new delete path). Same manual-mock
 * construction pattern as AuthServiceModerationTest/AuthServiceRefreshTokenTest. */
class AuthServiceAvatarTest {

    private UserRepository userRepo;
    private AvatarStorageService avatarStorageService;
    private AuthService service;
    private User user;

    @BeforeEach
    void setUp() {
        userRepo = mock(UserRepository.class);
        PasswordEncoder passwordEncoder = mock(PasswordEncoder.class);
        JwtService jwtService = mock(JwtService.class);
        JwtProperties jwtProperties = new JwtProperties("dev-only-secret-change-me-before-deploy-32chars-min", 1440, 30);
        PasswordResetTokenRepository resetTokenRepo = mock(PasswordResetTokenRepository.class);
        RefreshTokenRepository refreshTokenRepo = mock(RefreshTokenRepository.class);
        MailService mailService = mock(MailService.class);
        PasswordResetProperties passwordResetProperties = new PasswordResetProperties(15, "noreply@moodmate.local");
        avatarStorageService = mock(AvatarStorageService.class);

        service = new AuthService(userRepo, passwordEncoder, jwtService, jwtProperties, resetTokenRepo,
                refreshTokenRepo, mailService, passwordResetProperties, avatarStorageService);

        user = User.builder().id(1L).email("student@example.com").passwordHash("hashed")
                .fullName("Student").role(Role.STUDENT).avatarUrl("http://10.97.195.149:8080/media/avatars/1_abc.jpg")
                .build();
        when(userRepo.findById(1L)).thenReturn(Optional.of(user));
        when(userRepo.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));
    }

    @Test
    void deleteAvatarClearsUrlAndBestEffortDeletesTheFile() {
        String previousUrl = user.getAvatarUrl();

        UserDto dto = service.deleteAvatar(1L);

        assertNull(dto.avatarUrl(), "avatarUrl must be cleared so the frontend falls back to avatarEmoji");
        assertNull(user.getAvatarUrl());
        verify(avatarStorageService).deleteQuietly(eq(previousUrl));
    }

    @Test
    void deleteAvatarIsANoOpNotAnErrorWhenUserHasNoUploadedAvatar() {
        user.setAvatarUrl(null);

        UserDto dto = service.deleteAvatar(1L);

        assertNull(dto.avatarUrl());
        verify(avatarStorageService).deleteQuietly(eq(null));
        verify(userRepo).save(any(User.class));
        verify(avatarStorageService, never()).store(any(), any());
    }
}
