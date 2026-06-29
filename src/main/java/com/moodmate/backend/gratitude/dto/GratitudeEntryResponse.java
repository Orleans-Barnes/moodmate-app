package com.moodmate.backend.gratitude.dto;

import java.time.Instant;

public record GratitudeEntryResponse(Long id, String content, Instant createdAt) {
}
