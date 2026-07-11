package com.moodmate.backend.checkin.dto;

import com.moodmate.backend.checkin.Emotion;

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
