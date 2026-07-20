package com.moodmate.auth.controller;

import com.moodmate.auth.dto.NotifyRequest;
import com.moodmate.auth.dto.NotifyResponse;
import com.moodmate.auth.dto.NotifyRoleRequest;
import com.moodmate.auth.entity.Role;
import com.moodmate.auth.service.NotificationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Service-to-service only, new for Feature 9 (Notification Deep Linking) - same internal-only,
 * gateway-unreachable path pattern as InternalUserController (no /api/push/** gateway route
 * predicate matches /internal/**, so this is only reachable by another service calling
 * auth-service directly on its internal address/port). Called by moodmate-wallet,
 * moodmate-support, and moodmate-crisis's respective AuthServiceClient/notify methods. */
@RestController
@RequestMapping("/internal/push")
@RequiredArgsConstructor
public class InternalPushController {

    private final NotificationService notificationService;

    @PostMapping("/notify")
    public NotifyResponse notify(@Valid @RequestBody NotifyRequest request) {
        return notificationService.notify(request.userId(), request.title(), request.body(), request.data());
    }

    @PostMapping("/notify-roles")
    public NotifyResponse notifyRoles(@Valid @RequestBody NotifyRoleRequest request) {
        return notificationService.notifyRoles(request.roles().stream().map(Role::valueOf).toList(),
                request.title(), request.body(), request.data());
    }
}
