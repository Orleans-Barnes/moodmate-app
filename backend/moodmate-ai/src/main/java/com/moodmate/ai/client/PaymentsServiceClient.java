package com.moodmate.ai.client;

import com.moodmate.ai.config.ServiceClientsProperties;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

/**
 * Direct (non-gateway) service-to-service call to moodmate-wallet's internal subscription-status
 * endpoint - added for Premium Enforcement. Deliberately fails "closed" (treats the user as
 * free-tier) rather than "open" (unlimited access) if wallet-service is unreachable: a transient
 * wallet outage should degrade to the free-tier cap, not silently grant everyone unlimited Pro
 * access. This is a documented trade-off, not an oversight - see AiChatService.sendMessage().
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class PaymentsServiceClient {

    private final ServiceClientsProperties properties;

    /**
     * Feature 15 (Production Hardening) - Circuit Breaker. See moodmate-journal's identical
     * client for the full doc comment on why the try/catch was replaced with a propagating call +
     * fallback method - the short version: a caught exception never registers as a failure with
     * resilience4j's AOP proxy, so the breaker would never trip and every request during an outage
     * would keep paying the full read timeout instead of failing fast. This method is called on
     * every single AI chat message, so that matters here more than almost anywhere else.
     */
    @CircuitBreaker(name = "walletService", fallbackMethod = "isProFallback")
    public boolean isPro(Long userId) {
        SubscriptionSummary summary = restClient().get()
                .uri("/internal/payments/subscription/{userId}", userId)
                .retrieve()
                .body(SubscriptionSummary.class);
        return summary != null && summary.pro();
    }

    private boolean isProFallback(Long userId, Throwable t) {
        log.warn("Could not reach wallet-service to check subscription for user {} - treating as free-tier: {}",
                userId, t.getMessage());
        return false;
    }

    // Feature 15 (Production Hardening) - Timeout Handling. See moodmate-crisis's
    // AuthServiceClient for the same fix's full doc comment.
    private static final int CONNECT_TIMEOUT_MS = 3000;
    private static final int READ_TIMEOUT_MS = 5000;

    private RestClient restClient() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(CONNECT_TIMEOUT_MS);
        factory.setReadTimeout(READ_TIMEOUT_MS);
        return RestClient.builder().baseUrl(properties.walletBaseUrl()).requestFactory(factory).build();
    }
}
