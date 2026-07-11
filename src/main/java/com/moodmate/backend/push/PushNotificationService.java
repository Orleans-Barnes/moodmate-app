package com.moodmate.backend.push;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Sends push notifications to devices via the Expo Push Notification Service.
 *
 * Expo accepts a batch of up to 100 messages per request. Each message targets
 * one Expo push token (ExponentPushToken[xxx] for Expo Go / dev builds,
 * or an FCM/APNs token for standalone builds).
 *
 * No extra SDK or credentials needed — Expo's push service is free and open.
 * Docs: https://docs.expo.dev/push-notifications/sending-notifications/
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PushNotificationService {

    private static final String EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

    private final PushTokenRepository pushTokenRepository;
    private final WebClient.Builder webClientBuilder;

    /**
     * Send a notification to all devices registered to a single user.
     * Silently skips if the user has no registered tokens.
     */
    public void sendToUser(Long userId, String title, String body, Map<String, Object> data) {
        List<PushToken> tokens = pushTokenRepository.findByUserId(userId);
        if (tokens.isEmpty()) return;
        send(tokens.stream().map(PushToken::getToken).collect(Collectors.toList()), title, body, data);
    }

    /**
     * Send the same notification to all devices registered to multiple users.
     */
    public void sendToUsers(List<Long> userIds, String title, String body, Map<String, Object> data) {
        if (userIds == null || userIds.isEmpty()) return;
        List<String> tokens = userIds.stream()
                .flatMap(id -> pushTokenRepository.findByUserId(id).stream())
                .map(PushToken::getToken)
                .distinct()
                .collect(Collectors.toList());
        if (tokens.isEmpty()) return;
        send(tokens, title, body, data);
    }

    // ── internal ──────────────────────────────────────────────────────────────

    private void send(List<String> tokens, String title, String body, Map<String, Object> data) {
        List<Map<String, Object>> messages = tokens.stream()
                .map(token -> Map.<String, Object>of(
                        "to",    token,
                        "title", title,
                        "body",  body,
                        "data",  data != null ? data : Map.of(),
                        "sound", "default"
                ))
                .collect(Collectors.toList());

        try {
            webClientBuilder.build()
                    .post()
                    .uri(EXPO_PUSH_URL)
                    .header("Content-Type",   "application/json")
                    .header("Accept",         "application/json")
                    .header("Accept-Encoding","gzip, deflate")
                    .bodyValue(messages)
                    .retrieve()
                    .bodyToMono(String.class)
                    .subscribe(
                            response -> log.debug("Expo push sent to {} token(s)", tokens.size()),
                            error    -> log.warn("Expo push failed: {}", error.getMessage())
                    );
        } catch (Exception e) {
            log.warn("Could not dispatch push notification: {}", e.getMessage());
        }
    }
}
