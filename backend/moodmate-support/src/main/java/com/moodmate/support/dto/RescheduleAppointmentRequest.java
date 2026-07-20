package com.moodmate.support.dto;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotNull;

import java.time.Instant;

public record RescheduleAppointmentRequest(@NotNull @Future Instant scheduledAt) {
}
