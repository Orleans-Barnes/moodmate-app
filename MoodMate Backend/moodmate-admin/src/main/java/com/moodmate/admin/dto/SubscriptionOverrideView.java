package com.moodmate.admin.dto;

import java.time.Instant;

/** Premium & Monetization (Milestone 3) - local mirror of moodmate-wallet's
 * SubscriptionStateResponse, same convention as RevenueSummaryView. */
public record SubscriptionOverrideView(
        String planCode,
        String status,
        Instant trialEndsAt,
        Instant currentPeriodEnd,
        boolean pro,
        Instant graceEndsAt
) {
}
