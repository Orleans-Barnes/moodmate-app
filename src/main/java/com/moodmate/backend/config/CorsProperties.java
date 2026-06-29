package com.moodmate.backend.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "moodmate.cors")
public record CorsProperties(String allowedOrigins) {
}
