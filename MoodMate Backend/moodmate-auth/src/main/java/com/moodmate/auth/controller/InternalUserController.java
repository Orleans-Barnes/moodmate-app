package com.moodmate.auth.controller;

import com.moodmate.auth.dto.InstitutionIdResponse;
import com.moodmate.auth.dto.ModerationReasonRequest;
import com.moodmate.auth.dto.ModerationStatusResponse;
import com.moodmate.auth.dto.RoleUpdateRequest;
import com.moodmate.auth.dto.UserSummary;
import com.moodmate.auth.profile.dto.NotificationPreferenceResponse;
import com.moodmate.auth.profile.service.NotificationPreferenceService;
import com.moodmate.auth.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

/**
 * Service-to-service only. Deliberately NOT under /api/users/** - the gateway already has a
 * "user-profile" route that forwards ALL of /api/users/** (with a valid JWT) to this service, so
 * if these had stayed at /api/users/{id}/summary and /api/users/summaries, any logged-in user
 * could have called them directly to look up any other user's name/email/avatar by id. This
 * controller sits on a path no gateway route matches, so it's only reachable by another service
 * calling auth-service directly on its internal address/port (8091) - never through the gateway's
 * public port 8080. Same fix applied to wallet-service's internal credit endpoint - see
 * moodmate-wallet's InternalWalletController for the mirror of this mistake caught in review.
 */
@RestController
@RequestMapping("/internal/users")
@RequiredArgsConstructor
public class InternalUserController {

    private final AuthService authService;
    private final NotificationPreferenceService notificationPreferenceService;

    // Phase 1E, Step 5 (Expo Push) - moodmate-notifications' AuthServiceClient reads this before
    // deciding whether to actually send a push for a given notification (per-type toggle + quiet
    // hours), same internal-only reasoning as every other endpoint in this controller. Reuses
    // NotificationPreferenceService.get() unmodified - it already takes a userId parameter rather
    // than reading "the current user," so no new service-layer code was needed, only this route.
    @GetMapping("/{userId}/notification-preferences")
    public NotificationPreferenceResponse notificationPreferences(@PathVariable Long userId) {
        return notificationPreferenceService.get(userId);
    }

    @GetMapping("/{userId}/summary")
    public UserSummary summary(@PathVariable Long userId) {
        return authService.getUserSummary(userId);
    }

    @PostMapping("/summaries")
    public Map<Long, UserSummary> summaries(@RequestBody List<Long> userIds) {
        return authService.getUserSummaries(userIds);
    }

    @PostMapping("/{userId}/role")
    public UserSummary updateRole(@PathVariable Long userId, @Valid @RequestBody RoleUpdateRequest request) {
        return authService.updateRole(userId, request.role());
    }

    // Institution Management (Milestone 2, Step 3-4) - read by moodmate-wallet's AuthServiceClient.
    @GetMapping("/{userId}/institution-id")
    public InstitutionIdResponse institutionId(@PathVariable Long userId) {
        return new InstitutionIdResponse(authService.getInstitutionId(userId));
    }

    // ── Feature 7 (Community Moderation) - additive. Called by moodmate-community's
    // ModerationService when an admin acts on a moderation queue item, same internal-only,
    // gateway-unreachable path as everything else in this controller. ─────────────────────────────

    @PostMapping("/{userId}/ban")
    public ModerationStatusResponse ban(@PathVariable Long userId, @RequestBody ModerationReasonRequest request) {
        return authService.banUser(userId, request.reason());
    }

    @PostMapping("/{userId}/unban")
    public ModerationStatusResponse unban(@PathVariable Long userId) {
        return authService.unbanUser(userId);
    }

    @PostMapping("/{userId}/warn")
    public ModerationStatusResponse warn(@PathVariable Long userId, @RequestBody ModerationReasonRequest request) {
        return authService.warnUser(userId, request.reason());
    }
}
