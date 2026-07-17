package com.moodmate.auth.config;
import org.springframework.boot.context.properties.ConfigurationProperties;
// refreshExpirationDays added for Feature 4 (JWT Refresh Tokens) - deliberately much longer-lived
// than the access token (expirationMinutes) since its only job is to silently mint new access
// tokens without forcing a re-login; see AuthService.refresh()/RefreshToken entity.
@ConfigurationProperties(prefix = "moodmate.jwt")
public record JwtProperties(String secret, int expirationMinutes, int refreshExpirationDays) {}
