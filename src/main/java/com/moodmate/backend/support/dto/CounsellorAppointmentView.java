package com.moodmate.backend.support.dto;

import com.moodmate.backend.support.AppointmentStatus;

import java.time.Instant;

/** A counsellor's view of one of their own appointments - shows who booked it, unlike the
 * student-facing AppointmentResponse which shows the counsellor's name instead. */
public record CounsellorAppointmentView(Long id, Long userId, String studentName, Instant scheduledAt,
                                         AppointmentStatus status, String notes, Instant createdAt) {
}
