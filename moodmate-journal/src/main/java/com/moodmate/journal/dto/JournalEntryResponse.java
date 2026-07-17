package com.moodmate.journal.dto;

import java.time.Instant;
import java.util.Set;

public record JournalEntryResponse(Long id, String title, String body, String moodEmoji, boolean favorite,
                                    Set<String> tags, Instant createdAt, Instant updatedAt) {
}
