package com.moodmate.backend.support.dto;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotNull;

import java.time.Instant;

public record BookAppointmentRequest(@NotNull Long counsellorId, @NotNull @Future Instant scheduledAt,
                                      String notes) {
}
