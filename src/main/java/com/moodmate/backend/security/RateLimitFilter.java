package com.moodmate.backend.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.lang.NonNull;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Simple in-memory IP-based rate limiter for sensitive auth endpoints.
 *
 * Limits each IP to MAX_REQUESTS per WINDOW_SECONDS on:
 *   POST /api/auth/login
 *   POST /api/auth/signup
 *   POST /api/auth/forgot-password
 *   POST /api/auth/reset-password
 *
 * Uses a sliding-window counter keyed by (ip + path). Stale buckets are evicted
 * lazily when they fall outside the window, keeping memory bounded without a
 * background thread. This is not cluster-safe — for multi-instance production
 * deployments, replace with Redis-backed rate limiting (e.g. bucket4j + Redis).
 */
public class RateLimitFilter extends OncePerRequestFilter {

    private static final int MAX_REQUESTS = 10;       // per window per IP per endpoint
    private static final long WINDOW_SECONDS = 60;    // 1-minute sliding window

    private static final String[] RATE_LIMITED_PATHS = {
            "/api/auth/login",
            "/api/auth/signup",
            "/api/auth/forgot-password",
            "/api/auth/reset-password"
    };

    private final Map<String, long[]> buckets = new ConcurrentHashMap<>();

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain filterChain) throws ServletException, IOException {

        String path = request.getRequestURI();
        if (!isRateLimited(path)) {
            filterChain.doFilter(request, response);
            return;
        }

        String ip = extractIp(request);
        String key = ip + ":" + path;
        long now = Instant.now().getEpochSecond();
        long windowStart = now - WINDOW_SECONDS;

        // Get or create bucket: long[]{windowStart, count}
        long[] bucket = buckets.compute(key, (k, existing) -> {
            if (existing == null || existing[0] < windowStart) {
                return new long[]{now, 1};
            }
            existing[1]++;
            return existing;
        });

        if (bucket[1] > MAX_REQUESTS) {
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setContentType("application/json");
            response.getWriter().write(
                "{\"status\":429,\"error\":\"Too Many Requests\"," +
                "\"message\":\"Too many attempts — please wait a minute and try again\"}"
            );
            return;
        }

        filterChain.doFilter(request, response);
    }

    private boolean isRateLimited(String path) {
        for (String limited : RATE_LIMITED_PATHS) {
            if (path.equals(limited)) return true;
        }
        return false;
    }

    private String extractIp(HttpServletRequest request) {
        // Respect X-Forwarded-For from Render's load balancer
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
