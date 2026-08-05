package com.moodmate.mood.client;

import com.moodmate.mood.config.ServiceClientsProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Component;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.util.List;

/** Direct (non-gateway) service-to-service call to moodmate-wellness's internal daily-stats
 * endpoint - added for Feature 8 (Mood Analytics)'s habit/sleep correlation. Unlike
 * moodmate-community's AuthServiceClient (which fails loudly, since a moderation action with no
 * safe silent fallback must be visible to the admin who triggered it), this degrades gracefully:
 * habit/sleep correlation is a nice-to-have analytics view, not a critical action, so a
 * wellness-service outage should show "insufficient data" for those two correlations rather than
 * failing the whole analytics response (mood/emotion/stress trends, which don't depend on
 * wellness-service at all, should keep working regardless). */
@Slf4j
@Component
@RequiredArgsConstructor
public class WellnessServiceClient {

    private final ServiceClientsProperties properties;

    public List<DailyWellnessStat> dailyStats(Long userId, int days) {
        try {
            List<DailyWellnessStat> stats = restClient().get()
                    .uri("/internal/wellness/{userId}/daily-stats?days={days}", userId, days)
                    .retrieve()
                    .body(new ParameterizedTypeReference<List<DailyWellnessStat>>() {});
            return stats != null ? stats : List.of();
        } catch (RestClientException e) {
            log.warn("Could not reach wellness-service for user {} daily stats - habit/sleep correlation will show as insufficient data: {}",
                    userId, e.getMessage());
            return List.of();
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
        return RestClient.builder().baseUrl(properties.wellnessBaseUrl()).requestFactory(factory).build();
    }
}
