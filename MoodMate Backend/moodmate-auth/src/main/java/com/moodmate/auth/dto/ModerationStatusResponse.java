package com.moodmate.auth.dto;

/** Returned by the internal ban/unban/warn endpoints so the calling service (moodmate-community's
 * ModerationService) can confirm the resulting state without a second round trip. */
public record ModerationStatusResponse(Long userId, boolean banned, String bannedReason, int warningCount) {
}
