package com.moodmate.admin.client;

import com.moodmate.admin.config.ServiceClientsProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

/** Direct (non-gateway) service-to-service call to notifications-service. Phase 1H (System
 * Settings - Admin Announcement broadcast) is this service's first producer into
 * moodmate-notifications - see InternalNotificationController's own doc comment, which already
 * named moodmate-admin as an intended future caller. Fire-and-forget per notification (same
 * fail-soft reasoning as moodmate-crisis's AuthServiceClient.notifyRoles): one unreachable/failed
 * notification for one user in a broadcast must never abort the rest of the broadcast. */
@Slf4j
@Component
@RequiredArgsConstructor
public class NotificationsServiceClient {

    private static final int CONNECT_TIMEOUT_MS = 3000;
    private static final int READ_TIMEOUT_MS = 5000;

    private final ServiceClientsProperties properties;

    public void notify(Long userId, String type, String title, String body) {
        try {
            restClient().post()
                    .uri("/internal/notifications")
                    .body(new CreateNotificationRequest(userId, type, title, body, null, null, null, null))
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
    // *ServiceClient in this project already follows (see moodmate-support's RoleUpdateRequest
    // local record inside AuthServiceClient for the precedent).
    private record CreateNotificationRequest(Long userId, String type, String title, String body,
                                               String destinationScreen, String destinationParams,
                                               String scheduledAt, String metadata) {
    }
}
