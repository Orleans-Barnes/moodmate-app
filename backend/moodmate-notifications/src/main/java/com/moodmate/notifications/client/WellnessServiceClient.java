package com.moodmate.notifications.client;

import com.moodmate.notifications.client.dto.UserHabitTodaySummary;
import com.moodmate.notifications.config.ServiceClientsProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.util.List;

/** Direct (non-gateway) service-to-service call to moodmate-wellness's internal habits-today-summary
 * endpoint - same RestClient/timeout/graceful-degradation pattern as MoodServiceClient. */
@Slf4j
@Component
@RequiredArgsConstructor
public class WellnessServiceClient {

    private final ServiceClientsProperties properties;

    private static final int CONNECT_TIMEOUT_MS = 3000;
    private static final int READ_TIMEOUT_MS = 5000;

    public List<UserHabitTodaySummary> habitsTodaySummary() {
        try {
            List<UserHabitTodaySummary> result = restClient().get()
                    .uri("/internal/wellness/habits/today-summary")
                    .retrieve()
                    .body(new ParameterizedTypeReference<List<UserHabitTodaySummary>>() {});
            return result != null ? result : List.of();
        } catch (RestClientException e) {
            log.warn("Could not reach wellness-service for the habit-reminder scheduled job - skipping this run: {}", e.getMessage());
            return List.of();
        }
    }

    private RestClient restClient() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(CONNECT_TIMEOUT_MS);
        factory.setReadTimeout(READ_TIMEOUT_MS);
        return RestClient.builder().baseUrl(properties.wellnessBaseUrl()).requestFactory(factory).build();
    }
}
