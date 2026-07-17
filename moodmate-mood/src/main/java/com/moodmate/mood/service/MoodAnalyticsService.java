package com.moodmate.mood.service;

import com.moodmate.mood.client.DailyWellnessStat;
import com.moodmate.mood.client.WellnessServiceClient;
import com.moodmate.mood.dto.CorrelationResponse;
import com.moodmate.mood.dto.DailyMoodStatResponse;
import com.moodmate.mood.dto.EmotionFrequencyResponse;
import com.moodmate.mood.dto.MoodTrendResponse;
import com.moodmate.mood.dto.StressTrendPoint;
import com.moodmate.mood.dto.StressTrendResponse;
import com.moodmate.mood.engine.AnalyticsEngine;
import com.moodmate.mood.entity.MoodCheckin;
import com.moodmate.mood.repository.MoodCheckinRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * New for Feature 8 (Mood Analytics) - not in the monolith. All correlation math lives in the pure
 * AnalyticsEngine; this class is the Spring-aware layer that fetches checkins (and, for the two
 * cross-service correlations, wellness-service's daily stats) and shapes the result into response
 * DTOs. Kept separate from MoodService (which owns the plain record/history/single-user-trend
 * contract inherited from the monolith) so that pre-existing class isn't touched at all.
 */
@Service
@RequiredArgsConstructor
public class MoodAnalyticsService {

    private final MoodCheckinRepository checkinRepository;
    private final WellnessServiceClient wellnessServiceClient;

    @Transactional(readOnly = true)
    public MoodTrendResponse weeklyTrend(Long userId) {
        return trend(userId, 7);
    }

    @Transactional(readOnly = true)
    public MoodTrendResponse monthlyTrend(Long userId) {
        return trend(userId, 30);
    }

    @Transactional(readOnly = true)
    public MoodTrendResponse trend(Long userId, int days) {
        List<AnalyticsEngine.DailyMoodStat> stats = AnalyticsEngine.aggregateByDay(checkinsSince(userId, days));
        List<DailyMoodStatResponse> responses = stats.stream()
                .map(s -> new DailyMoodStatResponse(s.date(), s.avgStress(), s.avgEnergy(), s.checkinCount(), s.dominantEmotion()))
                .toList();
        return new MoodTrendResponse(periodStart(days), LocalDate.now(), responses);
    }

    @Transactional(readOnly = true)
    public StressTrendResponse stressTrend(Long userId, int days) {
        List<StressTrendPoint> points = AnalyticsEngine.aggregateByDay(checkinsSince(userId, days)).stream()
                .map(s -> new StressTrendPoint(s.date(), s.avgStress()))
                .toList();
        return new StressTrendResponse(periodStart(days), LocalDate.now(), points);
    }

    @Transactional(readOnly = true)
    public EmotionFrequencyResponse emotionFrequency(Long userId, int days) {
        List<MoodCheckin> checkins = checkinsSince(userId, days);
        List<EmotionFrequencyResponse.EmotionCount> frequencies = AnalyticsEngine.emotionFrequency(checkins).stream()
                .map(f -> new EmotionFrequencyResponse.EmotionCount(f.emotion(), f.count()))
                .toList();
        return new EmotionFrequencyResponse(checkins.size(), frequencies);
    }

    /** Stress vs energy, correlated per-checkin (not per-day) - every checkin already carries both
     * values together, so this doesn't need day-level aggregation or a cross-service call. */
    @Transactional(readOnly = true)
    public CorrelationResponse moodCorrelation(Long userId, int days) {
        List<MoodCheckin> checkins = checkinsSince(userId, days);
        List<Double> stress = checkins.stream().map(c -> (double) c.getStressLevel()).toList();
        List<Double> energy = checkins.stream().map(c -> (double) c.getEnergyLevel()).toList();
        Double r = AnalyticsEngine.pearsonCorrelation(stress, energy);
        return new CorrelationResponse("stress", "energy", r, checkins.size(), AnalyticsEngine.interpret(r));
    }

    /** Daily average stress vs that day's habit-completion count, joined by date against
     * wellness-service's daily stats (see WellnessServiceClient's doc comment for the graceful-
     * degradation behavior on an outage - this simply returns fewer/zero paired points, which
     * pearsonCorrelation already reports as "insufficient data" rather than a fabricated 0). */
    @Transactional(readOnly = true)
    public CorrelationResponse habitCorrelation(Long userId, int days) {
        return wellnessCorrelation(userId, days, "stress", "habitsCompleted", DailyWellnessStat::habitsCompleted, false);
    }

    /** Daily average stress vs that day's total sleep minutes, same join strategy as
     * habitCorrelation - days with no sleep log that date are excluded (null sleepMinutes), not
     * treated as zero. */
    @Transactional(readOnly = true)
    public CorrelationResponse sleepCorrelation(Long userId, int days) {
        return wellnessCorrelation(userId, days, "stress", "sleepMinutes",
                s -> s.sleepMinutes() != null ? s.sleepMinutes().doubleValue() : null, true);
    }

    private CorrelationResponse wellnessCorrelation(Long userId, int days, String metricA, String metricB,
                                                      java.util.function.Function<DailyWellnessStat, Number> extractor,
                                                      boolean skipNulls) {
        Map<LocalDate, Double> avgStressByDate = AnalyticsEngine.aggregateByDay(checkinsSince(userId, days)).stream()
                .collect(Collectors.toMap(AnalyticsEngine.DailyMoodStat::date, AnalyticsEngine.DailyMoodStat::avgStress));

        List<DailyWellnessStat> wellnessStats = wellnessServiceClient.dailyStats(userId, days);

        List<Double> xs = new ArrayList<>();
        List<Double> ys = new ArrayList<>();
        for (DailyWellnessStat stat : wellnessStats) {
            Double avgStress = avgStressByDate.get(stat.date());
            Number value = extractor.apply(stat);
            if (avgStress == null || (skipNulls && value == null)) {
                continue;
            }
            xs.add(avgStress);
            ys.add(value != null ? value.doubleValue() : 0.0);
        }

        Double r = AnalyticsEngine.pearsonCorrelation(xs, ys);
        return new CorrelationResponse(metricA, metricB, r, xs.size(), AnalyticsEngine.interpret(r));
    }

    private List<MoodCheckin> checkinsSince(Long userId, int days) {
        Instant since = Instant.now().minus(days, ChronoUnit.DAYS);
        return checkinRepository.findByUserIdAndCreatedAtAfterOrderByCreatedAtAsc(userId, since);
    }

    private LocalDate periodStart(int days) {
        return Instant.now().minus(days, ChronoUnit.DAYS).atZone(ZoneOffset.UTC).toLocalDate();
    }
}
