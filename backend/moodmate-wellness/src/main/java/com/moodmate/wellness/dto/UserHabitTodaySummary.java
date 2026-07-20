package com.moodmate.wellness.dto;

/**
 * Internal-only (GET /internal/wellness/habits/today-summary, Phase 1E Step 4) - one row per user
 * who has at least one habit defined, with how many they have total versus how many they've
 * completed today (UTC/server date - see HabitService.todaySummaryForAllUsers()'s doc comment).
 * Feeds moodmate-notifications' HabitReminderRule. A user with zero habits defined never appears
 * here at all - there is nothing to remind them about.
 */
public record UserHabitTodaySummary(Long userId, int totalHabitsToday, int completedHabitsToday) {
}
