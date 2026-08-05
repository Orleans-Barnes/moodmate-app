package com.moodmate.wallet.service;

import com.moodmate.wallet.entity.SubscriptionStatus;
import com.moodmate.wallet.entity.UserSubscription;
import com.moodmate.wallet.repository.UserSubscriptionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

/**
 * Nothing else transitions a subscription out of TRIALING/ACTIVE/PAST_DUE on its own - without
 * this sweep, a lapsed trial or an unrenewed paid period would stay "active" forever even after
 * trialEndsAt/currentPeriodEnd has passed. Runs once a day; @EnableScheduling is on
 * WalletApplication.
 *
 * Premium & Monetization (Milestone 3) - grace period. A lapsed ACTIVE subscription no longer
 * jumps straight to EXPIRED: it first becomes PAST_DUE (an enum value that already existed but had
 * no producer) with graceEndsAt set GRACE_PERIOD_DAYS out. PAST_DUE still counts as "pro" (see
 * PaymentsService.toStateResponse / WalletService.isPro), so a customer whose card failed
 * transiently keeps access while they fix payment, rather than a hard cliff. Trials are NOT given a
 * grace period - a trial was never a paying customer, so there's no payment-failure scenario to
 * protect against.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class SubscriptionExpiryJob {

    private static final int GRACE_PERIOD_DAYS = 3;

    private final UserSubscriptionRepository userSubscriptionRepository;

    @Scheduled(cron = "0 15 0 * * *")
    @Transactional
    public void expireLapsedSubscriptions() {
        Instant now = Instant.now();

        List<UserSubscription> expiredTrials =
                userSubscriptionRepository.findByStatusAndTrialEndsAtBefore(SubscriptionStatus.TRIALING, now);
        expiredTrials.forEach(s -> s.setStatus(SubscriptionStatus.EXPIRED));

        List<UserSubscription> enteringGrace =
                userSubscriptionRepository.findByStatusAndCurrentPeriodEndBefore(SubscriptionStatus.ACTIVE, now);
        enteringGrace.forEach(s -> {
            s.setStatus(SubscriptionStatus.PAST_DUE);
            s.setGraceEndsAt(now.plusSeconds(GRACE_PERIOD_DAYS * 24L * 3600L));
        });

        List<UserSubscription> expiredGrace =
                userSubscriptionRepository.findByStatusAndGraceEndsAtBefore(SubscriptionStatus.PAST_DUE, now);
        expiredGrace.forEach(s -> s.setStatus(SubscriptionStatus.EXPIRED));

        if (!expiredTrials.isEmpty() || !enteringGrace.isEmpty() || !expiredGrace.isEmpty()) {
            userSubscriptionRepository.saveAll(expiredTrials);
            userSubscriptionRepository.saveAll(enteringGrace);
            userSubscriptionRepository.saveAll(expiredGrace);
            log.info("Expired {} lapsed trial(s), moved {} subscription(s) into grace period, expired {} subscription(s) past grace",
                    expiredTrials.size(), enteringGrace.size(), expiredGrace.size());
        }
    }
}
