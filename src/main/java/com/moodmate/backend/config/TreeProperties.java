package com.moodmate.backend.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "moodmate.tree")
public record TreeProperties(int xpMax) {
}
