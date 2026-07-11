package com.moodmate.backend.journal.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record JournalEntryRequest(
        @Size(max = 200, message = "Title must be 200 characters or fewer") String title,
        @NotBlank @Size(max = 10000, message = "Journal entry must be 10,000 characters or fewer") String body,
        @Size(max = 10) String moodEmoji
) {
}
