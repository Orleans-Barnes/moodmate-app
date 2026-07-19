package com.moodmate.ai.client;

import java.util.List;

/** Minimal shape of Gemini's generateContent response - only the fields this service actually
 * reads. Unknown fields (safetyRatings, usageMetadata, etc.) are ignored by default, same as
 * GroqChatResponse's approach. */
public record GeminiResponse(List<Candidate> candidates) {
    public record Candidate(GeminiContent content) {
    }
}
