package com.moodmate.backend.journal.dto;

import jakarta.validation.constraints.NotBlank;

public record JournalEntryRequest(String title, @NotBlank String body, String moodEmoji) {
}
