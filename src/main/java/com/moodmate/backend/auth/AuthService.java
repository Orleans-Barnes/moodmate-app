package com.moodmate.backend.auth;

import com.moodmate.backend.admin.CounsellorWhitelistRepository;
import com.moodmate.backend.auth.dto.AdminSetupRequest;
import com.moodmate.backend.auth.dto.AuthResponse;
import com.moodmate.backend.auth.dto.LoginRequest;
import com.moodmate.backend.auth.dto.SignupRequest;
import com.moodmate.backend.auth.dto.UserProfileResponse;
import com.moodmate.backend.common.api.UserLookupApi;
import com.moodmate.backend.common.dto.UserSummary;
import com.moodmate.backend.common.events.UserRegisteredEvent;
import com.moodmate.backend.common.exception.BadRequestException;
import com.moodmate.backend.common.exception.ConflictException;
import com.moodmate.backend.common.exception.ForbiddenException;
import com.moodmate.backend.common.exception.ResourceNotFoundException;
import com.moodmate.backend.security.JwtService;
import com.moodmate.backend.support.Counsellor;
import com.moodmate.backend.support.CounsellorRepository;
import com.moodmate.backend.support.CounsellorStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AuthService implements UserLookupApi {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final ApplicationEventPublisher eventPublisher;
    private final CounsellorWhitelistRepository whitelistRepository;
    private final CounsellorRepository counsellorRepository;

    @Transactional
    public AuthResponse signup(SignupRequest request) {
        String email = request.email().trim().toLowerCase();
        if (userRepository.existsByEmail(email)) {
            throw new ConflictException("An account with this email already exists");
        }

        User user = User.builder()
                .email(email)
                .passwordHash(passwordEncoder.encode(request.password()))
                .fullName(request.fullName().trim())
                .institution(request.institution())
                .guest(false)
                .role(Role.STUDENT) // public signup can never request a different role
                .build();

        user = userRepository.save(user);
        eventPublisher.publishEvent(new UserRegisteredEvent(user.getId()));

        return new AuthResponse(jwtService.generateToken(user.getId(), user.getEmail(), user.getRole()), toProfile(user));
    }

    /** Frontend's "continue as guest" flow - creates a throwaway, password-less account. */
    @Transactional
    public AuthResponse loginAsGuest() {
        String guestEmail = "guest-" + UUID.randomUUID() + "@moodmate.local";
        User user = User.builder()
                .email(guestEmail)
                .passwordHash(null)
                .fullName("Guest")
                .guest(true)
                .role(Role.STUDENT)
                .build();

        user = userRepository.save(user);
        eventPublisher.publishEvent(new UserRegisteredEvent(user.getId()));

        return new AuthResponse(jwtService.generateToken(user.getId(), user.getEmail(), user.getRole()), toProfile(user));
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        String email = request.email().trim().toLowerCase();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BadCredentialsException("Invalid email or password"));

        if (user.isGuest() || user.getPasswordHash() == null) {
            throw new BadRequestException("This account can't sign in with a password");
        }

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new BadCredentialsException("Invalid email or password");
        }

        // Counsellor whitelist gate:
        //  • ADMIN role always bypasses this gate (admins are not counsellors).
        //  • If email is whitelisted and user is still STUDENT → auto-promote to COUNSELLOR
        //    and create a counsellor profile row if one doesn't already exist.
        //  • If user holds COUNSELLOR role but email is NOT whitelisted → block login.
        //    Error is deliberately generic to avoid leaking role/account information.
        boolean isWhitelisted = whitelistRepository.existsByEmail(email);
        if (isWhitelisted && user.getRole() == Role.STUDENT) {
            user.setRole(Role.COUNSELLOR);
            userRepository.save(user);
            // Ensure a counsellor profile row exists so CounsellorRepository lookups never return empty
            if (!counsellorRepository.findByUserId(user.getId()).isPresent()) {
                counsellorRepository.save(Counsellor.builder()
                        .userId(user.getId())
                        .name(user.getFullName())
                        .avatarEmoji("🧑‍⚕️")
                        .available(true)
                        .sortOrder(0)
                        .status(CounsellorStatus.APPROVED)
                        .build());
            }
        } else if (!isWhitelisted && user.getRole() == Role.COUNSELLOR) {
            throw new ForbiddenException("Access denied. Please contact the administrator.");
        }

        return new AuthResponse(jwtService.generateToken(user.getId(), user.getEmail(), user.getRole()), toProfile(user));
    }

    /**
     * One-shot admin bootstrap. Creates the first ADMIN account.
     * Permanently returns 409 Conflict once any ADMIN account exists,
     * so this endpoint is self-sealing - it cannot be used to create
     * a second admin or to bypass normal access controls.
     */
    @Transactional
    public AuthResponse adminSetup(AdminSetupRequest request) {
        if (userRepository.existsByRole(Role.ADMIN)) {
            throw new ConflictException("An admin account already exists. Log in with your existing admin credentials.");
        }
        String email = request.email().trim().toLowerCase();
        if (userRepository.existsByEmail(email)) {
            throw new ConflictException("An account with this email already exists");
        }
        User user = User.builder()
                .email(email)
                .passwordHash(passwordEncoder.encode(request.password()))
                .fullName(request.fullName().trim())
                .guest(false)
                .role(Role.ADMIN)
                .build();
        user = userRepository.save(user);
        return new AuthResponse(jwtService.generateToken(user.getId(), user.getEmail(), user.getRole()), toProfile(user));
    }

    /** Minimal cross-domain read for other domains (e.g. support's counsellor-request flow) that
     * only need a user's identity, not their full profile. */
    @Override
    @Transactional(readOnly = true)
    public UserSummary getUserSummary(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));
        return new UserSummary(user.getId(), user.getFullName(), user.getAvatarEmoji());
    }

    /** Batch version of getUserSummary - lets callers resolve a list of users in one query
     * instead of one round-trip per id (e.g. naming every student in a counsellor's appointment list). */
    @Override
    @Transactional(readOnly = true)
    public Map<Long, UserSummary> getUserSummaries(List<Long> userIds) {
        if (userIds.isEmpty()) {
            return Map.of();
        }
        return userRepository.findAllById(userIds).stream()
                .collect(Collectors.toMap(User::getId, u -> new UserSummary(u.getId(), u.getFullName(), u.getAvatarEmoji())));
    }

    /** Returns the user's email address - used by payments when initialising a Paystack checkout. */
    @Override
    @Transactional(readOnly = true)
    public String getUserEmail(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId))
                .getEmail();
    }

    private UserProfileResponse toProfile(User user) {
        return new UserProfileResponse(user.getId(), user.getEmail(), user.getFullName(),
                user.getInstitution(), user.getAvatarEmoji(), user.getAvatarUrl(),
                user.isGuest(), user.getRole());
    }
}
