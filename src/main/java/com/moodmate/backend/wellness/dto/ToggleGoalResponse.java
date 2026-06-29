package com.moodmate.backend.wellness.dto;

public record ToggleGoalResponse(WellnessStateResponse state, boolean streakIncrementedThisToggle) {
}
