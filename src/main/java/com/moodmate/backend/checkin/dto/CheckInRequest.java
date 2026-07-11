package com.moodmate.backend.checkin.dto;

import com.moodmate.backend.checkin.Emotion;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record CheckInRequest(
        @NotNull Emotion emotionKey,
        @Min(1) @Max(5) int stressLevel,
        @Min(1) @Max(5) int energyLevel,
        String note
) {
}
