package com.moodmate.ai.service;

import com.moodmate.ai.client.PaymentsServiceClient;
import com.moodmate.ai.config.AiSafetyProperties;
import com.moodmate.ai.config.AiUsageProperties;
import com.moodmate.ai.dto.DisclaimerResponse;
import com.moodmate.ai.dto.UsageResponse;
import com.moodmate.ai.entity.ChatRole;
import com.moodmate.ai.entity.DisclaimerAcknowledgement;
import com.moodmate.ai.repository.AiChatMessageRepository;
import com.moodmate.ai.repository.DisclaimerAcknowledgementRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

/** New for Feature 11 (AI Safety Improvements) - backs AI Disclaimer and Usage Tracking. Kept as
 * its own class rather than folded into AiChatService: this is read/consent-state, not message-
 * sending logic, and AiChatService already has a full, focused responsibility of its own (see its
 * own doc comment). The Abuse Protection guards (message length, duplicate-spam) stay in
 * AiChatService.sendMessage() itself, since they gate that method directly rather than being a
 * separate concern a client would query independently. */
@Slf4j
@Service
@RequiredArgsConstructor
public class AiSafetyService {

    private final DisclaimerAcknowledgementRepository disclaimerRepository;
    private final AiChatMessageRepository chatMessageRepository;
    private final PaymentsServiceClient paymentsServiceClient;
    private final AiSafetyProperties aiSafetyProperties;
    private final AiUsageProperties aiUsageProperties;

    @Transactional(readOnly = true)
    public DisclaimerResponse getDisclaimer(Long userId) {
        return disclaimerRepository.findByUserId(userId)
                .filter(a -> a.getAcknowledgedVersion() >= aiSafetyProperties.disclaimerVersion())
                .map(a -> new DisclaimerResponse(aiSafetyProperties.disclaimerText(),
                        aiSafetyProperties.disclaimerVersion(), true, a.getAcknowledgedAt()))
                .orElseGet(() -> new DisclaimerResponse(aiSafetyProperties.disclaimerText(),
                        aiSafetyProperties.disclaimerVersion(), false, null));
    }

    /** Upserts by userId (unique) - re-acknowledging (e.g. after a version bump) updates the
     * existing row rather than creating a new one, matching the entity's own doc comment. Safety
     * Logging: acknowledgement is logged at INFO, same as every other safety-relevant event in
     * this service (see AiChatService for the WARN-level abuse/crisis/cap events). */
    @Transactional
    public void acknowledgeDisclaimer(Long userId) {
        DisclaimerAcknowledgement ack = disclaimerRepository.findByUserId(userId)
                .orElseGet(() -> DisclaimerAcknowledgement.builder().userId(userId).build());
        ack.setAcknowledgedVersion(aiSafetyProperties.disclaimerVersion());
        ack.setAcknowledgedAt(Instant.now());
        disclaimerRepository.save(ack);
        log.info("User {} acknowledged AI disclaimer version {}", userId, aiSafetyProperties.disclaimerVersion());
    }

    @Transactional(readOnly = true)
    public UsageResponse getUsage(Long userId) {
        boolean pro = paymentsServiceClient.isPro(userId);
        boolean unlimited = pro || aiUsageProperties.freeDailyMessageLimit() <= 0;
        if (unlimited) {
            return new UsageResponse(pro, true, 0, 0, 0);
        }

        Instant since = Instant.now().truncatedTo(ChronoUnit.DAYS);
        long usedToday = chatMessageRepository.countByUserIdAndRoleAndCreatedAtGreaterThanEqual(userId, ChatRole.USER, since);
        int limit = aiUsageProperties.freeDailyMessageLimit();
        int remaining = (int) Math.max(0, limit - usedToday);
        return new UsageResponse(false, false, (int) usedToday, limit, remaining);
    }
}
