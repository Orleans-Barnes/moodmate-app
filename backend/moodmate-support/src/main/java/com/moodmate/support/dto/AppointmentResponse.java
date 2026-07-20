package com.moodmate.support.dto;

import com.moodmate.support.entity.AppointmentStatus;

import java.time.Instant;

public record AppointmentResponse(Long id, Long counsellorId, String counsellorName, Instant scheduledAt,
                                   AppointmentStatus status, String notes, Instant createdAt) {
}
