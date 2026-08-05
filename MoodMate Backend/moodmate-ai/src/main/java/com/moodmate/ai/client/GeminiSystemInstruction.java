package com.moodmate.ai.client;

import java.util.List;

/** Gemini has no in-list "system" role (unlike Groq/OpenAI-style APIs) - the system prompt is a
 * separate top-level field on the request instead of a message with role="system". */
public record GeminiSystemInstruction(List<GeminiPart> parts) {
}
