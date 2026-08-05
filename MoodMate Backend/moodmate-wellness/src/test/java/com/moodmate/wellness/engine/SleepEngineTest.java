package com.moodmate.wellness.engine;

import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/** Exercises the contract documented on {@link SleepEngine}. Run via `mvnw -pl moodmate-wellness -am test`. */
class SleepEngineTest {

    @Test
    void emptyHistoryYieldsAllZeros() {
        var result = SleepEngine.computeAnalytics(List.of(), 7);
        assertEquals(0, result.nightsLogged());
        assertEquals(0, result.averageDurationMins());
        assertEquals(0.0, result.averageQuality());
        assertEquals(0.0, result.consistencyRate());
    }

    @Test
    void averagesComputedCorrectly() {
        var nights = List.of(
                new SleepEngine.NightStat(480, 4),
                new SleepEngine.NightStat(420, 3),
                new SleepEngine.NightStat(510, 5)
        );
        var result = SleepEngine.computeAnalytics(nights, 7);
        assertEquals(3, result.nightsLogged());
        assertEquals(470, result.averageDurationMins()); // (480+420+510)/3 = 470
        assertEquals(4.0, result.averageQuality());
        assertEquals(5, result.bestQuality());
        assertEquals(3, result.worstQuality());
    }

    @Test
    void consistencyRateCapsAtOneEvenWithMoreLogsThanPeriodDays() {
        // Defensive: shouldn't happen given callers filter by date range, but must not exceed 1.0
        List<SleepEngine.NightStat> nights = List.of(
                new SleepEngine.NightStat(480, 4),
                new SleepEngine.NightStat(480, 4),
                new SleepEngine.NightStat(480, 4)
        );
        var result = SleepEngine.computeAnalytics(nights, 2);
        assertTrue(result.consistencyRate() <= 1.0);
    }

    @Test
    void consistencyRateReflectsPartialLogging() {
        var nights = List.of(new SleepEngine.NightStat(480, 4));
        var result = SleepEngine.computeAnalytics(nights, 7);
        assertEquals(1.0 / 7.0, result.consistencyRate(), 0.001);
    }

    @Test
    void meetsGoalTrueWhenDurationAtOrAboveTarget() {
        assertTrue(SleepEngine.meetsGoal(480, 480));
        assertTrue(SleepEngine.meetsGoal(500, 480));
        assertFalse(SleepEngine.meetsGoal(400, 480));
    }

    @Test
    void periodStartIsInclusiveOfTodayMinusDaysPlusOne() {
        LocalDate today = LocalDate.of(2026, 7, 15);
        assertEquals(LocalDate.of(2026, 7, 9), SleepEngine.periodStart(today, 7));
        assertEquals(LocalDate.of(2026, 6, 16), SleepEngine.periodStart(today, 30));
    }
}
