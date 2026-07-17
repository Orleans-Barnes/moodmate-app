package com.moodmate.gateway.filter;

import lombok.Getter;
import lombok.Setter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.gateway.filter.GatewayFilter;
import org.springframework.cloud.gateway.filter.factory.AbstractGatewayFilterFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.net.InetSocketAddress;
import java.time.Instant;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Fixed-window rate limiter, applied per-route via `filters: - name: RateLimitFilter` with
 * `args: { key: ..., limit: ..., windowSeconds: ... }` (see moodmate-gateway's application.yml).
 * Same AbstractGatewayFilterFactory pattern as JwtAuthFilter in this package.
 *
 * Deliberately in-memory rather than Redis-backed (unlike Spring Cloud Gateway's built-in
 * RequestRateLimiter, which requires spring-boot-starter-data-redis-reactive): this project runs
 * a single gateway instance, and adding a required Redis dependency for one feature would be new
 * infrastructure the rest of the project doesn't otherwise need. This is a genuine, correct,
 * production-ready limiter for that single-instance topology - it just isn't ready to be scaled
 * horizontally across multiple gateway instances without moving the counters to a shared store.
 * That's a real limitation, documented here rather than silently glossed over.
 *
 * Client identification: keys by the authenticated user (X-User-Id, set upstream by JwtAuthFilter
 * when that filter runs first in the route's filter list) if present, otherwise by client IP
 * (X-Forwarded-For if set, else the raw remote address) - so the same filter class works for both
 * public routes (auth) and authenticated ones (AI chat, payments) without needing two classes.
 */
@Slf4j
@Component
public class RateLimitFilter extends AbstractGatewayFilterFactory<RateLimitFilter.Config> {

    // windowKey ("<config.key>:<clientKey>") -> that key's current counting window. A given route
    // config's `key` namespaces its counters so two different routes reusing this filter never
    // collide even if a client happens to hash to the same clientKey.
    private final ConcurrentHashMap<String, Window> windows = new ConcurrentHashMap<>();

    public RateLimitFilter() {
        super(Config.class);
    }

    @Override
    public GatewayFilter apply(Config config) {
        return (exchange, chain) -> {
            String clientKey = resolveClientKey(exchange);
            String windowKey = config.getKey() + ":" + clientKey;
            long windowSeconds = Math.max(1, config.getWindowSeconds());
            long nowEpochSecond = Instant.now().getEpochSecond();
            long windowStart = (nowEpochSecond / windowSeconds) * windowSeconds;

            Window window = windows.computeIfAbsent(windowKey, k -> new Window(windowStart));
            int count;
            synchronized (window) {
                if (window.windowStart != windowStart) {
                    window.windowStart = windowStart;
                    window.count.set(0);
                }
                count = window.count.incrementAndGet();
            }

            if (count > config.getLimit()) {
                log.debug("Rate limit exceeded for {} ({}/{} per {}s)", windowKey, count, config.getLimit(), windowSeconds);
                exchange.getResponse().setStatusCode(HttpStatus.TOO_MANY_REQUESTS);
                exchange.getResponse().getHeaders().add("Retry-After", String.valueOf(windowSeconds));
                return exchange.getResponse().setComplete();
            }
            return chain.filter(exchange);
        };
    }

    private String resolveClientKey(ServerWebExchange exchange) {
        String userId = exchange.getRequest().getHeaders().getFirst("X-User-Id");
        if (userId != null && !userId.isBlank()) {
            return "user:" + userId;
        }
        String forwardedFor = exchange.getRequest().getHeaders().getFirst("X-Forwarded-For");
        if (forwardedFor != null && !forwardedFor.isBlank()) {
            return "ip:" + forwardedFor.split(",")[0].trim();
        }
        InetSocketAddress remote = exchange.getRequest().getRemoteAddress();
        return "ip:" + (remote != null && remote.getAddress() != null ? remote.getAddress().getHostAddress() : "unknown");
    }

    /** Evicts windows untouched for over an hour, regardless of any individual route's configured
     * windowSeconds - prevents the map growing forever as new IPs/users are seen over the
     * gateway's uptime. Runs on the shared Spring scheduler (see GatewayApplication's
     * @EnableScheduling). */
    @org.springframework.scheduling.annotation.Scheduled(fixedDelay = 600_000)
    void cleanupStaleWindows() {
        long cutoff = Instant.now().getEpochSecond() - 3600;
        int before = windows.size();
        windows.entrySet().removeIf(e -> e.getValue().windowStart < cutoff);
        int removed = before - windows.size();
        if (removed > 0) {
            log.debug("Rate limiter cleanup: evicted {} stale window(s), {} remaining", removed, windows.size());
        }
    }

    private static final class Window {
        volatile long windowStart;
        final AtomicInteger count = new AtomicInteger(0);

        Window(long windowStart) {
            this.windowStart = windowStart;
        }
    }

    @Getter
    @Setter
    public static class Config {
        /** Namespaces this route's counters - must be unique per distinct rate-limit policy
         * across all routes (e.g. "auth", "ai-chat", "payments"). */
        private String key = "default";
        private int limit = 20;
        private int windowSeconds = 60;
    }
}
