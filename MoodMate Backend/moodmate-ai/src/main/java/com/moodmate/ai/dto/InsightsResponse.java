package com.moodmate.ai.dto;

import java.time.Instant;

/** Mirrors the frontend's InsightsResponse exactly (src/api/insights.ts). */
public record InsightsResponse(String narrativeSummary, int sentimentScore, int wellnessScore,
                                String forecastAlert, Instant generatedAt) {
}
