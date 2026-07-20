package com.moodmate.mood.dto;

import com.moodmate.mood.entity.Emotion;

import java.time.Instant;
import java.util.List;

/** Not part of the monolith's contract - kept from the pre-existing service stub for a
 * mood-trend/analytics view (see FRONTEND_UPDATES/screens/insights/MoodAnalyticsScreen.tsx). */
public record MoodHistoryResponse(List<DataPoint> points) {
    public record DataPoint(Emotion emotionKey, int stressLevel, int energyLevel, Instant date) {
    }
}
