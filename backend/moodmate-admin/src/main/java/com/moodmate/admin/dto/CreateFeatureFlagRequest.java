package com.moodmate.admin.dto;

import jakarta.validation.constraints.NotBlank;

public record CreateFeatureFlagRequest(@NotBlank String flagKey, boolean enabled, String description) {
}
