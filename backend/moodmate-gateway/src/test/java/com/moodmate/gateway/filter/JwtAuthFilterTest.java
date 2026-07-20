package com.moodmate.gateway.filter;

import com.moodmate.gateway.config.JwtProperties;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.Test;
import org.springframework.cloud.gateway.filter.GatewayFilter;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.http.HttpStatus;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.mock.web.server.MockServerWebExchange;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

/**
 * Feature 17 (Integration Testing) - Part "Authentication" + "Gateway". JwtAuthFilter had zero
 * test coverage before this - it's the single point where every authenticated request in this
 * whole platform gets validated (see its own doc comment: "JWT validation happens ONLY here at
 * the gateway"), and its doc comment already documents one real bug this exact untested state let
 * through in the past (the double-constructor / always-null jwtProperties bug). Same
 * MockServerWebExchange-direct-call pattern as RateLimitFilterTest/CorrelationIdGlobalFilterTest.
 */
class JwtAuthFilterTest {

    private static final String SECRET = "test-only-secret-at-least-32-characters-long-for-hs256";
    private static final GatewayFilterChain PASS_THROUGH = exchange -> Mono.empty();

    private final JwtAuthFilter filter = new JwtAuthFilter(new JwtProperties(SECRET));
    private final GatewayFilter gatewayFilter = filter.apply(new JwtAuthFilter.Config());

    @Test
    void aValidTokenSetsXUserIdAndXUserRoleHeadersAndForwardsTheRequest() {
        String token = validToken(42L, "STUDENT");
        String[] seenUserId = new String[1];
        String[] seenRole = new String[1];
        GatewayFilterChain chain = exchange -> {
            seenUserId[0] = exchange.getRequest().getHeaders().getFirst("X-User-Id");
            seenRole[0] = exchange.getRequest().getHeaders().getFirst("X-User-Role");
            return Mono.empty();
        };

        ServerWebExchange exchange = exchangeWithAuth("Bearer " + token);
        filter.apply(new JwtAuthFilter.Config()).filter(exchange, chain).block();

        assertEquals("42", seenUserId[0]);
        assertEquals("STUDENT", seenRole[0]);
        assertNull(exchange.getResponse().getStatusCode(), "a valid token must not be rejected");
    }

    @Test
    void missingAuthorizationHeaderIsRejectedWith401() {
        ServerWebExchange exchange = MockServerWebExchange.from(MockServerHttpRequest.get("/api/wellness/state").build());

        gatewayFilter.filter(exchange, PASS_THROUGH).block();

        assertEquals(HttpStatus.UNAUTHORIZED, exchange.getResponse().getStatusCode());
    }

    @Test
    void malformedAuthorizationHeaderIsRejectedWith401() {
        ServerWebExchange exchange = exchangeWithAuth("NotBearer sometoken");

        gatewayFilter.filter(exchange, PASS_THROUGH).block();

        assertEquals(HttpStatus.UNAUTHORIZED, exchange.getResponse().getStatusCode());
    }

    @Test
    void anInvalidlySignedTokenIsRejectedWith401() {
        SecretKey wrongKey = Keys.hmacShaKeyFor("a-completely-different-32-char-plus-secret-key".getBytes(StandardCharsets.UTF_8));
        String tokenSignedWithWrongKey = Jwts.builder()
                .claim("userId", 1L)
                .claim("role", "STUDENT")
                .issuedAt(Date.from(Instant.now()))
                .expiration(Date.from(Instant.now().plusSeconds(3600)))
                .signWith(wrongKey)
                .compact();

        ServerWebExchange exchange = exchangeWithAuth("Bearer " + tokenSignedWithWrongKey);

        gatewayFilter.filter(exchange, PASS_THROUGH).block();

        assertEquals(HttpStatus.UNAUTHORIZED, exchange.getResponse().getStatusCode());
    }

    @Test
    void anExpiredTokenIsRejectedWith401() {
        SecretKey key = Keys.hmacShaKeyFor(SECRET.getBytes(StandardCharsets.UTF_8));
        String expiredToken = Jwts.builder()
                .claim("userId", 1L)
                .claim("role", "STUDENT")
                .issuedAt(Date.from(Instant.now().minusSeconds(7200)))
                .expiration(Date.from(Instant.now().minusSeconds(3600)))
                .signWith(key)
                .compact();

        ServerWebExchange exchange = exchangeWithAuth("Bearer " + expiredToken);

        gatewayFilter.filter(exchange, PASS_THROUGH).block();

        assertEquals(HttpStatus.UNAUTHORIZED, exchange.getResponse().getStatusCode());
    }

    @Test
    void aTokenMissingRequiredClaimsIsRejectedWith401() {
        SecretKey key = Keys.hmacShaKeyFor(SECRET.getBytes(StandardCharsets.UTF_8));
        // No "role" claim - JwtAuthFilter requires both userId and role to be present.
        String tokenMissingRole = Jwts.builder()
                .claim("userId", 1L)
                .issuedAt(Date.from(Instant.now()))
                .expiration(Date.from(Instant.now().plusSeconds(3600)))
                .signWith(key)
                .compact();

        ServerWebExchange exchange = exchangeWithAuth("Bearer " + tokenMissingRole);

        gatewayFilter.filter(exchange, PASS_THROUGH).block();

        assertEquals(HttpStatus.UNAUTHORIZED, exchange.getResponse().getStatusCode());
    }

    private String validToken(long userId, String role) {
        SecretKey key = Keys.hmacShaKeyFor(SECRET.getBytes(StandardCharsets.UTF_8));
        return Jwts.builder()
                .claim("userId", userId)
                .claim("role", role)
                .issuedAt(Date.from(Instant.now()))
                .expiration(Date.from(Instant.now().plusSeconds(3600)))
                .signWith(key)
                .compact();
    }

    private ServerWebExchange exchangeWithAuth(String authorizationHeaderValue) {
        MockServerHttpRequest request = MockServerHttpRequest.get("/api/wellness/state")
                .header("Authorization", authorizationHeaderValue)
                .build();
        return MockServerWebExchange.from(request);
    }
}
