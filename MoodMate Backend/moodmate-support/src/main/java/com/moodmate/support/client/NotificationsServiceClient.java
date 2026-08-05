package com.moodmate.support.client;

import com.moodmate.support.config.ServiceClientsProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

/** Direct (non-gateway) service-to-service call to notifications-service. Peer Mentor Platform
 * (Milestone 5) - this service's first producer into moodmate-notifications' real pipeline
 * (Notification row + NotificationType + push-preference/quiet-hours gating), mirroring
 * moodmate-admin's NotificationsServiceClient exactly. Fire-and-forget (same fail-soft reasoning
 * as every other *ServiceClient.notify* in this project) - one failed notification must never
 * block the mentor-request workflow that triggered it. */
@Slf4j
@Component
@RequiredArgsConstructor
public class NotificationsServiceClient {

    private static final int CONNECT_TIMEOUT_MS = 3000;
    private static final int READ_TIMEOUT_MS = 5000;

    private final ServiceClientsProperties properties;

    public void notify(Long userId, String type, String title, String body, String destinationScreen, String destinationParams) {
        try {
            restClient().post()
                    .uri("/internal/notifications")
                    .body(new CreateNotificationRequest(userId, type, title, body, destinationScreen, destinationParams, null, null))
                    .retrieve()
                    .toBodilessEntity();
        } catch (RestClientException e) {
            log.warn("Could not deliver notification to user {}: {}", userId, e.getMessage());
        }
    }

    private RestClient restClient() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(CONNECT_TIMEOUT_MS);
        factory.setReadTimeout(READ_TIMEOUT_MS);
        return RestClient.builder().baseUrl(properties.notificationsBaseUrl()).requestFactory(factory).build();
    }

    // Local mirror of moodmate-notifications' CreateNotificationRequest - same "duplicate the DTO
    // shape locally rather than share a jar across service boundaries" convention every other
    // *ServiceClient in this project already follows.
    private record CreateNotificationRequest(Long userId, String type, String title, String body,
                                               String destinationScreen, String destinationParams,
                                               String scheduledAt, String metadata) {
    }
}
