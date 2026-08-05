package com.moodmate.wallet.client;

import com.moodmate.wallet.config.ServiceClientsProperties;
import com.moodmate.wallet.exception.ApiException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.util.Map;

/**
 * Direct (non-gateway) service-to-service call to auth-service - the only piece of user data this
 * service needs that it doesn't own itself is a user's email, for the Paystack checkout receipt
 * (see PaymentsService.checkoutSubscription/checkoutLeafPack, which used to just read
 * User.email directly in the monolith). Calls auth-service on its internal network address, not
 * through the gateway, since this is service-to-service traffic, not a client request.
 *
 * notify() was added for Feature 9 (Notification Deep Linking) - unlike getUserSummary above
 * (a critical read the caller can't proceed without), a failed notification must never fail a
 * payment that already succeeded, so this deliberately swallows RestClientException (logged, not
 * rethrown) rather than throwing ApiException like every other method here.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class AuthServiceClient {

    private final ServiceClientsProperties serviceClientsProperties;

    public UserSummary getUserSummary(Long userId) {
        try {
            UserSummary summary = restClient().get()
                    .uri("/internal/users/{id}/summary", userId)
                    .retrieve()
                    .body(UserSummary.class);
            if (summary == null) {
                throw new ApiException("auth-service returned an empty response for user " + userId, HttpStatus.BAD_GATEWAY);
            }
            return summary;
        } catch (RestClientException e) {
            throw new ApiException("Could not reach auth-service to resolve user " + userId + ": " + e.getMessage(),
                    HttpStatus.BAD_GATEWAY);
        }
    }

    // Institution Management (Milestone 2, Step 3-4) - fail-safe (returns null, doesn't throw) on
    // any error, unlike getUserSummary above. This feeds a Pro-status check: a transient
    // auth-service outage must degrade to "treat as no institution assigned", never block the
    // whole subscription-state read the way a hard failure on getUserSummary legitimately should.
    public Long getInstitutionId(Long userId) {
        try {
            InstitutionIdResponse response = restClient().get()
                    .uri("/internal/users/{id}/institution-id", userId)
                    .retrieve()
                    .body(InstitutionIdResponse.class);
            return response != null ? response.institutionId() : null;
        } catch (RestClientException e) {
            log.warn("Could not reach auth-service to resolve institutionId for user {}: {}", userId, e.getMessage());
            return null;
        }
    }

    private record InstitutionIdResponse(Long institutionId) {
    }

    public void notify(Long userId, String title, String body, Map<String, String> data) {
        try {
            restClient().post()
                    .uri("/internal/push/notify")
                    .body(new NotifyRequest(userId, title, body, data))
                    .retrieve()
                    .toBodilessEntity();
        } catch (RestClientException e) {
            log.warn("Could not reach auth-service to notify user {}: {}", userId, e.getMessage());
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
        return RestClient.builder().baseUrl(serviceClientsProperties.authBaseUrl()).requestFactory(factory).build();
    }
}
