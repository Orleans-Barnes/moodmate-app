package com.moodmate.auth.security;

import com.moodmate.auth.config.JwtProperties;
import com.moodmate.auth.entity.User;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Service;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.List;

/**
 * Issues the tokens this service's own signup/login/guest endpoints hand back to clients. Token
 * *validation* happens only at the gateway (see moodmate-gateway's JwtAuthFilter) - this service
 * must sign with the exact same JWT_SECRET or the gateway will reject every token this issues.
 */
@Service
@RequiredArgsConstructor
public class JwtService {

    private static final String DEV_PLACEHOLDER = "dev-only-secret-change-me-before-deploy-32chars-min";
    private static final List<String> NON_DEV_PROFILES_THAT_MUST_NOT_USE_PLACEHOLDER =
            List.of("prod", "production", "staging");

    private final JwtProperties props;
    private final Environment environment;

    @PostConstruct
    void validateSecret() {
        byte[] keyBytes = props.secret().getBytes(StandardCharsets.UTF_8);
        if (keyBytes.length < 32) {
            throw new IllegalStateException(
                    "moodmate.jwt.secret (JWT_SECRET) must be at least 32 bytes for HS256 - "
                            + "generate one with `openssl rand -base64 48`");
        }
        boolean isDevPlaceholder = props.secret().equals(DEV_PLACEHOLDER);
        boolean runningInGuardedProfile = List.of(environment.getActiveProfiles())
                .stream().anyMatch(NON_DEV_PROFILES_THAT_MUST_NOT_USE_PLACEHOLDER::contains);
        if (isDevPlaceholder && runningInGuardedProfile) {
            throw new IllegalStateException(
                    "JWT_SECRET is still the committed dev placeholder while running under a "
                            + "prod/staging profile. Set a real secret before starting this service.");
        }
    }

    public String generateToken(User user) {
        long now = System.currentTimeMillis();
        return Jwts.builder()
                .subject(user.getEmail())
                .claim("userId", user.getId())
                .claim("role", user.getRole().name())
                .issuedAt(new Date(now))
                .expiration(new Date(now + (long) props.expirationMinutes() * 60 * 1000))
                .signWith(Keys.hmacShaKeyFor(props.secret().getBytes(StandardCharsets.UTF_8)))
                .compact();
    }
}
