package com.moodmate.notifications.client;

import com.moodmate.notifications.client.dto.UserLastJournalEntry;
import com.moodmate.notifications.config.ServiceClientsProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.util.List;

/** Direct (non-gateway) service-to-service call to moodmate-journal's internal latest-per-user
 * endpoint - same RestClient/timeout/graceful-degradation pattern as MoodServiceClient. */
@Slf4j
@Component
@RequiredArgsConstructor
public class JournalServiceClient {

    private final ServiceClientsProperties properties;

    private static final int CONNECT_TIMEOUT_MS = 3000;
    private static final int READ_TIMEOUT_MS = 5000;

    public List<UserLastJournalEntry> latestEntryPerUser() {
        try {
            List<UserLastJournalEntry> result = restClient().get()
                    .uri("/internal/journal/latest-per-user")
                    .retrieve()
                    .body(new ParameterizedTypeReference<List<UserLastJournalEntry>>() {});
            return result != null ? result : List.of();
        } catch (RestClientException e) {
            log.warn("Could not reach journal-service for the journal-reminder scheduled job - skipping this run: {}", e.getMessage());
            return List.of();
        }
    }

    private RestClient restClient() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(CONNECT_TIMEOUT_MS);
        factory.setReadTimeout(READ_TIMEOUT_MS);
        return RestClient.builder().baseUrl(properties.journalBaseUrl()).requestFactory(factory).build();
    }
}
