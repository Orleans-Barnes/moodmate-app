package com.moodmate.auth.service;

import com.moodmate.auth.config.JwtProperties;
import com.moodmate.auth.config.PasswordResetProperties;
import com.moodmate.auth.dto.*;
import com.moodmate.auth.entity.PasswordResetToken;
import com.moodmate.auth.entity.RefreshToken;
import com.moodmate.auth.entity.Role;
import com.moodmate.auth.entity.User;
import com.moodmate.auth.exception.ApiException;
import com.moodmate.auth.repository.PasswordResetTokenRepository;
import com.moodmate.auth.repository.RefreshTokenRepository;
import com.moodmate.auth.repository.UserRepository;
import com.moodmate.auth.security.JwtService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.mail.MailException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Base64;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private static final SecureRandom OTP_RANDOM = new SecureRandom();
    private static final SecureRandom REFRESH_TOKEN_RANDOM = new SecureRandom();

    private final UserRepository userRepo;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final JwtProperties jwtProperties;
    private final PasswordResetTokenRepository resetTokenRepo;
    private final RefreshTokenRepository refreshTokenRepo;
    private final MailService mailService;
    private final PasswordResetProperties passwordResetProperties;
    private final AvatarStorageService avatarStorageService;

    @Transactional
    public AuthResponse signup(SignupRequest req) {
        if (userRepo.existsByEmail(req.email())) {
            // Deliberately the same generic message login() uses for bad credentials - a distinct
            // "this email is already taken" message lets an attacker enumerate registered emails
            // by trying signup with guesses.
            throw new ApiException("Unable to create account with the provided details", HttpStatus.CONFLICT);
        }
        User user = User.builder()
                .email(req.email().toLowerCase().trim())
                .passwordHash(passwordEncoder.encode(req.password()))
                .fullName(req.fullName())
                .institution(req.institution())
                .role(Role.STUDENT) // public signup can never request a different role
                .build();
        userRepo.save(user);
        return buildResponse(user);
    }

    @Transactional
    public AuthResponse login(LoginRequest req) {
        User user = userRepo.findByEmail(req.email().toLowerCase().trim())
                .orElseThrow(() -> new ApiException("Invalid email or password", HttpStatus.UNAUTHORIZED));
        if (user.isGuest() || user.getPasswordHash() == null
                || !passwordEncoder.matches(req.password(), user.getPasswordHash())) {
            // Same message for "no such user", "guest account has no password", and "wrong
            // password" - none of these should be distinguishable from the outside.
            throw new ApiException("Invalid email or password", HttpStatus.UNAUTHORIZED);
        }
        // Feature 7 (Community Moderation) - a banned user's credentials are correct, so this is
        // deliberately a distinct, explicit message (unlike the generic one above) - there's
        // nothing to hide here the way there is with credential enumeration.
        if (user.isBanned()) {
            throw new ApiException("This account has been suspended" +
                    (user.getBannedReason() != null ? ": " + user.getBannedReason() : ""), HttpStatus.FORBIDDEN);
        }
        return buildResponse(user);
    }

    /**
     * Always returns void with no indication of whether the email exists - this is deliberate
     * (standard password-reset practice) so the endpoint can't be used to enumerate registered
     * emails. If the address doesn't match a real, non-guest account, this silently does nothing.
     * If it does, a 6-digit OTP is generated, hashed with the same PasswordEncoder used for real
     * passwords, stored with an expiry, and emailed via Gmail SMTP. Mail failures are logged but
     * not surfaced to the caller, for the same enumeration-prevention reason.
     */
    @Transactional
    public void forgotPassword(String rawEmail) {
        String email = rawEmail.toLowerCase().trim();
        userRepo.findByEmail(email).ifPresent(user -> {
            if (user.isGuest()) {
                // Guest accounts have no password to reset - silently no-op, same as "not found".
                return;
            }
            String otp = generateOtp();
            PasswordResetToken token = PasswordResetToken.builder()
                    .userId(user.getId())
                    .otpHash(passwordEncoder.encode(otp))
                    .expiresAt(Instant.now().plus(passwordResetProperties.otpExpiryMinutes(), ChronoUnit.MINUTES))
                    .build();
            resetTokenRepo.save(token);
            try {
                mailService.sendPasswordResetOtp(user.getEmail(), otp);
            } catch (MailException e) {
                // Logged, not rethrown: an attacker probing for valid emails must see identical
                // behavior (200, no body) whether the address exists or not, and whether the mail
                // server is reachable or not. The token row still exists, so a legitimate user who
                // retries once mail is fixed can still use a freshly-requested OTP.
                log.error("Failed to send password reset email to {}", user.getEmail(), e);
            }
        });
    }

    /**
     * Validates the OTP against the newest unused, unexpired token for that email, then updates
     * the password and marks every outstanding token for that user as used (not just the one
     * consumed) so a leaked older code can't be replayed after a successful reset.
     */
    @Transactional
    public void resetPassword(String rawEmail, String otp, String newPassword) {
        String email = rawEmail.toLowerCase().trim();
        User user = userRepo.findByEmail(email)
                // Generic message deliberately matches the "bad code" case below - existence of
                // the account should not be distinguishable from an incorrect OTP.
                .orElseThrow(() -> new ApiException("Invalid or expired code", HttpStatus.BAD_REQUEST));

        List<PasswordResetToken> candidates = resetTokenRepo
                .findAllByUserIdAndUsedFalseOrderByCreatedAtDesc(user.getId());

        Instant now = Instant.now();
        boolean matched = candidates.stream()
                .filter(t -> t.getExpiresAt().isAfter(now))
                .anyMatch(t -> passwordEncoder.matches(otp, t.getOtpHash()));
        if (!matched) {
            throw new ApiException("Invalid or expired code", HttpStatus.BAD_REQUEST);
        }

        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepo.save(user);

        // Marks every outstanding token used, not just the one that matched, so a leaked older
        // code can't be replayed after a successful reset.
        candidates.forEach(t -> t.setUsed(true));
        resetTokenRepo.saveAll(candidates);
    }

    /**
     * Backs POST /api/auth/admin-setup - the frontend's self-service "first time here? set up
     * admin account" flow, reachable by anyone with no authentication. The only guard is
     * server-side: this rejects with 409 the moment any ADMIN account already exists, so the
     * endpoint is only ever usable once, by whoever gets there first. Matches the frontend's own
     * copy ("This is a one-time setup...").
     */
    @Transactional
    public AuthResponse adminSetup(AdminSetupRequest req) {
        if (userRepo.existsByRole(Role.ADMIN)) {
            throw new ApiException("An admin account already exists", HttpStatus.CONFLICT);
        }
        if (userRepo.existsByEmail(req.email().toLowerCase().trim())) {
            throw new ApiException("Unable to create account with the provided details", HttpStatus.CONFLICT);
        }
        User admin = User.builder()
                .email(req.email().toLowerCase().trim())
                .passwordHash(passwordEncoder.encode(req.password()))
                .fullName(req.fullName())
                .role(Role.ADMIN)
                .build();
        userRepo.save(admin);
        return buildResponse(admin);
    }

    private String generateOtp() {
        return String.format("%06d", OTP_RANDOM.nextInt(1_000_000));
    }

    /**
     * Exchanges a valid, unrevoked, unexpired refresh token for a new access token AND a new
     * refresh token (rotation - the presented token is immediately revoked and can never be used
     * again, whether or not this call succeeds past that point).
     *
     * Reuse detection: if the presented token is found but already revoked, that means either (a)
     * this exact refresh already happened once and the client is replaying a stale token (e.g. a
     * race from two tabs), or (b) the token was stolen and both the legitimate client and an
     * attacker are trying to use it. There's no way to tell which from here, so the safe response
     * is the same either way: revoke every other outstanding refresh token for that user, forcing
     * a fresh login everywhere. This is the standard "refresh token rotation with reuse detection"
     * pattern.
     */
    @Transactional
    public AuthResponse refresh(String rawRefreshToken) {
        String hash = hashToken(rawRefreshToken);
        RefreshToken token = refreshTokenRepo.findByTokenHash(hash)
                .orElseThrow(() -> new ApiException("Invalid refresh token", HttpStatus.UNAUTHORIZED));

        if (token.isRevoked()) {
            revokeAllForUser(token.getUserId());
            throw new ApiException("This session has been revoked - please log in again", HttpStatus.UNAUTHORIZED);
        }
        if (token.getExpiresAt().isBefore(Instant.now())) {
            throw new ApiException("Refresh token expired - please log in again", HttpStatus.UNAUTHORIZED);
        }

        User user = findUser(token.getUserId());
        // Feature 7 (Community Moderation): a user banned after their last login can no longer
        // renew their session here, even though their still-valid short-lived access token keeps
        // working until it naturally expires (moodmate.jwt.expiration-minutes) - documented
        // limitation, same trade-off as every other "can't revoke an already-issued JWT" case in
        // this project. banUser() below also proactively revokes all refresh tokens, so this check
        // is really only reachable if somehow a refresh token was issued after the ban (it isn't -
        // this is defense in depth, not the primary enforcement path).
        if (user.isBanned()) {
            throw new ApiException("This account has been suspended", HttpStatus.FORBIDDEN);
        }

        String newRawToken = issueRefreshToken(user);
        token.setRevoked(true);
        token.setReplacedByHash(hashToken(newRawToken));
        refreshTokenRepo.save(token);

        return new AuthResponse(jwtService.generateToken(user), toDto(user), newRawToken);
    }

    /** Backs POST /api/auth/logout. Idempotent and silent on an unknown/already-revoked token -
     * same "don't leak information via error responses" posture as forgotPassword() above,
     * applied to session state instead of account existence. */
    @Transactional
    public void logout(String rawRefreshToken) {
        String hash = hashToken(rawRefreshToken);
        refreshTokenRepo.findByTokenHash(hash).ifPresent(token -> {
            token.setRevoked(true);
            refreshTokenRepo.save(token);
        });
    }

    private void revokeAllForUser(Long userId) {
        List<RefreshToken> active = refreshTokenRepo.findByUserIdAndRevokedFalse(userId);
        active.forEach(t -> t.setRevoked(true));
        refreshTokenRepo.saveAll(active);
    }

    private String issueRefreshToken(User user) {
        byte[] randomBytes = new byte[32];
        REFRESH_TOKEN_RANDOM.nextBytes(randomBytes);
        String rawToken = Base64.getUrlEncoder().withoutPadding().encodeToString(randomBytes);

        refreshTokenRepo.save(RefreshToken.builder()
                .userId(user.getId())
                .tokenHash(hashToken(rawToken))
                .expiresAt(Instant.now().plus(jwtProperties.refreshExpirationDays(), ChronoUnit.DAYS))
                .build());

        return rawToken;
    }

    /** SHA-256, not BCrypt - unlike a password or OTP, a refresh token is a full 256 bits of
     * server-generated randomness (never user-chosen, never guessable), so a fast, deterministic
     * hash used purely for exact-match lookup by index is the right tool here, not a slow
     * intentionally-expensive KDF. */
    private String hashToken(String raw) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(raw.getBytes(StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder(hash.length * 2);
            for (byte b : hash) {
                hex.append(String.format("%02x", b));
            }
            return hex.toString();
        } catch (NoSuchAlgorithmException e) {
            // SHA-256 is guaranteed available on every JVM - this branch is unreachable in practice.
            throw new IllegalStateException("SHA-256 unavailable", e);
        }
    }

    @Transactional
    public AuthResponse loginAsGuest() {
        String guestEmail = "guest_" + UUID.randomUUID() + "@moodmate.local";
        User guest = User.builder()
                .email(guestEmail)
                .fullName("Guest")
                .guest(true)
                .role(Role.STUDENT)
                .build();
        userRepo.save(guest);
        return buildResponse(guest);
    }

    @Transactional(readOnly = true)
    public UserDto getProfile(Long userId) {
        return toDto(findUser(userId));
    }

    @Transactional
    public UserDto updateProfile(Long userId, UpdateProfileRequest req) {
        User user = findUser(userId);
        if (req.fullName() != null && !req.fullName().isBlank()) user.setFullName(req.fullName());
        if (req.institution() != null) user.setInstitution(req.institution());
        if (req.avatarEmoji() != null && !req.avatarEmoji().isBlank()) user.setAvatarEmoji(req.avatarEmoji());
        return toDto(userRepo.save(user));
    }

    /**
     * Backs POST /api/users/me/avatar. Stores the file to local disk via AvatarStorageService,
     * best-effort deletes whatever the user's previous uploaded avatar file was (if any - a
     * default avatarEmoji has no file to clean up), then persists the new URL.
     */
    @Transactional
    public UserDto uploadAvatar(Long userId, MultipartFile file) {
        User user = findUser(userId);
        String previousUrl = user.getAvatarUrl();
        String newUrl = avatarStorageService.store(userId, file);
        user.setAvatarUrl(newUrl);
        UserDto dto = toDto(userRepo.save(user));
        avatarStorageService.deleteQuietly(previousUrl);
        return dto;
    }

    /**
     * Feature 13 (Avatar Management) - backs DELETE /api/users/me/avatar. Explicit removal,
     * distinct from uploadAvatar()'s implicit replace-and-cleanup: clears avatarUrl back to null
     * (the frontend falls back to rendering avatarEmoji, per User.avatarUrl's doc comment) and
     * best-effort deletes the now-orphaned file on disk. A no-op (not an error) if the user never
     * had an uploaded avatar in the first place - deleteQuietly() already treats a null/blank URL
     * as nothing to do.
     */
    @Transactional
    public UserDto deleteAvatar(Long userId) {
        User user = findUser(userId);
        String previousUrl = user.getAvatarUrl();
        user.setAvatarUrl(null);
        UserDto dto = toDto(userRepo.save(user));
        avatarStorageService.deleteQuietly(previousUrl);
        return dto;
    }

    /**
     * Cross-service identity read. Other services (support, community, wellness, ...) call this
     * over HTTP (via the gateway or a direct service-to-service call) instead of reading the
     * `users` table directly, so `users` stays owned exclusively by this service. Mirrors the
     * monolith's AuthService.getUserSummary/getUserSummaries, which existed for the exact same
     * reason even in-process.
     */
    @Transactional(readOnly = true)
    public UserSummary getUserSummary(Long userId) {
        return toSummary(findUser(userId));
    }

    @Transactional(readOnly = true)
    public Map<Long, UserSummary> getUserSummaries(List<Long> userIds) {
        if (userIds.isEmpty()) {
            return Map.of();
        }
        return userRepo.findAllById(userIds).stream()
                .collect(Collectors.toMap(User::getId, this::toSummary));
    }

    /**
     * Cross-service role promotion. Replaces the monolith's in-process CounsellorApprovedEvent ->
     * CounsellorRoleGrantor listener (fired when an admin approved a self-serve counsellor
     * request) - that in-process event can't cross a service boundary, so support-service now
     * calls this over HTTP via InternalUserController instead. Same internal-only path pattern as
     * getUserSummary/getUserSummaries: never reachable through the gateway, only service-to-service.
     */
    @Transactional
    public UserSummary updateRole(Long userId, Role role) {
        User user = findUser(userId);
        user.setRole(role);
        return toSummary(userRepo.save(user));
    }

    // ── Feature 7 (Community Moderation) - additive, not in the monolith. Called by
    // moodmate-community's ModerationService via InternalUserController, same internal-only path
    // pattern as updateRole/getUserSummary above - never reachable through the gateway. ──────────

    /** Also revokes every outstanding refresh token for this user (see revokeAllForUser) so they
     * can't silently renew their session past the ban - see refresh()'s doc comment for the one
     * remaining gap (an already-issued, still-live access token) this doesn't close. */
    @Transactional
    public ModerationStatusResponse banUser(Long userId, String reason) {
        User user = findUser(userId);
        user.setBanned(true);
        user.setBannedReason(reason);
        user.setBannedAt(Instant.now());
        user = userRepo.save(user);
        revokeAllForUser(userId);
        return toModerationStatus(user);
    }

    @Transactional
    public ModerationStatusResponse unbanUser(Long userId) {
        User user = findUser(userId);
        user.setBanned(false);
        user.setBannedReason(null);
        user.setBannedAt(null);
        return toModerationStatus(userRepo.save(user));
    }

    /** Increments the running warning_count only - no ban, no session revocation, no
     * notification delivery (that's a separate concern - see Notification Deep Linking). */
    @Transactional
    public ModerationStatusResponse warnUser(Long userId, String reason) {
        User user = findUser(userId);
        user.setWarningCount(user.getWarningCount() + 1);
        log.info("User {} warned (warning #{}): {}", userId, user.getWarningCount(), reason);
        return toModerationStatus(userRepo.save(user));
    }

    private ModerationStatusResponse toModerationStatus(User u) {
        return new ModerationStatusResponse(u.getId(), u.isBanned(), u.getBannedReason(), u.getWarningCount());
    }

    private User findUser(Long id) {
        return userRepo.findById(id)
                .orElseThrow(() -> new ApiException("User not found", HttpStatus.NOT_FOUND));
    }

    private AuthResponse buildResponse(User user) {
        return new AuthResponse(jwtService.generateToken(user), toDto(user), issueRefreshToken(user));
    }

    private UserDto toDto(User u) {
        return new UserDto(u.getId(), u.getEmail(), u.getFullName(), u.getInstitution(),
                u.getAvatarEmoji(), u.getAvatarUrl(), u.isGuest(), u.getRole(), u.getCreatedAt());
    }

    private UserSummary toSummary(User u) {
        return new UserSummary(u.getId(), u.getFullName(), u.getAvatarEmoji(), u.getEmail());
    }
}
