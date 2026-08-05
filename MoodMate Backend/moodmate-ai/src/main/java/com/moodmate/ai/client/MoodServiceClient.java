package com.moodmate.ai.client;

import com.moodmate.ai.config.ServiceClientsProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

/**
 * Direct (non-gateway) service-to-service call to mood-service's new internal endpoint (see
 * InternalMoodController). Used by InsightsService to build GET /api/insights. Unlike
 * WalletServiceClient's methods, a mood-data fetch failure here does NOT need to fail the whole
 * request - InsightsService falls back to a "not enough data" response instead (see its doc
 * comment), so this returns null on failure rather than throwing.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class MoodServiceClient {

    private final ServiceClientsProperties properties;

    public MoodTrendSummary getTrend(Long userId, int days) {
        try {
            return restClient().get()
                    .uri("/internal/mood/{userId}/trend?days={days}", userId, days)
                    .retrieve()
                    .body(MoodTrendSummary.class);
        } catch (RestClientException e) {
            log.warn("Could not reach mood-service to build insights for user {}: {}", userId, e.getMessage());
            return null;
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
        return RestClient.builder().baseUrl(properties.moodBaseUrl()).requestFactory(factory).build();
    }
}
