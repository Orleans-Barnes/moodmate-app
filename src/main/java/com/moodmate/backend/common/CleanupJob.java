package com.moodmate.backend.common;

import com.moodmate.backend.ai.AiChatMessageRepository;
import com.moodmate.backend.ai.AiDailyUsageRepository;
import com.moodmate.backend.auth.PasswordResetTokenRepository;
import com.moodmate.backend.auth.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

/**
 * Nightly housekeeping:
 *  - Sweeps expired password-reset OTP tokens
 *  - Deletes guest accounts older than 30 days
 *  - Prunes AI daily-usage rows older than 30 days
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class CleanupJob {

    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final UserRepository               userRepository;
    private final AiDailyUsageRepository       aiDailyUsageRepository;
    private final AiChatMessageRepository      aiChatMessageRepository;

    /** Runs at 00:30 UTC every night. */
    @Scheduled(cron = "0 30 0 * * *")
    @Transactional
    public void runNightlyCleanup() {
        Instant   now         = Instant.now();
        LocalDate today       = LocalDate.now();

        // 1. Delete expired OTP tokens
        int expiredOtps = passwordResetTokenRepository.deleteExpiredTokens(now);
        if (expiredOtps > 0) {
            log.info("Deleted {} expired password-reset token(s)", expiredOtps);
        }

        // 2. Delete guest accounts older than 30 days
        Instant guestCutoff = now.minus(30, ChronoUnit.DAYS);
        int deletedGuests = userRepository.deleteStaleGuestAccounts(guestCutoff);
        if (deletedGuests > 0) {
            log.info("Deleted {} stale guest account(s) older than 30 days", deletedGuests);
        }

        // 3. Prune AI usage rows older than 30 days (only same-day rows matter for rate-limiting)
        LocalDate usageCutoff = today.minusDays(30);
        int deletedUsageRows = aiDailyUsageRepository.deleteOlderThan(usageCutoff);
        if (deletedUsageRows > 0) {
            log.info("Deleted {} old AI daily-usage row(s)", deletedUsageRows);
        }

        // 4. Prune AI chat messages older than 90 days
        Instant chatCutoff = now.minus(90, ChronoUnit.DAYS);
        int deletedChatRows = aiChatMessageRepository.deleteOlderThan(chatCutoff);
        if (deletedChatRows > 0) {
            log.info("Deleted {} old AI chat message(s) older than 90 days", deletedChatRows);
        }
    }
}
