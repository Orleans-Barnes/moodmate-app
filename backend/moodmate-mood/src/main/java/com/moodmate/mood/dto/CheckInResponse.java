package com.moodmate.mood.dto;

import com.moodmate.mood.entity.Emotion;

import java.time.Instant;

public record CheckInResponse(
        Long id,
        Emotion emotionKey,
        int stressLevel,
        int energyLevel,
        String note,
        Instant createdAt
) {
}
