package com.moodmate.notifications.controller;

import com.moodmate.notifications.dto.NotificationResponse;
import com.moodmate.notifications.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/** Public, gateway-routed (/api/notifications/**, JwtAuthFilter applied - see
 *  moodmate-gateway/application.yml). Every endpoint here is scoped to the calling user via the
 *  X-User-Id header the gateway injects, same pattern as every other per-user-scoped controller
 *  in this project (WellnessPreferenceController, SupportService's student-facing endpoints). */
@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    public Page<NotificationResponse> list(@RequestHeader("X-User-Id") Long userId,
                                            @PageableDefault(size = 20) Pageable pageable) {
        return notificationService.list(userId, pageable);
    }

    @GetMapping("/unread-count")
    public Map<String, Long> unreadCount(@RequestHeader("X-User-Id") Long userId) {
        return Map.of("unreadCount", notificationService.unreadCount(userId));
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<NotificationResponse> markRead(@RequestHeader("X-User-Id") Long userId,
                                                            @PathVariable Long id) {
        return ResponseEntity.ok(notificationService.markRead(userId, id));
    }

    @PatchMapping("/read-all")
    public ResponseEntity<Void> markAllRead(@RequestHeader("X-User-Id") Long userId) {
        notificationService.markAllRead(userId);
        return ResponseEntity.noContent().build();
    }
}
