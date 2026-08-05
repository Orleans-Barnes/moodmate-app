package com.moodmate.notifications.client.dto;

/** Mirrors moodmate-wellness's dto.UserHabitTodaySummary exactly
 * (GET /internal/wellness/habits/today-summary). */
public record UserHabitTodaySummary(Long userId, int totalHabitsToday, int completedHabitsToday) {
}
