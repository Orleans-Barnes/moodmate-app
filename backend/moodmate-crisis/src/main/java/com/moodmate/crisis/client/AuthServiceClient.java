package com.moodmate.crisis.client;

import com.moodmate.crisis.config.ServiceClientsProperties;
import io.github.resilience4j.retry.annotation.Retry;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.util.List;
import java.util.Map;

/** Direct (non-gateway) service-to-service call to auth-service. notifyRoles() (Feature 9,
 * Notification Deep Linking) and getPrimaryEmergencyContact() (Feature 10, Emergency Contacts)
 * are the first things moodmate-crisis has ever needed from another service - CrisisAlertService
 * otherwise only touches its own repository. Both are fire-and-forget/fail-soft: a failed
 * broadcast must never fail the crisis alert that already got recorded, and a counsellor viewing
 * an alert with an unreachable auth-service should see "no contact on file" rather than an error
 * screen - see getPrimaryEmergencyContact()'s doc comment. */
@Slf4j
@Component
@RequiredArgsConstructor
public class AuthServiceClient {

    private final ServiceClientsProperties properties;

    public void notifyRoles(List<String> roles, String title, String body, Map<String, String> data) {
        try {
            restClient().post()
                    .uri("/internal/push/notify-roles")
                    .body(new NotifyRoleRequest(roles, title, body, data))
                    .retrieve()
                    .toBodilessEntity();
        } catch (RestClientException e) {
            log.warn("Could not reach auth-service to broadcast to roles {}: {}", roles, e.getMessage());
        }
    }

    /**
     * Returns null both when the user genuinely has no primary contact on file (auth-service
     * responds 204) and when auth-service can't be reached at all (even after retries) -
     * deliberately not distinguished, since either way there's simply nothing to show the
     * counsellor. This is a counsellor-facing read during a live crisis review, not a critical
     * write, so failing soft here is the right trade-off (same reasoning as WellnessServiceClient
     * in moodmate-mood's habit/sleep correlation - see Feature 8).
     *
     * Feature 15 (Production Hardening) - Retry Policies. @Retry (3 attempts, 500ms apart -
     * configured in application.yml) replaces the old direct try/catch: letting
     * RestClientException propagate out of this method (instead of catching it here) is what lets
     * resilience4j's AOP proxy actually retry the call, rather than giving up after one attempt
     * the way the old try/catch effectively did. getPrimaryEmergencyContactFallback() below is
     * only reached once all 3 attempts are exhausted, and reproduces the exact same fail-soft
     * "return null" behavior this method always had.
     */
    @Retry(name = "authService", fallbackMethod = "getPrimaryEmergencyContactFallback")
    public EmergencyContactSummary getPrimaryEmergencyContact(Long userId) {
        // auth-service returns 204 (empty body) when the user has no primary contact - Spring's
        // RestClient message conversion returns null for a zero-length body rather than
        // throwing, so no special status handling is needed here.
        return restClient().get()
                .uri("/internal/users/{userId}/emergency-contacts/primary", userId)
                .retrieve()
                .body(EmergencyContactSummary.class);
    }

    private EmergencyContactSummary getPrimaryEmergencyContactFallback(Long userId, Throwable t) {
        log.warn("Could not reach auth-service to resolve emergency contact for user {} after retries: {}",
                userId, t.getMessage());
        return null;
    }

    // Feature 15 (Production Hardening) - Timeout Handling. Every RestClient in this project
    // previously had no timeout at all, meaning a hung/slow downstream service could block the
    // calling thread indefinitely. 3s connect / 5s read is a reasonable default for internal
    // service-to-service calls on the same local network (external APIs like Groq/Paystack/Expo
    // get longer, separately-justified timeouts in their own clients).
    private static final int CONNECT_TIMEOUT_MS = 3000;
    private static final int READ_TIMEOUT_MS = 5000;

    private RestClient restClient() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(CONNECT_TIMEOUT_MS);
        factory.setReadTimeout(READ_TIMEOUT_MS);
        return RestClient.builder().baseUrl(properties.authBaseUrl()).requestFactory(factory).build();
    }
}
