package com.moodmate.mood.dto;

/** coefficient/interpretation are null/"insufficient data" (not a fabricated 0/"none") when there
 * aren't enough paired data points - see AnalyticsEngine.pearsonCorrelation's doc comment. */
public record CorrelationResponse(String metricA, String metricB, Double coefficient,
                                   int sampleSize, String interpretation) {
}
