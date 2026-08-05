package com.moodmate.wellness.client;

import com.moodmate.wellness.config.ServiceClientsProperties;
import com.moodmate.wellness.exception.ApiException;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

/**
 * Direct (non-gateway) service-to-service call to wallet-service. Used for two things the
 * monolith did in-process on the shared WellnessProfile row, now split across services:
 *  1. Reading leafBalance/equipped-skin-emoji to render WellnessStateResponse.
 *  2. Crediting leaves when completing all of today's goals (fix #2 from review - this is the
 *     wiring that was missing entirely before; GOAL_REWARD existed as an enum value in the
 *     monolith but nothing ever called it).
 */
@Component
@RequiredArgsConstructor
public class WalletServiceClient {

    private final ServiceClientsProperties serviceClientsProperties;

    /**
     * Feature 15 (Production Hardening) - Circuit Breaker. This is the single most-called method
     * in this client (every wellness state read AND every goal toggle resolves the wallet
     * summary), so it's the one wrapped with a breaker: once "walletService" trips open after
     * repeated failures, subsequent calls skip the network round-trip and read timeout entirely
     * and go straight to getSummaryFallback() - same ApiException(BAD_GATEWAY) contract as before,
     * just fast instead of paying the full timeout on every single request during an outage.
     * creditLeaves/debitLeaves below are intentionally NOT wrapped in this pass - they're writes,
     * and a circuit breaker's value is in short-circuiting repeated reads/idempotent calls, not in
     * changing the failure handling of a leaf-crediting side effect.
     */
    @CircuitBreaker(name = "walletService", fallbackMethod = "getSummaryFallback")
    public WalletSummary getSummary(Long userId) {
        WalletSummary summary = restClient().get()
                .uri("/internal/wallet/{userId}", userId)
                .retrieve()
                .body(WalletSummary.class);
        if (summary == null) {
            throw new ApiException("wallet-service returned an empty response for user " + userId, HttpStatus.BAD_GATEWAY);
        }
        return summary;
    }

    private WalletSummary getSummaryFallback(Long userId, Throwable t) {
        throw new ApiException("Could not reach wallet-service to resolve wallet for user " + userId + ": " + t.getMessage(),
                HttpStatus.BAD_GATEWAY);
    }

    public void creditLeaves(Long userId, int amount, LeafTransactionReason reason) {
        try {
            restClient().post()
                    .uri("/internal/wallet/credit")
                    .body(new CreditLeavesRequest(userId, amount, reason))
                    .retrieve()
                    .toBodilessEntity();
        } catch (RestClientException e) {
            throw new ApiException("Could not reach wallet-service to credit leaves for user " + userId + ": " + e.getMessage(),
                    HttpStatus.BAD_GATEWAY);
        }
    }

    /**
     * Unlike creditLeaves, this can legitimately fail on insufficient balance - that's reported as
     * a normal `false` return (not an exception) so callers (WellnessService.buyStreakShield) can
     * turn it into a clean 402 without a stack trace. A 402 from wallet-service is the ONLY
     * RestClientException subtype treated this way; any other failure (network, 5xx, etc.) still
     * throws ApiException(BAD_GATEWAY), same as every other method here.
     */
    public boolean debitLeaves(Long userId, int amount, LeafTransactionReason reason) {
        try {
            restClient().post()
                    .uri("/internal/wallet/debit")
                    .body(new DebitLeavesRequest(userId, amount, reason))
                    .retrieve()
                    .toBodilessEntity();
            return true;
        } catch (HttpClientErrorException e) {
            // Spring only ships dedicated HttpClientErrorException subclasses for the common
            // statuses (BadRequest, Unauthorized, Forbidden, NotFound, Conflict, ...) - 402 Payment
            // Required isn't one of them, so this checks the status code directly instead of
            // catching a nonexistent HttpClientErrorException.PaymentRequired subclass.
            if (e.getStatusCode().equals(HttpStatus.PAYMENT_REQUIRED)) {
                return false;
            }
            throw new ApiException("wallet-service rejected the debit request for user " + userId + ": " + e.getMessage(),
                    HttpStatus.BAD_GATEWAY);
        } catch (RestClientException e) {
            throw new ApiException("Could not reach wallet-service to debit leaves for user " + userId + ": " + e.getMessage(),
                    HttpStatus.BAD_GATEWAY);
        }
    }

    // Feature 15 (Production Hardening) - Timeout Handling. See moodmate-crisis's
    // AuthServiceClient for the same fix's full doc comment.
    private static final int CONNECT_TIMEOUT_MS = 3000;
    private static final int READ_TIMEOUT_MS = 5000;

    private RestClient restClient() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(CONNECT_TIMEOUT_MS);
        factory.setReadTimeout(READ_TIMEOUT_MS);
        return RestClient.builder().baseUrl(serviceClientsProperties.walletBaseUrl()).requestFactory(factory).build();
    }
}
