package com.moodmate.support.dto;

import com.moodmate.support.entity.AppointmentStatus;

import java.time.Instant;

/** A counsellor's view of one of their own appointments - shows who booked it, unlike the
 * student-facing AppointmentResponse which shows the counsellor's name instead. */
public record CounsellorAppointmentView(Long id, Long userId, String studentName, Instant scheduledAt,
                                         AppointmentStatus status, String notes, Instant createdAt) {
}
