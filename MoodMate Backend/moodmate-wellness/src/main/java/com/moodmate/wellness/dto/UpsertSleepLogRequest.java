package com.moodmate.wellness.dto;

import jakarta.validation.constraints.*;

import java.time.LocalDate;

public record UpsertSleepLogRequest(
        @NotNull LocalDate logDate,
        @NotBlank @Pattern(regexp = "^\\d{2}:\\d{2}$", message = "must be HH:MM") String bedtime,
        @NotBlank @Pattern(regexp = "^\\d{2}:\\d{2}$", message = "must be HH:MM") String wakeTime,
        @Min(1) @Max(1440) int durationMins,
        @Min(1) @Max(5) int quality,
        @Size(max = 500) String notes
) {
}
