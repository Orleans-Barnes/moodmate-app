package com.moodmate.ai.service;

import com.moodmate.ai.client.GroqClient;
import com.moodmate.ai.client.GroqMessage;
import com.moodmate.ai.client.MoodServiceClient;
import com.moodmate.ai.client.MoodTrendSummary;
import com.moodmate.ai.dto.InsightsResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.Set;

/**
 * Backs GET /api/insights. Built entirely from mood-service's check-in history (stress/energy/
 * emotion over the last 30 days) - journal content is deliberately NOT read here, to avoid this
 * service needing broad read access into journal-service's private entries just to compute a
 * score; mood check-ins are the narrower, already-cross-service-shared signal (wellness-service
 * already reads mood indirectly via streaks, wallet via rewards).
 *
 * wellnessScore (0-100) and sentimentScore (-100 to 100) are computed deterministically from that
 * data - no LLM involved, so they're fast, free, and reproducible. Only narrativeSummary is
 * Groq-generated (the frontend's own type comment says "AI-generated narrative"); if Groq is
 * unavailable or misconfigured, this falls back to a simple templated sentence built from the same
 * stats rather than failing the whole endpoint - a wellness score with no narrative text is still
 * useful, but an insights screen that 502s because Groq is down is not.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class InsightsService {

    private static final Set<String> POSITIVE_EMOTIONS =
            Set.of("HAPPY", "CALM", "HOPEFUL", "GRATEFUL", "MOTIVATED");
    private static final int TREND_WINDOW_DAYS = 30;
    private static final int FORECAST_WINDOW_DAYS = 3;
    private static final short STRESS_ALERT_THRESHOLD = 4; // out of 5 - see mood-service's 1-5 scale

    private final MoodServiceClient moodServiceClient;
    private final GroqClient groqClient;

    public InsightsResponse getInsights(Long userId) {
        MoodTrendSummary trend = moodServiceClient.getTrend(userId, TREND_WINDOW_DAYS);
        List<MoodTrendSummary.DataPoint> points = trend != null ? trend.points() : List.of();

        if (points.isEmpty()) {
            return new InsightsResponse(
                    "Not enough check-in data yet to generate insights - log your mood for a few days and check back!",
                    0, 50, null, Instant.now());
        }

        double avgStress = points.stream().mapToInt(MoodTrendSummary.DataPoint::stressLevel).average().orElse(3);
        double avgEnergy = points.stream().mapToInt(MoodTrendSummary.DataPoint::energyLevel).average().orElse(3);
        double positiveRatio = points.stream()
                .filter(p -> POSITIVE_EMOTIONS.contains(p.emotionKey()))
                .count() / (double) points.size();

        // Weights: lower stress is worth 40%, higher energy 30%, positive-emotion ratio 30%.
        // Stress/energy are on mood-service's 1-5 scale (see CheckInRequest's @Min(1) @Max(5)).
        int wellnessScore = (int) Math.round(
                ((5 - avgStress) / 4.0) * 40 + ((avgEnergy - 1) / 4.0) * 30 + positiveRatio * 30);
        wellnessScore = clamp(wellnessScore, 0, 100);

        int sentimentScore = clamp((int) Math.round((positiveRatio * 2 - 1) * 100), -100, 100);

        String forecastAlert = buildForecastAlert(points);
        String narrativeSummary = buildNarrative(avgStress, avgEnergy, positiveRatio, points.size(), wellnessScore);

        return new InsightsResponse(narrativeSummary, sentimentScore, wellnessScore, forecastAlert, Instant.now());
    }

    private String buildForecastAlert(List<MoodTrendSummary.DataPoint> points) {
        Instant since = Instant.now().minusSeconds((long) FORECAST_WINDOW_DAYS * 24 * 3600);
        List<MoodTrendSummary.DataPoint> recent = points.stream().filter(p -> p.date().isAfter(since)).toList();
        if (recent.size() < FORECAST_WINDOW_DAYS) {
            return null; // not enough recent data to call a trend
        }
        double recentAvgStress = recent.stream().mapToInt(MoodTrendSummary.DataPoint::stressLevel).average().orElse(0);
        if (recentAvgStress >= STRESS_ALERT_THRESHOLD) {
            return "Your stress levels have been elevated for the past few days - consider taking a break or reaching out for support.";
        }
        return null;
    }

    private String buildNarrative(double avgStress, double avgEnergy, double positiveRatio, int checkinCount, int wellnessScore) {
        String prompt = String.format(
                "A student's recent mood check-in data over the last %d days: average stress %.1f/5, " +
                "average energy %.1f/5, %.0f%% of check-ins were positive emotions, %d total check-ins, " +
                "overall wellness score %d/100. Write a warm, encouraging 2-3 sentence narrative summary " +
                "reflecting this pattern back to them. No clinical language, no diagnosis, no bullet points - " +
                "just a short supportive reflection, second person (\"you\").",
                TREND_WINDOW_DAYS, avgStress, avgEnergy, positiveRatio * 100, checkinCount, wellnessScore);
        try {
            return groqClient.complete(List.of(new GroqMessage("user", prompt)), 0.8, 200).trim();
        } catch (Exception e) {
            log.warn("Groq narrative generation failed, falling back to templated summary: {}", e.getMessage());
            return String.format(
                    "Over the last %d days you've checked in %d times, averaging %.1f/5 on stress and %.1f/5 on energy. " +
                    "Keep showing up for yourself - every check-in helps build a clearer picture of how you're doing.",
                    TREND_WINDOW_DAYS, checkinCount, avgStress, avgEnergy);
        }
    }

    private int clamp(int value, int min, int max) {
        return Math.max(min, Math.min(max, value));
    }
}
