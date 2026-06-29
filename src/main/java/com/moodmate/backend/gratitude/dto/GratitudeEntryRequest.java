package com.moodmate.backend.gratitude.dto;

import jakarta.validation.constraints.NotBlank;

public record GratitudeEntryRequest(@NotBlank String content) {
}
