package com.moodmate.journal.dto;

import java.time.LocalDate;

/**
 * Internal-only (GET /internal/journal/latest-per-user, Phase 1E Step 4) - one row per distinct
 * user this service has ever seen an entry from, with the date (UTC) of their most recent one.
 * Feeds moodmate-notifications' JournalReminderRule. Same "only users we've seen before" scoping
 * as moodmate-mood's UserLastCheckInResponse - a user who has never written a journal entry at all
 * is out of scope for this endpoint (out of scope for this specific reminder, not for the app).
 */
public record UserLastJournalEntryResponse(Long userId, LocalDate lastEntryDate) {
}
