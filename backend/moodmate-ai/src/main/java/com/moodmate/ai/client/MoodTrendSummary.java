package com.moodmate.ai.client;

import java.time.Instant;
import java.util.List;

/** Local copy of mood-service's MoodHistoryResponse shape - deserialized from its
 * GET /internal/mood/{userId}/trend response. emotionKey is kept as a plain String here
 * (rather than a local copy of mood-service's Emotion enum) since InsightsService only needs to
 * bucket it into "positive"/"negative", not the specific value. */
public record MoodTrendSummary(List<DataPoint> points) {
    public record DataPoint(String emotionKey, int stressLevel, int energyLevel, Instant date) {
    }
}
