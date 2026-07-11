package com.moodmate.backend.gratitude.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record GratitudeEntryRequest(
        @NotBlank @Size(max = 1000, message = "Gratitude entry must be 1000 characters or fewer") String content
) {
}
