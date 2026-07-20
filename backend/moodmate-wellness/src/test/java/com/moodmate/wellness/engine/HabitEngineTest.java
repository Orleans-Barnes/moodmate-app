package com.moodmate.wellness.engine;

import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;

/** Exercises the contract documented on {@link HabitEngine}. Run via `mvnw -pl moodmate-wellness -am test`. */
class HabitEngineTest {

    private static final LocalDate DAY = LocalDate.of(2026, 7, 15);

    @Test
    void firstEverCompletionStartsStreakAtOne() {
        assertEquals(1, HabitEngine.nextStreakOnComplete(null, 0, DAY));
    }

    @Test
    void consecutiveDayIncrementsStreak() {
        assertEquals(4, HabitEngine.nextStreakOnComplete(DAY.minusDays(1), 3, DAY));
    }

    @Test
    void gapOfMoreThanOneDayResetsStreakToOne() {
        assertEquals(1, HabitEngine.nextStreakOnComplete(DAY.minusDays(3), 10, DAY));
    }

    @Test
    void completingTwiceSameDayIsIdempotent() {
        assertEquals(5, HabitEngine.nextStreakOnComplete(DAY, 5, DAY));
    }

    @Test
    void uncompleteDecrementsStreakByOne() {
        assertEquals(4, HabitEngine.streakOnUncomplete(5));
    }

    @Test
    void uncompleteNeverGoesNegative() {
        assertEquals(0, HabitEngine.streakOnUncomplete(0));
    }

    @Test
    void longestStreakFindsBestConsecutiveRun() {
        // 3 in a row, gap, then 2 in a row - longest should be 3
        List<LocalDate> dates = List.of(
                DAY, DAY.plusDays(1), DAY.plusDays(2),
                DAY.plusDays(5), DAY.plusDays(6)
        );
        assertEquals(3, HabitEngine.longestStreak(dates));
    }

    @Test
    void longestStreakOnEmptyListIsZero() {
        assertEquals(0, HabitEngine.longestStreak(List.of()));
    }

    @Test
    void longestStreakOnSingleDateIsOne() {
        assertEquals(1, HabitEngine.longestStreak(List.of(DAY)));
    }
}
