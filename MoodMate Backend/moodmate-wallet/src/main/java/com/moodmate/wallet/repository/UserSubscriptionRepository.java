package com.moodmate.wallet.repository;

import com.moodmate.wallet.entity.SubscriptionStatus;
import com.moodmate.wallet.entity.UserSubscription;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface UserSubscriptionRepository extends JpaRepository<UserSubscription, Long> {
    Optional<UserSubscription> findByUserId(Long userId);

    List<UserSubscription> findByStatusAndTrialEndsAtBefore(SubscriptionStatus status, Instant cutoff);

    List<UserSubscription> findByStatusAndCurrentPeriodEndBefore(SubscriptionStatus status, Instant cutoff);

    // Premium & Monetization (Milestone 3) - grace period sweep, mirrors the two queries above.
    List<UserSubscription> findByStatusAndGraceEndsAtBefore(SubscriptionStatus status, Instant cutoff);

    // Item 8 (Admin Revenue Dashboard) - active/trialing counts shown alongside revenue totals.
    long countByStatus(SubscriptionStatus status);
}
