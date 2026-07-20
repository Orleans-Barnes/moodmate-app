package com.moodmate.mood.dto;

import java.time.LocalDate;
import java.util.List;

/** Backs both the weekly and monthly trend endpoints (Feature 8) - same shape, different `days`
 * window supplied by the controller. Days with zero checkins are simply absent from `days` (see
 * AnalyticsEngine.aggregateByDay's doc comment). */
public record MoodTrendResponse(LocalDate periodStart, LocalDate periodEnd, List<DailyMoodStatResponse> days) {
}
