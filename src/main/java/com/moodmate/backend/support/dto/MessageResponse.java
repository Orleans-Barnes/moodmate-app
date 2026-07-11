package com.moodmate.backend.support.dto;

import com.moodmate.backend.support.SenderType;

import java.time.Instant;

public record MessageResponse(Long id, Long conversationId, SenderType senderType, String body, Instant createdAt,
                               Instant readAt) {
}
