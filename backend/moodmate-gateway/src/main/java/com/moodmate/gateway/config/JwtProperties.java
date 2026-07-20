package com.moodmate.gateway.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "moodmate.jwt")
public record JwtProperties(String secret) {}
