package com.moodmate.wellness.dto;

import java.time.LocalDate;

/** Mirrors SleepTrackerScreen.tsx's SleepLogView exactly. */
public record SleepLogResponse(
        Long id,
        LocalDate logDate,
        String bedtime,
        String wakeTime,
        int durationMins,
        int quality,
        String notes
) {
}
