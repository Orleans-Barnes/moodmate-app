package com.moodmate.support.client;

import com.moodmate.support.config.ServiceClientsProperties;
import com.moodmate.support.exception.ApiException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.util.List;
import java.util.Map;

/**
 * Direct (non-gateway) service-to-service calls to auth-service. Three uses, all replacing things
 * the monolith did in-process on the shared `users` table:
 *  1. getUserSummary - resolve a requester's name/avatar when they file a counsellor request
 *     (SupportService.requestCounsellorStatus).
 *  2. getUserSummaries - batch-resolve student names for a counsellor's appointment/conversation
 *     lists (SupportService.listCounsellorAppointments / listCounsellorConversations).
 *  3. promoteToCounsellor - replaces the monolith's in-process CounsellorApprovedEvent ->
 *     CounsellorRoleGrantor listener, fired when an admin approves a self-serve counsellor
 *     request. See auth-service's InternalUserController.updateRole for the receiving end.
 *
 * notify() was added for Feature 9 (Notification Deep Linking) - Counsellor Message Routing and
 * Appointment Routing. Unlike getUserSummary/getUserSummaries/promoteToCounsellor above (critical
 * reads/writes the caller can't proceed without), a failed notification must never fail a message
 * send or an appointment status change that already succeeded, so this deliberately swallows
 * RestClientException (logged, not rethrown) rather than throwing ApiException.
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

    public Map<Long, UserSummary> getUserSummaries(List<Long> userIds) {
        if (userIds.isEmpty()) {
            return Map.of();
        }
        try {
            Map<Long, UserSummary> summaries = restClient().post()
                    .uri("/internal/users/summaries")
                    .body(userIds)
                    .retrieve()
                    .body(new ParameterizedTypeReference<Map<Long, UserSummary>>() {});
            return summaries == null ? Map.of() : summaries;
        } catch (RestClientException e) {
            throw new ApiException("Could not reach auth-service to resolve users: " + e.getMessage(),
                    HttpStatus.BAD_GATEWAY);
        }
    }

    public void promoteToCounsellor(Long userId) {
        try {
            restClient().patch()
                    .uri("/internal/users/{id}/role", userId)
                    .body(new RoleUpdateRequest("COUNSELLOR"))
                    .retrieve()
                    .toBodilessEntity();
        } catch (RestClientException e) {
            throw new ApiException("Could not reach auth-service to promote user " + userId + " to COUNSELLOR: " + e.getMessage(),
                    HttpStatus.BAD_GATEWAY);
        }
    }

    // Phase 1G - mirrors promoteToCounsellor exactly, fired when an admin links a userId to an
    // existing peer_mentors row (SupportService.linkMentorAccount) rather than through a self-serve
    // request/approve flow like counsellors have - see linkMentorAccount's doc comment for why.
    public void promoteToMentor(Long userId) {
        try {
            restClient().patch()
                    .uri("/internal/users/{id}/role", userId)
                    .body(new RoleUpdateRequest("MENTOR"))
                    .retrieve()
                    .toBodilessEntity();
        } catch (RestClientException e) {
            throw new ApiException("Could not reach auth-service to promote user " + userId + " to MENTOR: " + e.getMessage(),
                    HttpStatus.BAD_GATEWAY);
        }
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
