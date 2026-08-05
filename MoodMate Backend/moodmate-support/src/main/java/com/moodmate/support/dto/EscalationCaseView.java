package com.moodmate.support.dto;

public record EscalationCaseView(
        Long id,
        Long mentorUserId,
        String mentorName,
        String studentName,
        String concern,
        String urgency,
        String status,
        String feedback,
        String reviewerName,
        String createdAt,
        String reviewedAt
) {}
