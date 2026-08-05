package com.moodmate.wellness.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.time.LocalDate;

/**
 * A user-defined habit (distinct from the templated {@link DailyGoalTemplate} rows - habits are
 * created, named, and deleted by the user themselves, each with its own independent streak). See
 * HabitTrackerScreen.tsx on the frontend for the exact shape this is serialized to.
 */
@Entity
@Table(name = "habits")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Habit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, length = 10)
    @Builder.Default
    private String icon = "✅";

    @Column(nullable = false, length = 20)
    @Builder.Default
    private String color = "#52B788";

    @Column(name = "xp_per_completion", nullable = false)
    @Builder.Default
    private int xpPerCompletion = 10;

    @Column(name = "streak_count", nullable = false)
    @Builder.Default
    private int streakCount = 0;

    @Column(name = "last_completed_date")
    private LocalDate lastCompletedDate;

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
