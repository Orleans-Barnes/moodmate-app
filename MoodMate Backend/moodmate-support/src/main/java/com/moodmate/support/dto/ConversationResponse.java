package com.moodmate.support.dto;

import java.time.Instant;

public record ConversationResponse(Long id, Long counsellorId, String counsellorName, Long peerMentorId,
                                    String peerMentorName, Instant createdAt, String lastMessagePreview,
                                    long unreadCount) {
}
