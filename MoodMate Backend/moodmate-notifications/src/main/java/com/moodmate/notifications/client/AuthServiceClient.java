package com.moodmate.notifications.client;

import com.moodmate.notifications.client.dto.NotificationPreferences;
import com.moodmate.notifications.client.dto.PushNotifyRequest;
import com.moodmate.notifications.client.dto.PushNotifyResponse;
import com.moodmate.notifications.config.ServiceClientsProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.util.Map;
import java.util.Optional;

/**
 * Direct (non-gateway) service-to-service calls to moodmate-auth - Phase 1E, Step 5 (Expo Push).
 * Two responsibilities, both against auth-service's existing internal endpoints (built earlier for
 * Feature 9, not new infrastructure - see NotificationService.create()'s doc comment for why this
 * reuses rather than duplicates auth-service's push-sending machinery):
 *
 * - notify(): fires the actual push via auth-service's POST /internal/push/notify (which already
 *   fans out across every device token on file for the user and calls Expo - see auth's own
 *   NotificationService/ExpoPushClient). Fire-and-forget, same reasoning as ExpoPushClient itself:
 *   a push failure must never fail the notification-creation transaction that triggered it.
 * - getPreferences(): reads the user's NotificationPreference (quiet hours, per-type toggles) via
 *   GET /internal/users/{userId}/notification-preferences, so PushGatingRule can decide whether
 *   notify() should even be called. Returns empty on failure rather than throwing - see
 *   PushGatingRule's doc comment for why a fetch failure defaults to "allow" (fail-open) rather
 *   than silently swallowing a real notification.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class AuthServiceClient {

    private final ServiceClientsProperties properties;

    private static final int CONNECT_TIMEOUT_MS = 3000;
    private static final int READ_TIMEOUT_MS = 8000; // matches auth's own ExpoPushClient - an external Expo round trip sits behind this call

    public void notify(Long userId, String title, String body, Map<String, String> data) {
        try {
            PushNotifyResponse response = restClient().post()
                    .uri("/internal/push/notify")
                    .body(new PushNotifyRequest(userId, title, body, data))
                    .retrieve()
                    .body(PushNotifyResponse.class);
            if (response != null && !response.sent()) {
                log.debug("Push not sent for user {}: {}", userId, response.reason());
            }
        } catch (RestClientException e) {
            log.warn("Could not reach auth-service to send a push notification for user {}: {}", userId, e.getMessage());
        }
    }

    public Optional<NotificationPreferences> getPreferences(Long userId) {
        try {
            NotificationPreferences prefs = restClient().get()
                    .uri("/internal/users/{userId}/notification-preferences", userId)
                    .retrieve()
                    .body(NotificationPreferences.class);
            return Optional.ofNullable(prefs);
        } catch (RestClientException e) {
            log.warn("Could not reach auth-service for user {}'s notification preferences - defaulting to allow push: {}",
                    userId, e.getMessage());
            return Optional.empty();
        }
    }

    private RestClient restClient() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(CONNECT_TIMEOUT_MS);
        factory.setReadTimeout(READ_TIMEOUT_MS);
        return RestClient.builder().baseUrl(properties.authBaseUrl()).requestFactory(factory).build();
    }
}
