package com.moodmate.gateway.filter;

import org.junit.jupiter.api.Test;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.mock.web.server.MockServerWebExchange;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;

/** Covers Feature 16's gateway-side correlation ID propagation, documented on
 * CorrelationIdGlobalFilter. Same MockServerWebExchange-direct-call pattern as
 * RateLimitFilterTest, since a GlobalFilter's filter() method is exercised the same way as a
 * per-route GatewayFilter's. */
class CorrelationIdGlobalFilterTest {

    private final CorrelationIdGlobalFilter filter = new CorrelationIdGlobalFilter();

    @Test
    void generatesACorrelationIdWhenTheClientDidNotSendOne() {
        ServerWebExchange exchange = exchangeFor(null);
        String[] seenByDownstream = new String[1];
        GatewayFilterChain chain = ex -> {
            seenByDownstream[0] = ex.getRequest().getHeaders().getFirst(CorrelationIdGlobalFilter.HEADER);
            return Mono.empty();
        };

        filter.filter(exchange, chain).block();

        assertNotNull(seenByDownstream[0], "a correlation id must be generated and forwarded downstream");
        assertEquals(seenByDownstream[0], exchange.getResponse().getHeaders().getFirst(CorrelationIdGlobalFilter.HEADER),
                "the response must echo back the same id forwarded downstream");
    }

    @Test
    void preservesAClientSuppliedCorrelationIdUnchanged() {
        ServerWebExchange exchange = exchangeFor("client-supplied-id-123");
        String[] seenByDownstream = new String[1];
        GatewayFilterChain chain = ex -> {
            seenByDownstream[0] = ex.getRequest().getHeaders().getFirst(CorrelationIdGlobalFilter.HEADER);
            return Mono.empty();
        };

        filter.filter(exchange, chain).block();

        assertEquals("client-supplied-id-123", seenByDownstream[0]);
        assertEquals("client-supplied-id-123", exchange.getResponse().getHeaders().getFirst(CorrelationIdGlobalFilter.HEADER));
    }

    @Test
    void doesNotRejectOrShortCircuitTheRequest() {
        ServerWebExchange exchange = exchangeFor(null);
        GatewayFilterChain passThrough = ex -> Mono.empty();

        filter.filter(exchange, passThrough).block();

        assertNull(exchange.getResponse().getStatusCode(), "the correlation filter must never itself set a response status");
    }

    private ServerWebExchange exchangeFor(String correlationId) {
        MockServerHttpRequest.BaseBuilder<?> builder = MockServerHttpRequest.get("/api/whatever");
        if (correlationId != null) {
            builder.header(CorrelationIdGlobalFilter.HEADER, correlationId);
        }
        return MockServerWebExchange.from(builder.build());
    }
}
