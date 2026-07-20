package com.moodmate.gamification.dto;

import jakarta.validation.constraints.NotBlank;

public record AchievementUnlockRequest(@NotBlank String achievementKey) {
}
