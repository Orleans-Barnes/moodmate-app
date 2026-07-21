package com.moodmate.admin.client;

import com.moodmate.admin.config.ServiceClientsProperties;
import com.moodmate.admin.dto.RevenueSummaryView;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.server.ResponseStatusException;

/**
 * Direct (non-gateway) service-to-service call to wallet-service's internal revenue-summary
 * endpoint (Item 8 - Admin Revenue Dashboard). Unlike NotificationsServiceClient.notify() (which
 * is deliberately fire-and-forget, since one failed notification must never block a broadcast),
 * a failure here is surfaced to the admin caller as an error rather than swallowed - showing
 * "$0 revenue" on a wallet-service outage would be actively misleading, not a safe fallback.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class RevenueServiceClient {

    private static final int CONNECT_TIMEOUT_MS = 3000;
    private static final int READ_TIMEOUT_MS = 5000;

    private final ServiceClientsProperties properties;

    public RevenueSummaryView getRevenueSummary() {
        try {
            RevenueSummaryView view = restClient().get()
                    .uri("/internal/payments/revenue-summary")
                    .retrieve()
                    .body(RevenueSummaryView.class);
            if (view == null) {
                throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Wallet service returned no data.");
            }
            return view;
        } catch (RestClientException e) {
            log.warn("Could not load revenue summary from wallet-service: {}", e.getMessage());
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "Could not load revenue data - wallet service unavailable.");
        }
    }

    private RestClient restClient() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(CONNECT_TIMEOUT_MS);
        factory.setReadTimeout(READ_TIMEOUT_MS);
        return RestClient.builder().baseUrl(properties.walletBaseUrl()).requestFactory(factory).build();
    }
}
