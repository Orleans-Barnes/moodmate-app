package com.moodmate.backend.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "moodmate.paystack")
public record PaystackProperties(String baseUrl, String secretKey, String publicKey, String callbackUrl) {
}
