package com.moodmate.ai.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/** Secondary/fallback model config, mirroring GroqProperties. See GeminiClient for why base-url
 * has no trailing model path segment (the model name is part of the per-call URI, not the base). */
@ConfigurationProperties(prefix = "moodmate.gemini")
public record GeminiProperties(String apiKey, String baseUrl, String model) {
}
