package com.moodmate.notifications.client;

import com.moodmate.notifications.client.dto.UserLastCheckIn;
import com.moodmate.notifications.config.ServiceClientsProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.util.List;

/**
 * Direct (non-gateway) service-to-service call to moodmate-mood's internal latest-per-user
 * endpoint - same RestClient/timeout pattern as moodmate-mood's own WellnessServiceClient.
 * Degrades gracefully (empty list, warn-logged) rather than failing loudly: a mood-service outage
 * should simply mean "no mood reminders get evaluated this run," not crash
 * MoodReminderScheduledJob or the rest of this service.
 *
 * Scoping note (Phase 1E Step 4): this only ever sees users who have at least one prior check-in -
 * moodmate-mood's endpoint groups its own checkins table, so it has no way to know about a
 * registered user who has never checked in at all (that list lives in moodmate-auth, which this
 * client deliberately does not call, to avoid a second cross-service dependency for what is meant
 * to be a lightweight nightly nudge). In practice this means the "no check-in today" reminder only
 * ever nudges someone who has an established check-in habit and broke it today - a brand-new user
 * who has literally never checked in is expected to be reached by onboarding/engagement flows
 * instead, not this rule.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class MoodServiceClient {

    private final ServiceClientsProperties properties;

    private static final int CONNECT_TIMEOUT_MS = 3000;
    private static final int READ_TIMEOUT_MS = 5000;

    public List<UserLastCheckIn> latestCheckInPerUser() {
        try {
            List<UserLastCheckIn> result = restClient().get()
                    .uri("/internal/mood/latest-per-user")
                    .retrieve()
                    .body(new ParameterizedTypeReference<List<UserLastCheckIn>>() {});
            return result != null ? result : List.of();
        } catch (RestClientException e) {
            log.warn("Could not reach mood-service for the mood-reminder scheduled job - skipping this run: {}", e.getMessage());
            return List.of();
        }
    }

    private RestClient restClient() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(CONNECT_TIMEOUT_MS);
        factory.setReadTimeout(READ_TIMEOUT_MS);
        return RestClient.builder().baseUrl(properties.moodBaseUrl()).requestFactory(factory).build();
    }
}
