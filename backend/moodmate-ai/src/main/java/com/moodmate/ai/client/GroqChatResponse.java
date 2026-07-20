package com.moodmate.ai.client;

import java.util.List;

/** Minimal shape of Groq's OpenAI-compatible chat completions response - only the fields this
 * service actually reads. Unknown fields are ignored by default (no @JsonIgnoreProperties needed
 * since Spring's default Jackson ObjectMapper is configured non-strict by Boot's autoconfiguration). */
public record GroqChatResponse(List<Choice> choices) {
    public record Choice(GroqMessage message) {
    }
}
