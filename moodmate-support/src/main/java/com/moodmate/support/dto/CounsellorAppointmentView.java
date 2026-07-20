package com.moodmate.support.dto;

import com.moodmate.support.entity.AppointmentStatus;

import java.time.Instant;

/** A counsellor's view of one of their own appointments - shows who booked it, unlike the
 * student-facing AppointmentResponse which shows the counsellor's name instead. priority added for
 * Premium gating breadth (Milestone item 7) - lets the counsellor's UI show a badge on requests
 * from Pro students, who SupportService.listCounsellorAppointments already sorts to the top. */
public record CounsellorAppointmentView(Long id, Long userId, String studentName, Instant scheduledAt,
                                         AppointmentStatus status, String notes, Instant createdAt,
                                         boolean priority) {
}
