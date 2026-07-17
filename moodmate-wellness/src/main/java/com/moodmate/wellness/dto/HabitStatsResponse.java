package com.moodmate.wellness.dto;

public record HabitStatsResponse(
        Long habitId,
        int currentStreak,
        int longestStreak,
        long totalCompletions,
        double completionRateLast30Days
) {
}
