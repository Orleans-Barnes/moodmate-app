package com.moodmate.auth.client;

import com.moodmate.auth.config.ExpoPushProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.util.List;

/** New for Feature 9 (Notification Deep Linking) - the one place in this codebase that actually
 * calls Expo's push API (everything before this feature only stored/removed tokens - see
 * PushTokenService's doc comment). Deliberately fire-and-forget: a failed or partially-failed
 * push delivery must never fail the caller's own transaction (a payment succeeding, a message
 * being saved, a crisis alert being recorded) just because a phone is offline or a token is
 * stale - this logs and moves on rather than throwing. */
@Slf4j
@Component
@RequiredArgsConstructor
public class ExpoPushClient {

    private final ExpoPushProperties properties;

    public void send(List<ExpoPushMessage> messages) {
        if (messages.isEmpty()) {
            return;
        }
        try {
            restClient().post()
                    .uri("")
                    .body(messages)
                    .retrieve()
                    .toBodilessEntity();
        } catch (RestClientException e) {
            log.warn("Expo push delivery failed for {} message(s): {}", messages.size(), e.getMessage());
        }
    }

    // Feature 15 (Production Hardening) - Timeout Handling. External API (not same-network
    // service-to-service), so a slightly longer read timeout than the internal-client default -
    // still bounded, since this is fire-and-forget and must never hang the caller's own
    // transaction waiting on Expo.
    private static final int CONNECT_TIMEOUT_MS = 3000;
    private static final int READ_TIMEOUT_MS = 8000;

    private RestClient restClient() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(CONNECT_TIMEOUT_MS);
        factory.setReadTimeout(READ_TIMEOUT_MS);
        return RestClient.builder().baseUrl(properties.pushUrl()).requestFactory(factory).build();
    }
}
