package com.moodmate.wellness.client;

import com.moodmate.wellness.config.ServiceClientsProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.time.Instant;

/** Fire-and-forget producer for the shared notification pipeline. */
@Slf4j
@Component
@RequiredArgsConstructor
public class NotificationsServiceClient {

    private static final int CONNECT_TIMEOUT_MS = 3000;
    private static final int READ_TIMEOUT_MS = 5000;

    private final ServiceClientsProperties properties;

    public void notify(Long userId, String type, String title, String body, Instant scheduledAt, Long eventId) {
        try {
            restClient().post()
                    .uri("/internal/notifications")
                    .body(new CreateNotificationRequest(
                            userId,
                            type,
                            title,
                            body,
                            "Hub",
                            eventId == null ? null : String.valueOf(eventId),
                            scheduledAt,
                            null))
                    .retrieve()
                    .toBodilessEntity();
        } catch (RestClientException exception) {
            log.warn("Could not deliver event notification to user {}: {}", userId, exception.getMessage());
        }
    }

    private RestClient restClient() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(CONNECT_TIMEOUT_MS);
        factory.setReadTimeout(READ_TIMEOUT_MS);
        return RestClient.builder()
                .baseUrl(properties.notificationsBaseUrl())
                .requestFactory(factory)
                .build();
    }

    private record CreateNotificationRequest(
            Long userId,
            String type,
            String title,
            String body,
            String destinationScreen,
            String destinationParams,
            Instant scheduledAt,
            String metadata) {
    }
}
