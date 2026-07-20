package com.moodmate.support.dto;

import com.moodmate.support.entity.MentorRequestStatus;

import java.time.Instant;

/** Student-side view of one of their own mentor requests. conversationId is non-null only once
 * ACCEPTED (resolved from the conversation SupportService.acceptMentorRequest creates/reuses) -
 * lets the frontend jump straight to Chat without a separate "find my conversation" lookup. */
public record MentorRequestResponse(Long id, Long peerMentorId, String mentorName, MentorRequestStatus status,
                                     String message, Long conversationId, Instant createdAt, Instant respondedAt) {
}
