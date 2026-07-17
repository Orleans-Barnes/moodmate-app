package com.moodmate.wellness.service;

import com.moodmate.wellness.client.LeafTransactionReason;
import com.moodmate.wellness.client.WalletServiceClient;
import com.moodmate.wellness.client.WalletSummary;
import com.moodmate.wellness.config.TreeProperties;
import com.moodmate.wellness.dto.WellnessStateResponse;
import com.moodmate.wellness.entity.WellnessProfile;
import com.moodmate.wellness.exception.ApiException;
import com.moodmate.wellness.repository.DailyGoalTemplateRepository;
import com.moodmate.wellness.repository.GoalCompletionRepository;
import com.moodmate.wellness.repository.WellnessProfileRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/** Covers Feature 14 (Shop Improvements)'s buyDoubleXpBoost() - the fail-closed debit-before-grant
 * ordering (same pattern as buyStreakShield, already covered indirectly through this service's
 * design but not under its own test file before this feature), and that it extends/refreshes
 * rather than rejecting when a boost is already active (unlike the streak shield's no-stack
 * 409). Manual-mock construction, matching WellnessService's @RequiredArgsConstructor field
 * order. */
class WellnessServiceBoostTest {

    private WellnessProfileRepository wellnessProfileRepository;
    private WalletServiceClient walletServiceClient;
    private TreeProperties treeProperties;
    private WellnessService service;
    private WellnessProfile profile;

    @BeforeEach
    void setUp() {
        wellnessProfileRepository = mock(WellnessProfileRepository.class);
        DailyGoalTemplateRepository goalTemplateRepository = mock(DailyGoalTemplateRepository.class);
        GoalCompletionRepository goalCompletionRepository = mock(GoalCompletionRepository.class);
        treeProperties = new TreeProperties(700, 10, 50, 40, 24);
        walletServiceClient = mock(WalletServiceClient.class);

        service = new WellnessService(wellnessProfileRepository, goalTemplateRepository,
                goalCompletionRepository, treeProperties, walletServiceClient);

        profile = WellnessProfile.builder().userId(1L).build();
        when(wellnessProfileRepository.findById(1L)).thenReturn(Optional.of(profile));
        when(wellnessProfileRepository.save(any(WellnessProfile.class))).thenAnswer(inv -> inv.getArgument(0));
        when(goalTemplateRepository.findByActiveTrueOrderBySortOrder()).thenReturn(List.of());
        when(goalCompletionRepository.findByUserIdAndCompletionDate(eq(1L), any())).thenReturn(List.of());
        when(walletServiceClient.getSummary(1L)).thenReturn(new WalletSummary(0, null));
    }

    @Test
    void buyDoubleXpBoostSetsActiveUntilRoughlyDurationFromNowWhenDebitSucceeds() {
        when(walletServiceClient.debitLeaves(1L, 40, LeafTransactionReason.DOUBLE_XP_BOOST_PURCHASE)).thenReturn(true);

        Instant before = Instant.now();
        WellnessStateResponse response = service.buyDoubleXpBoost(1L);
        Instant after = Instant.now();

        assertTrue(response.doubleXpActiveUntil().isAfter(before.plusSeconds(23 * 3600)));
        assertTrue(response.doubleXpActiveUntil().isBefore(after.plusSeconds(24 * 3600 + 60)));
    }

    @Test
    void buyDoubleXpBoostRejectedWithPaymentRequiredWhenDebitFails() {
        when(walletServiceClient.debitLeaves(1L, 40, LeafTransactionReason.DOUBLE_XP_BOOST_PURCHASE)).thenReturn(false);

        ApiException ex = assertThrows(ApiException.class, () -> service.buyDoubleXpBoost(1L));

        assertEquals(HttpStatus.PAYMENT_REQUIRED, ex.getStatus());
        verify(wellnessProfileRepository, never()).save(any());
    }

    @Test
    void buyingAgainWhileAlreadyActiveExtendsRatherThanRejects() {
        profile.setDoubleXpActiveUntil(Instant.now().plusSeconds(3600)); // already active
        when(walletServiceClient.debitLeaves(1L, 40, LeafTransactionReason.DOUBLE_XP_BOOST_PURCHASE)).thenReturn(true);

        WellnessStateResponse response = service.buyDoubleXpBoost(1L);

        // Refreshed to a fresh ~24h window, not merely +3600s from the old expiry, and not rejected.
        assertTrue(response.doubleXpActiveUntil().isAfter(Instant.now().plusSeconds(23 * 3600)));
    }
}
