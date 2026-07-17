package com.moodmate.wellness.engine;

import java.time.LocalDate;

/**
 * Pure, dependency-free streak arithmetic for user-defined habits - mirrors the style of
 * {@link GoalEngine} (same package) so both are unit-testable without Spring/a database. Kept
 * deliberately separate from GoalEngine: habits are user-created and independent of each other,
 * unlike the templated "all 3 daily goals" streak GoalEngine models.
 */
public final class HabitEngine {

    private HabitEngine() {
    }

    /**
     * Streak value after marking a habit done for {@code today}. Idempotent if called again for a
     * day that's already the last-completed date (returns the same streak, doesn't double-count) -
     * HabitService guards against this by checking for an existing completion row first, but this
     * function is safe on its own regardless.
     */
    public static int nextStreakOnComplete(LocalDate lastCompletedDate, int currentStreak, LocalDate today) {
        if (lastCompletedDate == null) {
            return 1;
        }
        if (lastCompletedDate.equals(today)) {
            return currentStreak; // already counted today - no-op
        }
        if (lastCompletedDate.equals(today.minusDays(1))) {
            return currentStreak + 1; // consecutive day
        }
        return 1; // gap of more than one day - streak restarts
    }

    /** Streak value after undoing today's completion. Only meaningful when the habit's
     * lastCompletedDate was actually today (HabitService only calls this in that case). */
    public static int streakOnUncomplete(int currentStreak) {
        return Math.max(0, currentStreak - 1);
    }

    /** Longest run of consecutive calendar days in a sorted (ascending), deduplicated list of
     * completion dates. O(n), no database access - callers pass in already-fetched dates. */
    public static int longestStreak(java.util.List<LocalDate> sortedAscendingDates) {
        if (sortedAscendingDates.isEmpty()) {
            return 0;
        }
        int longest = 1;
        int current = 1;
        for (int i = 1; i < sortedAscendingDates.size(); i++) {
            LocalDate prev = sortedAscendingDates.get(i - 1);
            LocalDate curr = sortedAscendingDates.get(i);
            if (prev.plusDays(1).equals(curr)) {
                current++;
            } else if (!prev.equals(curr)) {
                current = 1;
            }
            longest = Math.max(longest, current);
        }
        return longest;
    }
}
