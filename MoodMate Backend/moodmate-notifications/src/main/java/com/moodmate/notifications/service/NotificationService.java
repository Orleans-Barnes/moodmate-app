package com.moodmate.notifications.service;

import com.moodmate.notifications.client.AuthServiceClient;
import com.moodmate.notifications.client.dto.NotificationPreferences;
import com.moodmate.notifications.dto.CreateNotificationRequest;
import com.moodmate.notifications.dto.NotificationResponse;
import com.moodmate.notifications.entity.Notification;
import com.moodmate.notifications.entity.NotificationStatus;
import com.moodmate.notifications.exception.ApiException;
import com.moodmate.notifications.mapper.NotificationMapper;
import com.moodmate.notifications.repository.NotificationRepository;
import com.moodmate.notifications.scheduling.rules.PushGatingRule;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalTime;
import java.time.ZoneOffset;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository repo;
    private final AuthServiceClient authServiceClient;

    @Transactional(readOnly = true)
    public Page<NotificationResponse> list(Long userId, Pageable pageable) {
        return repo.findByUserIdOrderByCreatedAtDesc(userId, pageable).map(NotificationMapper::toDto);
    }

    @Transactional(readOnly = true)
    public long unreadCount(Long userId) {
        return repo.countByUserIdAndReadAtIsNull(userId);
    }

    /** Marking read implies delivered - a notification the user has opened was, by definition,
     * seen, so this also stamps deliveredAt if it was somehow still null (e.g. a PENDING row the
     * in-app inbox rendered directly, with no separate delivery step in between). Idempotent: a
     * second call finds readAt already set and leaves it untouched, same pattern as
     * WellnessPreferenceService.complete(). */
    @Transactional
    public NotificationResponse markRead(Long userId, Long id) {
        Notification n = repo.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ApiException("Notification not found: " + id, HttpStatus.NOT_FOUND));
        if (n.getReadAt() == null) {
            Instant now = Instant.now();
            n.setReadAt(now);
            if (n.getDeliveredAt() == null) n.setDeliveredAt(now);
            n.setStatus(NotificationStatus.READ);
        }
        return NotificationMapper.toDto(repo.save(n));
    }

    @Transactional
    public void markAllRead(Long userId) {
        Instant now = Instant.now();
        repo.findByUserIdAndReadAtIsNull(userId).forEach(n -> {
            n.setReadAt(now);
            if (n.getDeliveredAt() == null) n.setDeliveredAt(now);
            n.setStatus(NotificationStatus.READ);
        });
        // findByUserIdAndReadAtIsNull returns managed entities within this transaction - no
        // explicit saveAll() needed, dirty checking flushes the changes on commit. Kept explicit
        // logging only (no return value) since callers only need "it happened", not the list.
        log.info("Marked all notifications read for user {}", userId);
    }

    /** Internal-only: called by other services via POST /internal/notifications, never by the
     * gateway/frontend directly - see InternalNotificationController's doc comment.
     *
     * Phase 1E, Step 5 (Expo Push) added two things here, both applying uniformly regardless of
     * which service/scheduled job called this: (1) a non-future notification is marked DELIVERED
     * immediately, since the in-app inbox is available to the user right away - see
     * NotificationStatus's doc comment ("in-app inbox counts as delivery"); a future (SCHEDULED)
     * one is left alone, since it genuinely isn't visible yet. (2) a best-effort push attempt via
     * AuthServiceClient, gated by PushGatingRule (per-type preference toggle + quiet hours) - push
     * delivery is a separate channel layered on top of the in-app row, so a push failure or a
     * gating "no" never affects the notification's own status or this method's return value. */
    @Transactional
    public NotificationResponse create(CreateNotificationRequest req) {
        Instant now = Instant.now();
        boolean isFuture = req.scheduledAt() != null && req.scheduledAt().isAfter(now);
        Notification n = Notification.builder()
                .userId(req.userId())
                .type(req.type())
                .title(req.title())
                .body(req.body())
                .destinationScreen(req.destinationScreen())
                .destinationParams(req.destinationParams())
                .scheduledAt(req.scheduledAt())
                .metadata(req.metadata())
                .status(isFuture ? NotificationStatus.SCHEDULED : NotificationStatus.DELIVERED)
                .deliveredAt(isFuture ? null : now)
                .build();
        Notification saved = repo.save(n);

        if (!isFuture) {
            attemptPush(saved);
        }

        return NotificationMapper.toDto(saved);
    }

    private void attemptPush(Notification n) {
        NotificationPreferences preferences = authServiceClient.getPreferences(n.getUserId()).orElse(null);
        boolean shouldPush = PushGatingRule.shouldPush(n.getType(), preferences, LocalTime.now(ZoneOffset.UTC));
        if (!shouldPush) return;

        // Milestone 9 (Notifications) - push payload destinationParams. Previously only "screen"
        // made it into the push data, so tapping a push landed you on the right screen but not,
        // say, the specific appointment/post it was about (an OS-push-specific limitation - the
        // in-app Notification Center's handleTap already threaded destinationParams through
        // correctly). App.tsx's push-tap handler now reads this same "params" key.
        Map<String, String> data = new HashMap<>();
        data.put("screen", n.getDestinationScreen() != null ? n.getDestinationScreen() : "");
        if (n.getDestinationParams() != null) {
            data.put("params", n.getDestinationParams());
        }
        authServiceClient.notify(n.getUserId(), n.getTitle(), n.getBody(), data);
    }
}
