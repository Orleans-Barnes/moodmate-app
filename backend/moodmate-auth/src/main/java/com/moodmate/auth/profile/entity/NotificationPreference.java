package com.moodmate.auth.profile.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
import java.time.LocalTime;

/**
 * Phase 1E, Step 1. Per-user reminder toggles + quiet hours, synced to the backend so they survive
 * a reinstall/device switch and can eventually be read by Phase 1E Step 4's scheduling-rules job
 * (which runs server-side, not on the student's device). Deliberately has no completed_at/
 * skipped_at the way WellnessPreference does - there's no onboarding flow here, just settings with
 * sensible defaults (see V12 migration's doc comment).
 */
@Entity
@Table(name = "notification_preferences")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class NotificationPreference {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false, unique = true)
    private Long userId;

    @Column(name = "mood_reminders", nullable = false)
    @Builder.Default
    private boolean moodReminders = true;

    @Column(name = "journal_reminders", nullable = false)
    @Builder.Default
    private boolean journalReminders = true;

    @Column(name = "habit_reminders", nullable = false)
    @Builder.Default
    private boolean habitReminders = true;

    @Column(name = "sleep_reminders", nullable = false)
    @Builder.Default
    private boolean sleepReminders = true;

    @Column(name = "appointment_reminders", nullable = false)
    @Builder.Default
    private boolean appointmentReminders = true;

    @Column(name = "quiet_hours_start")
    private LocalTime quietHoursStart;

    @Column(name = "quiet_hours_end")
    private LocalTime quietHoursEnd;

    // Optimistic locking - same reasoning as StudentProfile.version / WellnessPreference.version.
    @Version
    @Column(nullable = false)
    private Long version;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    void onCreate() {
        Instant now = Instant.now();
        if (createdAt == null) createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }
}
