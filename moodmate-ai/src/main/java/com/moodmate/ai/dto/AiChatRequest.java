package com.moodmate.ai.dto;

/** Mirrors the frontend's AiChatRequest exactly (src/api/aiChat.ts). No @NotBlank on message -
 * validated in AiChatService instead, since audioBase64/imageBase64-only requests are a valid
 * SHAPE even though this service doesn't support them yet (see AiChatService's doc comment). */
public record AiChatRequest(String message, String audioBase64, String imageBase64, String audioFilename) {
}
