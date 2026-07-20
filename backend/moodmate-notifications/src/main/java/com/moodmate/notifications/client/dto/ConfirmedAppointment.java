package com.moodmate.notifications.client.dto;

import java.time.Instant;

/** Mirrors moodmate-support's dto.ConfirmedAppointmentResponse exactly
 * (GET /internal/support/appointments/confirmed). */
public record ConfirmedAppointment(Long id, Long userId, Instant scheduledAt) {
}
