package com.moodmate.journal.dto;

import jakarta.validation.constraints.NotBlank;

public record GratitudeEntryRequest(@NotBlank String content) {
}
