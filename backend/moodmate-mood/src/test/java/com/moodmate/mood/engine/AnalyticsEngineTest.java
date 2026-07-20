package com.moodmate.mood.engine;

import com.moodmate.mood.entity.Emotion;
import com.moodmate.mood.entity.MoodCheckin;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

/** Pure unit tests for Feature 8's AnalyticsEngine - no Spring context, matches the
 * HabitEngineTest/SleepEngineTest convention in moodmate-wellness. */
class AnalyticsEngineTest {

    @Test
    void aggregateByDayAveragesStressAndEnergyPerCalendarDay() {
        LocalDate day = LocalDate.of(2026, 7, 10);
        List<MoodCheckin> checkins = List.of(
                checkin(day, Emotion.HAPPY, (short) 2, (short) 4),
                checkin(day, Emotion.HAPPY, (short) 4, (short) 2));

        List<AnalyticsEngine.DailyMoodStat> stats = AnalyticsEngine.aggregateByDay(checkins);

        assertEquals(1, stats.size());
        assertEquals(day, stats.get(0).date());
        assertEquals(3.0, stats.get(0).avgStress());
        assertEquals(3.0, stats.get(0).avgEnergy());
        assertEquals(2, stats.get(0).checkinCount());
        assertEquals(Emotion.HAPPY, stats.get(0).dominantEmotion());
    }

    @Test
    void aggregateByDaySortsChronologically() {
        LocalDate earlier = LocalDate.of(2026, 7, 8);
        LocalDate later = LocalDate.of(2026, 7, 10);
        List<MoodCheckin> checkins = List.of(
                checkin(later, Emotion.CALM, (short) 1, (short) 5),
                checkin(earlier, Emotion.ANXIOUS, (short) 5, (short) 1));

        List<AnalyticsEngine.DailyMoodStat> stats = AnalyticsEngine.aggregateByDay(checkins);

        assertEquals(earlier, stats.get(0).date());
        assertEquals(later, stats.get(1).date());
    }

    @Test
    void emotionFrequencyCountsAndSortsDescending() {
        List<MoodCheckin> checkins = List.of(
                checkin(LocalDate.now(), Emotion.HAPPY, (short) 1, (short) 5),
                checkin(LocalDate.now(), Emotion.HAPPY, (short) 1, (short) 5),
                checkin(LocalDate.now(), Emotion.ANXIOUS, (short) 4, (short) 2));

        List<AnalyticsEngine.EmotionCount> frequency = AnalyticsEngine.emotionFrequency(checkins);

        assertEquals(Emotion.HAPPY, frequency.get(0).emotion());
        assertEquals(2, frequency.get(0).count());
        assertEquals(Emotion.ANXIOUS, frequency.get(1).emotion());
        assertEquals(1, frequency.get(1).count());
    }

    @Test
    void pearsonCorrelationDetectsPerfectPositiveCorrelation() {
        List<Double> xs = List.of(1.0, 2.0, 3.0, 4.0);
        List<Double> ys = List.of(2.0, 4.0, 6.0, 8.0);

        Double r = AnalyticsEngine.pearsonCorrelation(xs, ys);

        assertEquals(1.0, r);
        assertEquals("strong positive", AnalyticsEngine.interpret(r));
    }

    @Test
    void pearsonCorrelationDetectsPerfectNegativeCorrelation() {
        List<Double> xs = List.of(1.0, 2.0, 3.0, 4.0);
        List<Double> ys = List.of(8.0, 6.0, 4.0, 2.0);

        Double r = AnalyticsEngine.pearsonCorrelation(xs, ys);

        assertEquals(-1.0, r);
        assertEquals("strong negative", AnalyticsEngine.interpret(r));
    }

    @Test
    void pearsonCorrelationReturnsNullWithFewerThanThreePoints() {
        assertNull(AnalyticsEngine.pearsonCorrelation(List.of(1.0, 2.0), List.of(1.0, 2.0)));
    }

    @Test
    void pearsonCorrelationReturnsNullWhenASeriesHasZeroVariance() {
        List<Double> xs = List.of(1.0, 1.0, 1.0);
        List<Double> ys = List.of(1.0, 2.0, 3.0);

        assertNull(AnalyticsEngine.pearsonCorrelation(xs, ys));
    }

    @Test
    void interpretReturnsInsufficientDataForNullCoefficient() {
        assertEquals("insufficient data", AnalyticsEngine.interpret(null));
    }

    @Test
    void interpretBandsMatchMagnitude() {
        assertTrue(AnalyticsEngine.interpret(0.1).equals("negligible"));
        assertEquals("weak positive", AnalyticsEngine.interpret(0.25));
        assertEquals("moderate negative", AnalyticsEngine.interpret(-0.5));
    }

    private MoodCheckin checkin(LocalDate date, Emotion emotion, short stress, short energy) {
        Instant createdAt = date.atStartOfDay(ZoneOffset.UTC).plusHours(12).toInstant();
        return MoodCheckin.builder().userId(1L).emotionKey(emotion).stressLevel(stress)
                .energyLevel(energy).createdAt(createdAt).build();
    }
}
