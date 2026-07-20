package com.moodmate.ai.dto;

import java.time.Instant;

/** Mirrors the frontend's AiChatResponse exactly (src/api/aiChat.ts). transcribedText is always
 * null for now - see AiChatService's doc comment on why audio input isn't supported yet. */
public record AiChatResponse(Long assistantMessageId, String reply, String transcribedText, Instant createdAt) {
}
