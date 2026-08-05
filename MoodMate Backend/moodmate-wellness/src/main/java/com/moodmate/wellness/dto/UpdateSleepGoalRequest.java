package com.moodmate.wellness.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

public record UpdateSleepGoalRequest(@Min(60) @Max(900) int targetMinutes) {
}
