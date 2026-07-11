package com.moodmate.backend.support.dto;

import java.time.Instant;

/** A counsellor's view of one of their own conversations - shows the student's name. */
public record CounsellorConversationView(Long id, Long userId, String studentName, Instant createdAt,
                                          String lastMessagePreview, Instant lastMessageAt, long unreadCount) {
}
