package com.moodmate.backend.journal.dto;

import java.time.Instant;

public record JournalEntryResponse(Long id, String title, String body, String moodEmoji, Instant createdAt,
                                    Instant updatedAt) {
}
