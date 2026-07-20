package com.moodmate.journal.client;

import com.moodmate.journal.config.ServiceClientsProperties;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

/** Direct (non-gateway) service-to-service call to moodmate-wallet's internal subscription-status
 * endpoint - added for Premium Enforcement. Fails "closed" (free-tier) on a wallet-service outage
 * rather than "open" (unlimited) - same documented trade-off as moodmate-ai's identical client. */
@Slf4j
@Component
@RequiredArgsConstructor
public class PaymentsServiceClient {

    private final ServiceClientsProperties properties;

    /**
     * Feature 15 (Production Hardening) - Circuit Breaker. Unlike the try/catch this replaced,
     * this method now lets RestClientException propagate so resilience4j's AOP proxy actually
     * sees each failure and counts it toward the "walletService" breaker's sliding window
     * (configured in application.yml) - a caught-and-swallowed exception would never register as
     * a failure, defeating the whole point. Once the breaker trips open (too many recent
     * failures), calls skip the network round-trip AND the read timeout entirely and go straight
     * to isProFallback() - important because this method is called on every single AI chat
     * message and journal entry, so a wallet-service outage would otherwise pay the full 5s
     * timeout on every request instead of failing fast.
     */
    @CircuitBreaker(name = "walletService", fallbackMethod = "isProFallback")
    public boolean isPro(Long userId) {
        SubscriptionSummary summary = restClient().get()
                .uri("/internal/payments/subscription/{userId}", userId)
                .retrieve()
                .body(SubscriptionSummary.class);
        return summary != null && summary.pro();
    }

    // Signature convention required by resilience4j: same params as the guarded method, plus a
    // trailing Throwable. Preserves the exact same fail-closed behavior the old try/catch had.
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
