package com.moodmate.mood.dto;

import java.time.LocalDate;

/**
 * Internal-only (GET /internal/mood/latest-per-user, Phase 1E Step 4) - one row per distinct user
 * this service has ever seen a check-in from, with the date (UTC) of their most recent one. Feeds
 * moodmate-notifications' MoodCheckInReminderRule, which decides per-user whether "no check-in
 * today, past the evening cutoff" is true. Deliberately scoped to users with at least one prior
 * check-in (see MoodServiceClient's doc comment in moodmate-notifications for why a brand-new user
 * who has never checked in at all is out of scope for this particular reminder).
 */
public record UserLastCheckInResponse(Long userId, LocalDate lastCheckInDate) {
}
