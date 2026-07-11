package com.moodmate.backend.ai.dto;

import java.time.Instant;

/**
 * Returned by GET /api/insights.
 *
 * sentimentScore : -100 (very negative) → 100 (very positive)
 * wellnessScore  : 0 (poor) → 100 (excellent)
 * forecastAlert  : non-null when mood patterns suggest a dip in the next 48–72 hours
 */
public record InsightsResponse(
        String  narrativeSummary,
        int     sentimentScore,
        int     wellnessScore,
        String  forecastAlert,
        Instant generatedAt
) {}
