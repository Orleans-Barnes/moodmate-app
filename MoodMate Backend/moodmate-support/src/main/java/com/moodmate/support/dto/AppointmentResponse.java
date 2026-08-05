package com.moodmate.support.dto;

import com.moodmate.support.entity.AppointmentStatus;

import java.time.Instant;

// Fix #5 - rated tells the student-facing UI whether to show "Rate this session" (only meaningful
// once status is COMPLETED; false for every other status).
// Premium gating breadth (Milestone item 7) - priority lets the student see their own booking got
// the Pro perk (a small "Priority" badge), matching Appointment.priority's doc comment.
public record AppointmentResponse(Long id, Long counsellorId, String counsellorName, Instant scheduledAt,
                                   AppointmentStatus status, String notes, Instant createdAt, boolean rated,
                                   boolean priority) {
}
