package com.moodmate.backend.auth;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.time.Instant;
import java.util.Optional;

public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {
    Optional<PasswordResetToken> findByEmail(String email);
    Optional<PasswordResetToken> findByEmailAndOtp(String email, String otp);
    void deleteByEmail(String email);

    /** Sweeps all tokens whose expiry has passed — called nightly by CleanupJob. */
    @Modifying
    @Query("DELETE FROM PasswordResetToken t WHERE t.expiresAt < :now")
    int deleteExpiredTokens(Instant now);
}
