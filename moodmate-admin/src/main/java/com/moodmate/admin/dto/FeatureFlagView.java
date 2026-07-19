package com.moodmate.admin.dto;

import java.time.Instant;

public record FeatureFlagView(Long id, String flagKey, boolean enabled, String description, Instant updatedAt) {
}
