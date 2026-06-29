package com.moodmate.backend.payments;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface UserSubscriptionRepository extends JpaRepository<UserSubscription, Long> {

    Optional<UserSubscription> findByUserId(Long userId);

    List<UserSubscription> findByStatusAndTrialEndsAtBefore(SubscriptionStatus status, Instant cutoff);

    List<UserSubscription> findByStatusAndCurrentPeriodEndBefore(SubscriptionStatus status, Instant cutoff);
}
