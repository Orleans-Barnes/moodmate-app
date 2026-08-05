package com.moodmate.mood.engine;

import com.moodmate.mood.entity.Emotion;
import com.moodmate.mood.entity.MoodCheckin;

import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/** New for Feature 8 (Mood Analytics). Pure, dependency-free static methods - same "Engine" class
 * convention as moodmate-wellness's HabitEngine/SleepEngine: testable without a Spring context,
 * no repository/service dependencies. Dates are derived from MoodCheckin.createdAt via UTC (this
 * service's Hibernate/Jackson time zone - see application.yml), matching how the checkin was
 * actually persisted. */
public final class AnalyticsEngine {

    private AnalyticsEngine() {
    }

    /** One row per calendar day that has at least one checkin - days with zero checkins are simply
     * absent (unlike moodmate-wellness's DailyWellnessStat, which deliberately fills every day;
     * here an absent day legitimately means "nothing to average", not "zero activity" - there's no
     * meaningful zero-value stress/energy to report). */
    public static List<DailyMoodStat> aggregateByDay(List<MoodCheckin> checkins) {
        Map<LocalDate, List<MoodCheckin>> byDate = checkins.stream()
                .collect(Collectors.groupingBy(c -> c.getCreatedAt().atZone(ZoneOffset.UTC).toLocalDate()));

        return byDate.entrySet().stream()
                .map(entry -> {
                    LocalDate date = entry.getKey();
                    List<MoodCheckin> dayCheckins = entry.getValue();
                    double avgStress = dayCheckins.stream().mapToInt(MoodCheckin::getStressLevel).average().orElse(0);
                    double avgEnergy = dayCheckins.stream().mapToInt(MoodCheckin::getEnergyLevel).average().orElse(0);
                    Emotion dominant = dominantEmotion(dayCheckins);
                    return new DailyMoodStat(date, round1(avgStress), round1(avgEnergy), dayCheckins.size(), dominant);
                })
                .sorted(Comparator.comparing(DailyMoodStat::date))
                .toList();
    }

    /** Ties broken by whichever emotion was logged first that day - simple, deterministic, no
     * hidden randomness. */
    private static Emotion dominantEmotion(List<MoodCheckin> dayCheckins) {
        Map<Emotion, Long> counts = dayCheckins.stream()
                .collect(Collectors.groupingBy(MoodCheckin::getEmotionKey, Collectors.counting()));
        return dayCheckins.stream()
                .map(MoodCheckin::getEmotionKey)
                .distinct()
                .max(Comparator.comparingLong(counts::get))
                .orElse(null);
    }

    public static List<EmotionCount> emotionFrequency(List<MoodCheckin> checkins) {
        Map<Emotion, Long> counts = checkins.stream()
                .collect(Collectors.groupingBy(MoodCheckin::getEmotionKey, Collectors.counting()));
        return counts.entrySet().stream()
                .map(e -> new EmotionCount(e.getKey(), e.getValue()))
                .sorted(Comparator.comparingLong(EmotionCount::count).reversed())
                .toList();
    }

    /** Pearson correlation coefficient between two equal-length numeric series. Returns null (not
     * NaN or a fabricated 0) when there are fewer than 3 paired points or either series has zero
     * variance (a coefficient is undefined, not zero, in that case) - callers must treat null as
     * "not enough data to say", not "no correlation". */
    public static Double pearsonCorrelation(List<Double> xs, List<Double> ys) {
        if (xs.size() != ys.size() || xs.size() < 3) {
            return null;
        }
        int n = xs.size();
        double meanX = xs.stream().mapToDouble(Double::doubleValue).average().orElse(0);
        double meanY = ys.stream().mapToDouble(Double::doubleValue).average().orElse(0);

        double covariance = 0, varX = 0, varY = 0;
        for (int i = 0; i < n; i++) {
            double dx = xs.get(i) - meanX;
            double dy = ys.get(i) - meanY;
            covariance += dx * dy;
            varX += dx * dx;
            varY += dy * dy;
        }
        if (varX == 0 || varY == 0) {
            return null;
        }
        return round2(covariance / Math.sqrt(varX * varY));
    }

    /** Plain-language label for a coefficient, using the common (Evans, 1996) magnitude bands. */
    public static String interpret(Double coefficient) {
        if (coefficient == null) {
            return "insufficient data";
        }
        double abs = Math.abs(coefficient);
        String strength = abs >= 0.7 ? "strong" : abs >= 0.4 ? "moderate" : abs >= 0.2 ? "weak" : "negligible";
        if (abs < 0.2) {
            return strength;
        }
        return strength + " " + (coefficient > 0 ? "positive" : "negative");
    }

    private static double round1(double v) {
        return Math.round(v * 10.0) / 10.0;
    }

    private static double round2(double v) {
        return Math.round(v * 100.0) / 100.0;
    }

    public record DailyMoodStat(LocalDate date, double avgStress, double avgEnergy, int checkinCount, Emotion dominantEmotion) {
    }

    public record EmotionCount(Emotion emotion, long count) {
    }
}
