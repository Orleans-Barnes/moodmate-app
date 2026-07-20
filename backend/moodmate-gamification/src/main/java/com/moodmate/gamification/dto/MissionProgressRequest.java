package com.moodmate.gamification.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record MissionProgressRequest(@NotNull Long missionId, @Positive int increment) {
}
