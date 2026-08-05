package com.moodmate.notifications.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

/**
 * Phase 1E, Step 2. The actual notification/inbox row - distinct from moodmate-auth's
 * NotificationPreference (Step 1), which is per-user settings, not events. This service owns the
 * notification's full lifecycle (created -> scheduled/delivered -> read) regardless of which
 * other service produced it (support, mood, journal, wellness, gamification, admin, ai) and
 * regardless of eventual delivery channel (in-app inbox now; Expo Push/FCM/email layered on later
 * per Step 5 - none of those require a schema change, only a new delivery-side consumer of this
 * same table).
 *
 * destinationScreen/destinationParams mirror the frontend's RootStackParamList route name + its
 * params (JSON-encoded) - resolved to a real navigation.navigate() call by the client, the same
 * separation of concerns recommendationEngine.ts's RecommendationAction already established:
 * this service decides WHAT happened and WHERE it should route to, never how navigation itself
 * works.
 */
@Entity
@Table(name = "notifications")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private NotificationType type;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(nullable = false, length = 1000)
    private String body;

    @Column(name = "destination_screen")
    private String destinationScreen;

    /** JSON-encoded params object for destinationScreen, e.g. {"conversationId": 42} - plain TEXT
     * rather than a typed side-table since these vary entirely by notification type and are only
     * ever read back opaquely by the client, never queried on server-side. */
    @Column(name = "destination_params", columnDefinition = "TEXT")
    private String destinationParams;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private NotificationStatus status = NotificationStatus.PENDING;

    @Column(name = "scheduled_at")
    private Instant scheduledAt;

    @Column(name = "delivered_at")
    private Instant deliveredAt;

    @Column(name = "read_at")
    private Instant readAt;

    /** Free-form JSON for anything type-specific that isn't worth its own column (e.g. a source
     * service name for debugging, an achievement key) - opaque to this service, never parsed
     * here, same "TEXT, read back by the client only" reasoning as destinationParams. */
    @Column(columnDefinition = "TEXT")
    private String metadata;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    void onCreate() {
        if (createdAt == null) createdAt = Instant.now();
    }
}
