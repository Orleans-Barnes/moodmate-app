package com.moodmate.notifications.client.dto;

import java.time.LocalDate;

/** Mirrors moodmate-journal's dto.UserLastJournalEntryResponse exactly
 * (GET /internal/journal/latest-per-user). */
public record UserLastJournalEntry(Long userId, LocalDate lastEntryDate) {
}
