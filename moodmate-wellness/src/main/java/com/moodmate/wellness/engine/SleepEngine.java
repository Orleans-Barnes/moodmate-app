package com.moodmate.wellness.engine;

import java.time.LocalDate;
import java.util.List;

/** Pure, dependency-free sleep-analytics arithmetic - same "testable without Spring" pattern as
 * {@link GoalEngine} and {@link HabitEngine} in this package. */
public final class SleepEngine {

    private SleepEngine() {
    }

    public record NightStat(int durationMins, int quality) {
    }

    public record AnalyticsResult(
            int nightsLogged,
            int averageDurationMins,
            double averageQuality,
            double consistencyRate,
            int bestQuality,
            int worstQuality
    ) {
    }

    /** @param periodDays length of the window being summarized (7 for weekly, 30 for monthly) -
     * used only for consistencyRate, so a short history doesn't get penalized as "0% consistent"
     * for days before the user started logging. */
    public static AnalyticsResult computeAnalytics(List<NightStat> nights, int periodDays) {
        if (nights.isEmpty()) {
            return new AnalyticsResult(0, 0, 0.0, 0.0, 0, 0);
        }
        int totalDuration = 0;
        int totalQuality = 0;
        int best = Integer.MIN_VALUE;
        int worst = Integer.MAX_VALUE;
        for (NightStat n : nights) {
            totalDuration += n.durationMins();
            totalQuality += n.quality();
            best = Math.max(best, n.quality());
            worst = Math.min(worst, n.quality());
        }
        int count = nights.size();
        int avgDuration = Math.round((float) totalDuration / count);
        double avgQuality = Math.round((totalQuality / (double) count) * 100.0) / 100.0;
        double consistency = periodDays > 0
                ? Math.round((Math.min(count, periodDays) / (double) periodDays) * 1000.0) / 1000.0
                : 0.0;

        return new AnalyticsResult(count, avgDuration, avgQuality, consistency, best, worst);
    }

    /** True if today's log would push the user's streak of goal-meeting nights forward - not
     * currently exposed via a dedicated endpoint, kept for completeness/future use since Sleep
     * Goals are tracked (see SleepGoal entity). */
    public static boolean meetsGoal(int durationMins, int targetMinutes) {
        return durationMins >= targetMinutes;
    }

    public static LocalDate periodStart(LocalDate today, int periodDays) {
        return today.minusDays(periodDays - 1L);
    }
}
