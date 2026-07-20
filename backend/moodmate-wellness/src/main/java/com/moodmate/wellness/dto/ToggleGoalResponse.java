package com.moodmate.wellness.dto;

public record ToggleGoalResponse(WellnessStateResponse state, boolean streakIncrementedThisToggle) {
}
