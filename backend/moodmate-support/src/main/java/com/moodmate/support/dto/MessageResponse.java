package com.moodmate.support.dto;

import com.moodmate.support.entity.SenderType;

import java.time.Instant;

public record MessageResponse(Long id, Long conversationId, SenderType senderType, String body, Instant createdAt,
                               Instant readAt) {
}
