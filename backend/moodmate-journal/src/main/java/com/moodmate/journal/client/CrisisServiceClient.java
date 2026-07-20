package com.moodmate.journal.client;

import com.moodmate.journal.config.ServiceClientsProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.util.List;

/**
 * Direct (non-gateway) service-to-service call to moodmate-crisis's internal endpoint - same
 * pattern and same best-effort failure handling as moodmate-ai's CrisisServiceClient (a failure
 * here is logged, never thrown, so a journal entry save must never fail just because the crisis
 * alert couldn't be filed).
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class CrisisServiceClient {

    private final ServiceClientsProperties properties;

    public void raiseAlert(Long userId, String triggerText, List<String> matchedKeywords, CrisisSeverity severity) {
        try {
            restClient().post()
                    .uri("/internal/crisis/alerts")
                    .body(new CreateCrisisAlertRequest(userId, triggerText, matchedKeywords, severity, "JOURNAL"))
                    .retrieve()
                    .toBodilessEntity();
        } catch (RestClientException e) {
            log.error("Failed to raise crisis alert for user {} (severity {}): {}", userId, severity, e.getMessage());
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
        return RestClient.builder().baseUrl(properties.crisisBaseUrl()).requestFactory(factory).build();
    }
}
