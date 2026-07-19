package com.moodmate.mood.dto;

import java.time.Instant;

/**
 * Repository-layer projection only (Instant, not LocalDate) - MoodCheckinRepository's grouped
 * MAX(createdAt) query returns this via a JPQL constructor expression. MoodService converts it to
 * the public-facing UserLastCheckInResponse (LocalDate, UTC) before it ever leaves this service -
 * see MoodService.latestCheckInPerUser()'s doc comment for why that conversion happens here rather
 * than being pushed onto the caller (moodmate-notifications' scheduled job, Phase 1E Step 4).
 */
public record UserLastCheckInSummary(Long userId, Instant lastCheckInAt) {
}
