package com.moodmate.mood.service;

import com.moodmate.mood.client.DailyWellnessStat;
import com.moodmate.mood.client.WellnessServiceClient;
import com.moodmate.mood.dto.CorrelationResponse;
import com.moodmate.mood.dto.EmotionFrequencyResponse;
import com.moodmate.mood.dto.MoodTrendResponse;
import com.moodmate.mood.entity.Emotion;
import com.moodmate.mood.entity.MoodCheckin;
import com.moodmate.mood.repository.MoodCheckinRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/** Covers Feature 8's Spring-aware analytics layer - the day-aggregation/correlation math itself
 * is covered by AnalyticsEngineTest; this focuses on wiring (fetch window, DTO shaping, and the
 * habit/sleep correlation's join-by-date against WellnessServiceClient). */
class MoodAnalyticsServiceTest {

    private MoodCheckinRepository checkinRepository;
    private WellnessServiceClient wellnessServiceClient;
    private MoodAnalyticsService service;

    @BeforeEach
    void setUp() {
        checkinRepository = mock(MoodCheckinRepository.class);
        wellnessServiceClient = mock(WellnessServiceClient.class);
        service = new MoodAnalyticsService(checkinRepository, wellnessServiceClient);
    }

    @Test
    void weeklyTrendReturnsOneEntryPerActiveDay() {
        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        when(checkinRepository.findByUserIdAndCreatedAtAfterOrderByCreatedAtAsc(eq(1L), any()))
                .thenReturn(List.of(checkin(today, Emotion.HAPPY, (short) 2, (short) 4)));

        MoodTrendResponse response = service.weeklyTrend(1L);

        assertEquals(1, response.days().size());
        assertEquals(today, response.days().get(0).date());
    }

    @Test
    void emotionFrequencyCountsTotalCheckins() {
        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        when(checkinRepository.findByUserIdAndCreatedAtAfterOrderByCreatedAtAsc(eq(1L), any()))
                .thenReturn(List.of(
                        checkin(today, Emotion.HAPPY, (short) 2, (short) 4),
                        checkin(today, Emotion.ANXIOUS, (short) 4, (short) 2)));

        EmotionFrequencyResponse response = service.emotionFrequency(1L, 30);

        assertEquals(2, response.totalCheckins());
        assertEquals(2, response.frequencies().size());
    }

    @Test
    void moodCorrelationPairsStressAndEnergyPerCheckin() {
        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        when(checkinRepository.findByUserIdAndCreatedAtAfterOrderByCreatedAtAsc(eq(1L), any()))
                .thenReturn(List.of(
                        checkin(today, Emotion.HAPPY, (short) 1, (short) 5),
                        checkin(today, Emotion.CALM, (short) 2, (short) 4),
                        checkin(today, Emotion.STRESSED, (short) 5, (short) 1)));

        CorrelationResponse response = service.moodCorrelation(1L, 30);

        assertEquals("stress", response.metricA());
        assertEquals("energy", response.metricB());
        assertEquals(3, response.sampleSize());
        assertEquals(-1.0, response.coefficient());
    }

    @Test
    void habitCorrelationJoinsByDateWithWellnessServiceStats() {
        LocalDate day1 = LocalDate.now(ZoneOffset.UTC);
        LocalDate day2 = day1.minusDays(1);
        LocalDate day3 = day1.minusDays(2);
        when(checkinRepository.findByUserIdAndCreatedAtAfterOrderByCreatedAtAsc(eq(1L), any()))
                .thenReturn(List.of(
                        checkin(day1, Emotion.STRESSED, (short) 5, (short) 1),
                        checkin(day2, Emotion.CALM, (short) 3, (short) 3),
                        checkin(day3, Emotion.HAPPY, (short) 1, (short) 5)));
        when(wellnessServiceClient.dailyStats(eq(1L), anyInt())).thenReturn(List.of(
                new DailyWellnessStat(day1, 0, null),
                new DailyWellnessStat(day2, 1, null),
                new DailyWellnessStat(day3, 3, null)));

        CorrelationResponse response = service.habitCorrelation(1L, 30);

        assertEquals("habitsCompleted", response.metricB());
        assertEquals(3, response.sampleSize());
    }

    @Test
    void sleepCorrelationExcludesDaysWithNoSleepLog() {
        LocalDate day1 = LocalDate.now(ZoneOffset.UTC);
        LocalDate day2 = day1.minusDays(1);
        when(checkinRepository.findByUserIdAndCreatedAtAfterOrderByCreatedAtAsc(eq(1L), any()))
                .thenReturn(List.of(
                        checkin(day1, Emotion.STRESSED, (short) 5, (short) 1),
                        checkin(day2, Emotion.HAPPY, (short) 1, (short) 5)));
        when(wellnessServiceClient.dailyStats(eq(1L), anyInt())).thenReturn(List.of(
                new DailyWellnessStat(day1, 0, 300),
                new DailyWellnessStat(day2, 0, null)));

        CorrelationResponse response = service.sleepCorrelation(1L, 30);

        assertEquals(1, response.sampleSize(), "day2 has no sleep log and must be excluded, not treated as zero");
        assertNull(response.coefficient(), "fewer than 3 paired points must report insufficient data, not a fabricated coefficient");
    }

    @Test
    void wellnessServiceOutageDegradesToInsufficientDataRatherThanFailing() {
        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        when(checkinRepository.findByUserIdAndCreatedAtAfterOrderByCreatedAtAsc(eq(1L), any()))
                .thenReturn(List.of(checkin(today, Emotion.HAPPY, (short) 2, (short) 4)));
        when(wellnessServiceClient.dailyStats(eq(1L), anyInt())).thenReturn(List.of());

        CorrelationResponse response = service.habitCorrelation(1L, 30);

        assertEquals(0, response.sampleSize());
        assertNull(response.coefficient());
        assertEquals("insufficient data", response.interpretation());
    }

    private MoodCheckin checkin(LocalDate date, Emotion emotion, short stress, short energy) {
        Instant createdAt = date.atStartOfDay(ZoneOffset.UTC).plusHours(12).toInstant();
        return MoodCheckin.builder().userId(1L).emotionKey(emotion).stressLevel(stress)
                .energyLevel(energy).createdAt(createdAt).build();
    }
}
