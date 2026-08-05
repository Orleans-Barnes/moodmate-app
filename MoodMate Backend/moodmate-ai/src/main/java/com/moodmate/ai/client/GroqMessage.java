package com.moodmate.ai.client;

/** One message in Groq's OpenAI-compatible chat completions request/response - role is
 * "system" | "user" | "assistant". */
public record GroqMessage(String role, String content) {
}
