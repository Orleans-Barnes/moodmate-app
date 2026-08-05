package com.moodmate.gateway.filter;

import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.time.Instant;
import java.util.UUID;

/**
 * Feature 16 (Observability) - Part 1, Correlation IDs.
 *
 * Unlike JwtAuthFilter/RateLimitFilter (both AbstractGatewayFilterFactory - opt-in per route via
 * `filters:` in application.yml), this is a GlobalFilter: Spring Cloud Gateway runs it on every
 * route automatically, with no per-route wiring needed. That's deliberate - every request through
 * this gateway, public or authenticated, should carry a correlation ID end to end.
 *
 * Ordered.HIGHEST_PRECEDENCE so this runs before JwtAuthFilter/RateLimitFilter's route-level
 * filters - the correlation ID should exist (and be loggable) even for a request that gets
 * rejected by those, e.g. a 401 or 429.
 *
 * Behavior:
 *  - Client-supplied X-Correlation-Id is preserved and forwarded unchanged (lets a caller that
 *    already has its own trace context - e.g. another backend, or a test harness - stay
 *    correlated end to end).
 *  - Otherwise a new UUID is generated here, so every request has one downstream service filters
 *    (CorrelationIdFilter, one per service) can rely on the header always being present when it
 *    arrived via this gateway.
 *  - Echoed back on the response so the caller can log/report it too.
 *  - This class does not itself write to MDC: the gateway is a reactive (WebFlux) app, where a
 *    single request's processing hops across multiple Netty event-loop threads, so a plain
 *    ThreadLocal-based MDC entry set here would not reliably show up in log lines emitted later in
 *    the same request's processing on a different thread. Reactor's Context (not MDC) is the
 *    correct propagation mechanism for that, but adding full Reactor-Context-to-MDC logging bridge
 *    wiring is a bigger, separate change than this gateway's current logging needs - the gateway
 *    logs very little today (see application.yml: org.springframework.cloud.gateway: WARN). What
 *    this filter does instead is log start/completion of every request as a single line each,
 *    with the correlation ID included directly in the message (not via MDC), which is accurate on
 *    any thread and needs no additional propagation machinery.
 */
@Slf4j
@Component
public class CorrelationIdGlobalFilter implements GlobalFilter, Ordered {

    public static final String HEADER = "X-Correlation-Id";

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        String correlationId = exchange.getRequest().getHeaders().getFirst(HEADER);
        if (correlationId == null || correlationId.isBlank()) {
            correlationId = UUID.randomUUID().toString();
        }
        final String finalCorrelationId = correlationId;

        ServerHttpRequest mutatedRequest = exchange.getRequest().mutate()
                .header(HEADER, finalCorrelationId)
                .build();
        exchange.getResponse().getHeaders().set(HEADER, finalCorrelationId);

        String method = exchange.getRequest().getMethod().name();
        String path = exchange.getRequest().getURI().getRawPath();
        Instant start = Instant.now();
        log.info("[{}] --> {} {}", finalCorrelationId, method, path);

        ServerWebExchange mutatedExchange = exchange.mutate().request(mutatedRequest).build();
        return chain.filter(mutatedExchange)
                .doOnSuccess(v -> logCompletion(finalCorrelationId, method, path, exchange, start))
                .doOnError(e -> logCompletion(finalCorrelationId, method, path, exchange, start));
    }

    private void logCompletion(String correlationId, String method, String path, ServerWebExchange exchange, Instant start) {
        long durationMs = Duration.between(start, Instant.now()).toMillis();
        Integer status = exchange.getResponse().getStatusCode() != null
                ? exchange.getResponse().getStatusCode().value() : null;
        log.info("[{}] <-- {} {} completed {} in {} ms", correlationId, method, path, status, durationMs);
    }

    @Override
    public int getOrder() {
        return Ordered.HIGHEST_PRECEDENCE;
    }
}
