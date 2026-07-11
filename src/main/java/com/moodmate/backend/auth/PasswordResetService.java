package com.moodmate.backend.auth;

import com.moodmate.backend.auth.dto.ForgotPasswordRequest;
import com.moodmate.backend.auth.dto.ResetPasswordRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;

@Slf4j
@Service
@RequiredArgsConstructor
public class PasswordResetService {

    private static final int OTP_EXPIRY_MINUTES = 15;
    private static final SecureRandom RANDOM = new SecureRandom();

    private final PasswordResetTokenRepository tokenRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    /**
     * JavaMailSender is optional — Spring Boot only creates the bean when spring.mail.host is set.
     * If it's absent (local dev without SMTP config), the OTP is printed to the console instead.
     */
    @Autowired(required = false)
    private JavaMailSender mailSender;

    /**
     * Generates a 6-digit OTP, persists it, and either emails it or logs it.
     * Always returns 200 regardless of whether the email exists — prevents user enumeration.
     */
    @Transactional
    public void requestReset(ForgotPasswordRequest request) {
        String email = request.email().toLowerCase().trim();

        // Silent no-op if the account doesn't exist (no enumeration)
        if (!userRepository.existsByEmail(email)) {
            return;
        }

        // Invalidate any previous token for this email
        tokenRepository.deleteByEmail(email);

        String otp = String.format("%06d", RANDOM.nextInt(1_000_000));
        tokenRepository.save(PasswordResetToken.builder()
                .email(email)
                .otp(otp)
                .expiresAt(Instant.now().plus(OTP_EXPIRY_MINUTES, ChronoUnit.MINUTES))
                .build());

        sendOtp(email, otp);
    }

    /**
     * Validates the OTP and updates the password. Deletes the token on success.
     * Rejects with 429 if the token has exceeded MAX_ATTEMPTS wrong guesses.
     * Increments the attempt counter on each wrong OTP so brute-force is blocked.
     */
    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        String email = request.email().toLowerCase().trim();

        // Look up by email only first so we can check the attempt counter
        PasswordResetToken token = tokenRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "No password reset was requested for this email"));

        // Block locked tokens before checking the OTP (prevents timing attacks revealing lockout state)
        if (token.isLocked()) {
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS,
                    "Too many incorrect attempts — request a new reset code");
        }

        if (token.getExpiresAt().isBefore(Instant.now())) {
            tokenRepository.delete(token);
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Code has expired — request a new one");
        }

        // Wrong OTP: increment counter and save, then reject
        if (!token.getOtp().equals(request.otp())) {
            token.incrementAttempts();
            tokenRepository.save(token);
            int remaining = 5 - token.getAttempts();
            String msg = remaining > 0
                    ? "Invalid code — " + remaining + " attempt(s) remaining"
                    : "Too many incorrect attempts — request a new reset code";
            HttpStatus status = remaining > 0 ? HttpStatus.BAD_REQUEST : HttpStatus.TOO_MANY_REQUESTS;
            throw new ResponseStatusException(status, msg);
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Account not found"));

        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);
        tokenRepository.delete(token);
    }

    // ── Internal ─────────────────────────────────────────────────────────────

    private void sendOtp(String email, String otp) {
        if (mailSender == null) {
            // Dev mode — no SMTP configured. Print OTP so you can still test the flow.
            log.warn("Mail not configured (set MAIL_HOST env var to enable email). " +
                     "Password reset OTP for {}: {}", email, otp);
            return;
        }
        try {
            SimpleMailMessage msg = new SimpleMailMessage();
            msg.setTo(email);
            msg.setSubject("Your MoodMate password reset code");
            msg.setText(
                "Hi there,\n\n" +
                "Your MoodMate password reset code is:\n\n" +
                "  " + otp + "\n\n" +
                "This code expires in " + OTP_EXPIRY_MINUTES + " minutes.\n" +
                "You have 5 attempts before the code is invalidated.\n\n" +
                "If you didn't request this, you can safely ignore this email.\n\n" +
                "-- The MoodMate Team"
            );
            mailSender.send(msg);
        } catch (MailException e) {
            log.error("Failed to send password reset email to {}: {}", email, e.getMessage());
            // Don't surface the error to the client — just log it
        }
    }
}
