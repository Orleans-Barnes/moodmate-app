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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/** Covers Feature 11's AI Disclaimer (version-aware acknowledgement) and Usage Tracking (which
 * deliberately reuses Feature 3's existing cap/count query rather than a parallel mechanism - see
 * UsageResponse's doc comment). */
class AiSafetyServiceTest {

    private DisclaimerAcknowledgementRepository disclaimerRepository;
    private AiChatMessageRepository chatMessageRepository;
    private PaymentsServiceClient paymentsServiceClient;
    private AiSafetyService service;

    @BeforeEach
    void setUp() {
        disclaimerRepository = mock(DisclaimerAcknowledgementRepository.class);
        chatMessageRepository = mock(AiChatMessageRepository.class);
        paymentsServiceClient = mock(PaymentsServiceClient.class);
        AiSafetyProperties aiSafetyProperties = new AiSafetyProperties("disclaimer text", 2, 2000, 10);
        AiUsageProperties aiUsageProperties = new AiUsageProperties(10);

        service = new AiSafetyService(disclaimerRepository, chatMessageRepository, paymentsServiceClient,
                aiSafetyProperties, aiUsageProperties);
    }

    @Test
    void disclaimerIsUnacknowledgedWhenUserHasNeverSeenIt() {
        when(disclaimerRepository.findByUserId(1L)).thenReturn(Optional.empty());

        DisclaimerResponse response = service.getDisclaimer(1L);

        assertFalse(response.acknowledged());
        assertEquals(2, response.version());
    }

    @Test
    void disclaimerIsUnacknowledgedWhenTheAcknowledgedVersionIsStale() {
        DisclaimerAcknowledgement old = DisclaimerAcknowledgement.builder().id(1L).userId(1L)
                .acknowledgedVersion(1).acknowledgedAt(Instant.now()).build();
        when(disclaimerRepository.findByUserId(1L)).thenReturn(Optional.of(old));

        DisclaimerResponse response = service.getDisclaimer(1L);

        assertFalse(response.acknowledged(), "acknowledging an older version must not count for the current one");
    }

    @Test
    void disclaimerIsAcknowledgedWhenTheCurrentVersionWasAccepted() {
        DisclaimerAcknowledgement current = DisclaimerAcknowledgement.builder().id(1L).userId(1L)
                .acknowledgedVersion(2).acknowledgedAt(Instant.now()).build();
        when(disclaimerRepository.findByUserId(1L)).thenReturn(Optional.of(current));

        DisclaimerResponse response = service.getDisclaimer(1L);

        assertTrue(response.acknowledged());
    }

    @Test
    void acknowledgeDisclaimerCreatesARowForAFirstTimeUser() {
        when(disclaimerRepository.findByUserId(1L)).thenReturn(Optional.empty());
        when(disclaimerRepository.save(any(DisclaimerAcknowledgement.class))).thenAnswer(inv -> inv.getArgument(0));

        service.acknowledgeDisclaimer(1L);

        verify(disclaimerRepository).save(any(DisclaimerAcknowledgement.class));
    }

    @Test
    void proUserUsageIsUnlimited() {
        when(paymentsServiceClient.isPro(1L)).thenReturn(true);

        UsageResponse response = service.getUsage(1L);

        assertTrue(response.pro());
        assertTrue(response.unlimited());
        verify(chatMessageRepository, org.mockito.Mockito.never())
                .countByUserIdAndRoleAndCreatedAtGreaterThanEqual(anyLong(), any(), any());
    }

    @Test
    void freeUserUsageReflectsTodaysCountAgainstTheDailyLimit() {
        when(paymentsServiceClient.isPro(1L)).thenReturn(false);
        when(chatMessageRepository.countByUserIdAndRoleAndCreatedAtGreaterThanEqual(eq(1L), eq(ChatRole.USER), any()))
                .thenReturn(3L);

        UsageResponse response = service.getUsage(1L);

        assertFalse(response.unlimited());
        assertEquals(3, response.messagesToday());
        assertEquals(10, response.dailyLimit());
        assertEquals(7, response.remainingToday());
    }

    @Test
    void freeUserRemainingNeverGoesNegativeIfOverCap() {
        when(paymentsServiceClient.isPro(1L)).thenReturn(false);
        when(chatMessageRepository.countByUserIdAndRoleAndCreatedAtGreaterThanEqual(eq(1L), eq(ChatRole.USER), any()))
                .thenReturn(15L);

        UsageResponse response = service.getUsage(1L);

        assertEquals(0, response.remainingToday());
    }
}
