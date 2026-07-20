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
 * Nothing else transitions a subscription out of TRIALING/ACTIVE on its own - without this sweep,
 * a lapsed trial or an unrenewed paid period would stay "active" forever even after
 * trialEndsAt/currentPeriodEnd has passed. Runs once a day; @EnableScheduling is on
 * WalletApplication.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class SubscriptionExpiryJob {

    private final UserSubscriptionRepository userSubscriptionRepository;

    @Scheduled(cron = "0 15 0 * * *")
    @Transactional
    public void expireLapsedSubscriptions() {
        Instant now = Instant.now();

        List<UserSubscription> expiredTrials =
                userSubscriptionRepository.findByStatusAndTrialEndsAtBefore(SubscriptionStatus.TRIALING, now);
        expiredTrials.forEach(s -> s.setStatus(SubscriptionStatus.EXPIRED));

        List<UserSubscription> expiredPaid =
                userSubscriptionRepository.findByStatusAndCurrentPeriodEndBefore(SubscriptionStatus.ACTIVE, now);
        expiredPaid.forEach(s -> s.setStatus(SubscriptionStatus.EXPIRED));

        if (!expiredTrials.isEmpty() || !expiredPaid.isEmpty()) {
            userSubscriptionRepository.saveAll(expiredTrials);
            userSubscriptionRepository.saveAll(expiredPaid);
            log.info("Expired {} lapsed trial(s) and {} lapsed paid subscription(s)",
                    expiredTrials.size(), expiredPaid.size());
        }
    }
}
