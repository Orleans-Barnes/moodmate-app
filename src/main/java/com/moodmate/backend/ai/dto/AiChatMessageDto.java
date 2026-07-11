package com.moodmate.backend.ai.dto;

import com.moodmate.backend.ai.AiChatMessage;

import java.time.Instant;

/** Read-only view of a single chat message for GET /api/ai/chat/history. */
public record AiChatMessageDto(
        Long    id,
        String  role,
        String  content,
        String  messageType,
        Instant createdAt
) {
    public static AiChatMessageDto from(AiChatMessage m) {
        return new AiChatMessageDto(m.getId(), m.getRole(), m.getContent(),
                                    m.getMessageType(), m.getCreatedAt());
    }
}
