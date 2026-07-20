package com.moodmate.ai.client;

/** Local copy of the one field this service actually needs from moodmate-wallet's
 * SubscriptionStateResponse - same "local DTO copy instead of a shared library" pattern used
 * throughout this project (see CrisisSeverity in this same client package). Jackson ignores the
 * extra fields (planCode, status, trialEndsAt, currentPeriodEnd) on the real response by default. */
public record SubscriptionSummary(boolean pro) {
}
