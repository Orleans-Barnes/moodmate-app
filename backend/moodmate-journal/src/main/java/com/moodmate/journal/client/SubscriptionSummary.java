package com.moodmate.journal.client;

/** Local copy of the one field this service needs from moodmate-wallet's
 * SubscriptionStateResponse - same pattern as CrisisSeverity in this package, and identical in
 * spirit to moodmate-ai's own SubscriptionSummary. */
public record SubscriptionSummary(boolean pro) {
}
