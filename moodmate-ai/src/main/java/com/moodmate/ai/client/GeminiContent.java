package com.moodmate.ai.client;

import java.util.List;

/** One turn in Gemini's "contents" array - role is "user" | "model" (Gemini's own vocabulary,
 * not "assistant"). See GeminiClient for the GroqMessage -> GeminiContent role translation. */
public record GeminiContent(String role, List<GeminiPart> parts) {
}
