package com.moodmate.ai.dto;

/** Mirrors the frontend's AiChatRequest (src/api/aiChat.ts) plus one backend-only addition:
 * preferredModel ("groq" | "gemini", nullable). No @NotBlank on message - validated in
 * AiChatService instead, since audioBase64/imageBase64-only requests are a valid SHAPE even though
 * this service doesn't support them yet (see AiChatService's doc comment).
 *
 * preferredModel is additive and backward-compatible: the current frontend doesn't send it yet
 * (no model-picker UI built), so it deserializes as null on every existing request, which
 * AiChatService/AiModelRouter treat as "use the default Groq-first automatic-failover order" -
 * identical behavior to before this field existed. Only honored server-side for Pro users (see
 * AiChatService.sendMessage) - a free-tier client sending this field has no effect. */
public record AiChatRequest(String message, String audioBase64, String imageBase64, String audioFilename,
                             String preferredModel) {
}
