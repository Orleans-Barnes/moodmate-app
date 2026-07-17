package com.moodmate.community.client;

/** Local copy of the one shape this service needs from moodmate-auth's ModerationStatusResponse -
 * same "local DTO copy" pattern as moodmate-journal/moodmate-ai's SubscriptionSummary. */
public record ModerationStatusSummary(Long userId, boolean banned, String bannedReason, int warningCount) {
}
