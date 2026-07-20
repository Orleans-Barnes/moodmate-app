package com.moodmate.gateway.filter;

import com.moodmate.gateway.config.JwtProperties;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.gateway.filter.GatewayFilter;
import org.springframework.cloud.gateway.filter.factory.AbstractGatewayFilterFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.nio.charset.StandardCharsets;

/**
 * JWT validation happens ONLY here at the gateway.
 * On success, X-User-Id and X-User-Role headers are added so
 * downstream services never need to re-validate the token.
 *
 * IMPORTANT: this must have exactly one constructor. It previously had a Lombok-generated
 * all-args constructor AND a hand-written no-arg constructor that set jwtProperties to null -
 * with two constructors and no @Autowired to disambiguate, Spring picked the no-arg one, so
 * jwtProperties was always null and every request 500'd with a NullPointerException. Fixed by
 * hand-writing the single constructor Spring should use, which also correctly calls
 * super(Config.class) (a Lombok-generated constructor would not).
 */
@Slf4j
@Component
public class JwtAuthFilter extends AbstractGatewayFilterFactory<JwtAuthFilter.Config> {

    private final JwtProperties jwtProperties;

    public JwtAuthFilter(JwtProperties jwtProperties) {
        super(Config.class);
        this.jwtProperties = jwtProperties;
    }

    @Override
    public GatewayFilter apply(Config config) {
        return (exchange, chain) -> {
            String authHeader = exchange.getRequest().getHeaders().getFirst("Authorization");
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                return unauthorized(exchange, "Missing or malformed Authorization header");
            }

            String token = authHeader.substring(7);
            try {
                Claims claims = Jwts.parser()
                        .verifyWith(Keys.hmacShaKeyFor(
                                jwtProperties.secret().getBytes(StandardCharsets.UTF_8)))
                        .build()
                        .parseSignedClaims(token)
                        .getPayload();

                Long userId = claims.get("userId", Long.class);
                String role  = claims.get("role",   String.class);

                if (userId == null || role == null) {
                    return unauthorized(exchange, "Token missing required claims");
                }

                ServerHttpRequest mutated = exchange.getRequest().mutate()
                        .header("X-User-Id",   String.valueOf(userId))
                        .header("X-User-Role", role)
                        .build();

                return chain.filter(exchange.mutate().request(mutated).build());

            } catch (JwtException e) {
                log.debug("JWT validation failed: {}", e.getMessage());
                return unauthorized(exchange, "Invalid or expired token");
            }
        };
    }

    private Mono<Void> unauthorized(ServerWebExchange exchange, String reason) {
        log.debug("Rejecting request: {}", reason);
        exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
        return exchange.getResponse().setComplete();
    }

    public static class Config {}
}
