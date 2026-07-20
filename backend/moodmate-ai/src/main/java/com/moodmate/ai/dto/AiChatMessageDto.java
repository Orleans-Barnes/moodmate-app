package com.moodmate.ai.dto;

import java.time.Instant;

/** Mirrors the frontend's AiChatMessageDto exactly (src/api/aiChat.ts) - role/messageType are
 * lowercase strings ("user"/"assistant", "text"/"audio"/"image"), NOT the uppercase Java enum
 * names, so this is a plain String field with the lowercasing done in AiChatService.toDto()
 * rather than relying on Jackson's default enum serialization (which would produce "USER" and
 * break the frontend's TypeScript union type matching). */
public record AiChatMessageDto(Long id, String role, String content, String messageType, Instant createdAt) {
}
