package com.moodmate.wallet.dto;

import com.moodmate.wallet.entity.SubscriptionStatus;

import java.time.Instant;

public record SubscriptionStateResponse(String planCode, SubscriptionStatus status, Instant trialEndsAt,
                                          Instant currentPeriodEnd, boolean pro, Instant graceEndsAt) {

    /** No subscription row yet - a brand-new user who has never started a trial or paid. */
    public static SubscriptionStateResponse none() {
        return new SubscriptionStateResponse(null, null, null, null, false, null);
    }
}
