package com.moodmate.community.client;

import com.moodmate.community.config.ServiceClientsProperties;
import com.moodmate.community.exception.ApiException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

/** Direct (non-gateway) service-to-service call to moodmate-auth's internal moderation endpoints -
 * added for Feature 7 (Community Moderation). Unlike moodmate-journal/moodmate-ai's
 * PaymentsServiceClient (which deliberately fails "closed" on an outage, since granting a free
 * user Pro access by accident is the safe default), a moderation action has no safe silent
 * fallback: an admin who clicks "Ban" needs to know whether it actually happened. So this fails
 * loudly - an auth-service outage surfaces as a 502 to the admin, not a silently-ignored no-op. */
@Slf4j
@Component
@RequiredArgsConstructor
public class AuthServiceClient {

    private final ServiceClientsProperties properties;

    public ModerationStatusSummary ban(Long userId, String reason) {
        return call(() -> restClient().post()
                .uri("/internal/users/{userId}/ban", userId)
                .body(new ModerationReasonBody(reason))
                .retrieve()
                .body(ModerationStatusSummary.class), userId, "ban");
    }

    public ModerationStatusSummary warn(Long userId, String reason) {
        return call(() -> restClient().post()
                .uri("/internal/users/{userId}/warn", userId)
                .body(new ModerationReasonBody(reason))
                .retrieve()
                .body(ModerationStatusSummary.class), userId, "warn");
    }

    private ModerationStatusSummary call(java.util.function.Supplier<ModerationStatusSummary> action,
                                          Long userId, String actionName) {
        try {
            return action.get();
        } catch (RestClientException e) {
            log.error("Could not reach auth-service to {} user {}: {}", actionName, userId, e.getMessage());
            throw new ApiException("Could not " + actionName + " the user right now - please try again", HttpStatus.BAD_GATEWAY);
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
        return RestClient.builder().baseUrl(properties.authBaseUrl()).requestFactory(factory).build();
    }
}
