package com.moodmate.wellness.dto;

import java.time.LocalDate;

public record SleepAnalyticsResponse(
        LocalDate periodStart,
        LocalDate periodEnd,
        int nightsLogged,
        int averageDurationMins,
        double averageQuality,
        double consistencyRate, // nightsLogged / days in period
        int bestQuality,
        int worstQuality
) {
}
