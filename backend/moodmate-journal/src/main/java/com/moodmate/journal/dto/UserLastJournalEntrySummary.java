package com.moodmate.journal.dto;

import java.time.Instant;

/**
 * Repository-layer projection only (Instant, not LocalDate) - JournalEntryRepository's grouped
 * MAX(createdAt) query returns this via a JPQL constructor expression. JournalService converts it
 * to the public-facing UserLastJournalEntryResponse (LocalDate, UTC) before it leaves this service -
 * same split as moodmate-mood's UserLastCheckInSummary/UserLastCheckInResponse (Phase 1E Step 4).
 */
public record UserLastJournalEntrySummary(Long userId, Instant lastEntryAt) {
}
