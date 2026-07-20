package com.moodmate.ai.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "moodmate.groq")
public record GroqProperties(String apiKey, String baseUrl, String model, int maxHistoryMessages) {
}
