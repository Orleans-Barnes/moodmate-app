package com.moodmate.backend.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "moodmate.jwt")
public record JwtProperties(String secret, long expirationMinutes) {
}
