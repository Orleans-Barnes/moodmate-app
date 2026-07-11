package com.moodmate.backend.ai.dto;

import java.time.Instant;

/** Reply from POST /api/ai/chat. */
public record AiChatResponse(
        Long   assistantMessageId,
        String reply,
        String transcribedText,   // non-null only when audio was submitted
        Instant createdAt
) {}
