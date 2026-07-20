package com.moodmate.notifications.controller;

import com.moodmate.notifications.dto.CreateNotificationRequest;
import com.moodmate.notifications.dto.NotificationResponse;
import com.moodmate.notifications.service.NotificationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Internal service-to-service endpoint - deliberately NOT registered in
 * moodmate-gateway/application.yml, same pattern as moodmate-crisis's InternalCrisisAlertController
 * and moodmate-wallet's InternalWalletController (see the gateway's crisis-service route comment:
 * "/internal/crisis/** is NOT routed here on purpose"). Only reachable by another service calling
 * this one directly on its own port (8102), never through the public gateway at :8080 - the path
 * prefix /internal/** is the convention this project already uses to mark that.
 *
 * Every other service (moodmate-support, moodmate-mood, moodmate-journal, moodmate-wellness,
 * moodmate-gamification, moodmate-admin, moodmate-ai) becomes a producer by calling this endpoint
 * directly (a new NotificationServiceClient in each, matching the existing *ServiceClient pattern
 * e.g. moodmate-support's AuthServiceClient) rather than writing into this service's schema.
 *
 * No X-User-Id header is expected or read here - the target user is req.userId(), supplied by the
 * calling service, since this call is never made on behalf of "the currently authenticated user"
 * the way every gateway-routed endpoint is.
 */
@RestController
@RequestMapping("/internal/notifications")
@RequiredArgsConstructor
public class InternalNotificationController {

    private final NotificationService notificationService;

    @PostMapping
    public ResponseEntity<NotificationResponse> create(@Valid @RequestBody CreateNotificationRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(notificationService.create(req));
    }
}
