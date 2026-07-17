package com.moodmate.ai.client;

import com.moodmate.ai.config.ServiceClientsProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.util.List;

/**
 * Direct (non-gateway) service-to-service call to moodmate-crisis's internal endpoint. A failure
 * here is logged, not thrown - a crisis-alert-creation failure must never block the chat reply
 * from reaching the student (the reply itself, including any in-message crisis resources the
 * model includes, still gets through even if the counsellor-facing alert doesn't get filed). This
 * is a deliberate best-effort trade-off, documented here rather than silently swallowed elsewhere.
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
                    .body(new CreateCrisisAlertRequest(userId, triggerText, matchedKeywords, severity, "AI_CHAT"))
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
