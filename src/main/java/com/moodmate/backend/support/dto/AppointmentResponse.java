package com.moodmate.backend.support.dto;

import com.moodmate.backend.support.AppointmentStatus;

import java.time.Instant;

public record AppointmentResponse(Long id, Long counsellorId, String counsellorName, Instant scheduledAt,
                                   AppointmentStatus status, String notes, Instant createdAt) {
}
