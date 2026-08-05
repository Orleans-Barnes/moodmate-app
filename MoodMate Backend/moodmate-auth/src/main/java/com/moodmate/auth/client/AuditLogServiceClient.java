package com.moodmate.auth.client;

import com.moodmate.auth.config.ServiceClientsProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

/** Phase 1H (Admin Portal - Audit Logs). Direct (non-gateway) service-to-service call to
 * admin-service's audit-log fan-in - see moodmate-admin's InternalAuditLogController doc comment.
 * Fire-and-forget, same fail-soft reasoning as every other *ServiceClient in this project: a
 * logging failure must never fail (or even delay) the real admin action that already succeeded. */
@Slf4j
@Component
@RequiredArgsConstructor
public class AuditLogServiceClient {

    private static final int CONNECT_TIMEOUT_MS = 3000;
    private static final int READ_TIMEOUT_MS = 5000;

    private final ServiceClientsProperties properties;

    public void record(Long adminUserId, String action, String targetType, String targetId, String details) {
        try {
            restClient().post()
                    .uri("/internal/audit-logs")
                    .body(new CreateAuditLogRequest(adminUserId, action, targetType, targetId, details))
                    .retrieve()
                    .toBodilessEntity();
        } catch (RestClientException e) {
            log.warn("Could not record audit log for admin {} action {}: {}", adminUserId, action, e.getMessage());
        }
    }

    private RestClient restClient() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(CONNECT_TIMEOUT_MS);
        factory.setReadTimeout(READ_TIMEOUT_MS);
        return RestClient.builder().baseUrl(properties.adminBaseUrl()).requestFactory(factory).build();
    }

    // Local mirror of moodmate-admin's CreateAuditLogRequest - same "duplicate the DTO shape
    // locally rather than share a jar" convention every *ServiceClient in this project follows.
    private record CreateAuditLogRequest(Long adminUserId, String action, String targetType,
                                          String targetId, String details) {
    }
}
