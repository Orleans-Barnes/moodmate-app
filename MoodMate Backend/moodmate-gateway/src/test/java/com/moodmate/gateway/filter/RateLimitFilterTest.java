package com.moodmate.gateway.filter;

import org.junit.jupiter.api.Test;
import org.springframework.cloud.gateway.filter.GatewayFilter;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.http.HttpStatus;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.mock.web.server.MockServerWebExchange;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

/** Covers Feature 5's fixed-window rate limiter, documented on RateLimitFilter. Exercises
 * apply()/the returned GatewayFilter directly rather than spinning up a full gateway context. */
class RateLimitFilterTest {

    private static final GatewayFilterChain PASS_THROUGH = exchange -> Mono.empty();

    @Test
    void allowsRequestsUpToTheLimit() {
        GatewayFilter gatewayFilter = newFilter("test-allow", 3, 60);

        for (int i = 0; i < 3; i++) {
            ServerWebExchange exchange = exchangeFor("user-1");
            gatewayFilter.filter(exchange, PASS_THROUGH).block();
            assertNull(exchange.getResponse().getStatusCode(), "request " + (i + 1) + " should not be rejected");
        }
    }

    @Test
    void rejectsRequestsOverTheLimitWithinTheSameWindow() {
        GatewayFilter gatewayFilter = newFilter("test-reject", 2, 60);

        gatewayFilter.filter(exchangeFor("user-2"), PASS_THROUGH).block();
        gatewayFilter.filter(exchangeFor("user-2"), PASS_THROUGH).block();
        ServerWebExchange third = exchangeFor("user-2");
        gatewayFilter.filter(third, PASS_THROUGH).block();

        assertEquals(HttpStatus.TOO_MANY_REQUESTS, third.getResponse().getStatusCode());
    }

    @Test
    void differentUsersHaveIndependentLimits() {
        GatewayFilter gatewayFilter = newFilter("test-independent", 1, 60);

        ServerWebExchange userAFirst = exchangeFor("user-a");
        gatewayFilter.filter(userAFirst, PASS_THROUGH).block();
        assertNull(userAFirst.getResponse().getStatusCode());

        ServerWebExchange userBFirst = exchangeFor("user-b");
        gatewayFilter.filter(userBFirst, PASS_THROUGH).block();
        assertNull(userBFirst.getResponse().getStatusCode(), "a different user must not be affected by user-a's usage");
    }

    @Test
    void differentRouteKeysHaveIndependentCountersEvenForTheSameClient() {
        RateLimitFilter filter = new RateLimitFilter();
        GatewayFilter routeOne = filter.apply(configOf("route-one", 1, 60));
        GatewayFilter routeTwo = filter.apply(configOf("route-two", 1, 60));

        routeOne.filter(exchangeFor("shared-user"), PASS_THROUGH).block();
        ServerWebExchange routeTwoFirstCall = exchangeFor("shared-user");
        routeTwo.filter(routeTwoFirstCall, PASS_THROUGH).block();

        assertNull(routeTwoFirstCall.getResponse().getStatusCode(),
                "a different route's counter must be independent even for the same client");
    }

    private GatewayFilter newFilter(String key, int limit, int windowSeconds) {
        return new RateLimitFilter().apply(configOf(key, limit, windowSeconds));
    }

    private RateLimitFilter.Config configOf(String key, int limit, int windowSeconds) {
        RateLimitFilter.Config config = new RateLimitFilter.Config();
        config.setKey(key);
        config.setLimit(limit);
        config.setWindowSeconds(windowSeconds);
        return config;
    }

    private ServerWebExchange exchangeFor(String userId) {
        MockServerHttpRequest request = MockServerHttpRequest.get("/api/whatever")
                .header("X-User-Id", userId)
                .build();
        return MockServerWebExchange.from(request);
    }
}
