package com.moodmate.auth.profile.controller;

import com.moodmate.auth.profile.dto.NotificationPreferenceRequest;
import com.moodmate.auth.profile.dto.NotificationPreferenceResponse;
import com.moodmate.auth.profile.service.NotificationPreferenceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/** Phase 1E, Step 1. Same route family as WellnessPreferenceController:
 *  /api/users/me/notification-preferences. Always returns 200 (get() creates defaults lazily),
 *  never 404 - see NotificationPreferenceService's doc comment for why this differs from
 *  WellnessPreferenceController's Optional-based get(). */
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class NotificationPreferenceController {

    private final NotificationPreferenceService notificationPreferenceService;

    @GetMapping("/me/notification-preferences")
    public ResponseEntity<NotificationPreferenceResponse> get(@RequestHeader("X-User-Id") Long userId) {
        return ResponseEntity.ok(notificationPreferenceService.get(userId));
    }

    @PutMapping("/me/notification-preferences")
    public ResponseEntity<NotificationPreferenceResponse> save(@RequestHeader("X-User-Id") Long userId,
                                                                  @RequestBody NotificationPreferenceRequest req) {
        return ResponseEntity.ok(notificationPreferenceService.save(userId, req));
    }
}
