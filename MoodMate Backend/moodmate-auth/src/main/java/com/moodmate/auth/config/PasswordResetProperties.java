package com.moodmate.auth.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/** Binds moodmate.password-reset.* from application.yml. */
@ConfigurationProperties(prefix = "moodmate.password-reset")
public record PasswordResetProperties(int otpExpiryMinutes, String fromAddress) {}
