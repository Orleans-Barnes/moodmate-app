package com.moodmate.backend.support.dto;

import java.time.Instant;

public record ConversationResponse(Long id, Long counsellorId, String counsellorName, Long peerMentorId,
                                    String peerMentorName, Instant createdAt, String lastMessagePreview,
                                    Instant lastMessageAt, long unreadCount) {
}
