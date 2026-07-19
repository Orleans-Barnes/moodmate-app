package com.moodmate.support.dto;

import com.moodmate.support.entity.MentorRequestStatus;

import java.time.Instant;

/** Mentor-side view of a request sent to them. */
public record MentorRequestView(Long id, Long userId, String studentName, MentorRequestStatus status,
                                 String message, Instant createdAt, Instant respondedAt) {
}
