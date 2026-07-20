package com.moodmate.support.client;

/** Local copy of the one field this service needs from moodmate-wallet's
 * SubscriptionStateResponse - same pattern as moodmate-journal's/moodmate-ai's identical
 * SubscriptionSummary. */
public record SubscriptionSummary(boolean pro) {
}
