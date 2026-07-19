package com.moodmate.wellness.dto;

/**
 * Repository-layer projection shared by two grouped queries (Phase 1E Step 4) -
 * HabitRepository.countHabitsPerUser() (total habits defined) and
 * HabitCompletionRepository.countCompletionsPerUserOnDate() (completions on a given date). Generic
 * enough to serve both; HabitService.todaySummaryForAllUsers() merges the two result lists into
 * UserHabitTodaySummary.
 */
public record UserHabitCountDto(Long userId, long count) {
}
