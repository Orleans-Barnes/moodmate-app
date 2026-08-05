package com.moodmate.support.client;

import com.moodmate.support.config.ServiceClientsProperties;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

/** Direct (non-gateway) service-to-service call to moodmate-wallet's internal subscription-status
 * endpoint - added for Premium gating breadth (Milestone item 7), same client shape as
 * moodmate-journal's/moodmate-ai's identical PaymentsServiceClient. Fails "closed" (free-tier) on
 * a wallet-service outage: a booking just doesn't get flagged priority rather than failing the
 * whole booking, since this is a perk check, not a hard gate. */
@Slf4j
@Component
@RequiredArgsConstructor
public class PaymentsServiceClient {

    private final ServiceClientsProperties properties;

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

    private static final int CONNECT_TIMEOUT_MS = 3000;
    private static final int READ_TIMEOUT_MS = 5000;

    private RestClient restClient() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(CONNECT_TIMEOUT_MS);
        factory.setReadTimeout(READ_TIMEOUT_MS);
        return RestClient.builder().baseUrl(properties.walletBaseUrl()).requestFactory(factory).build();
    }
}
