package com.moodmate.wellness.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.time.LocalDate;

/** One row per (habit, date) a user marked that habit done - see the UNIQUE constraint in
 * V4__add_habits.sql. This is the source of truth for habit history/statistics; Habit's own
 * streakCount/lastCompletedDate fields are a denormalized cache kept in sync by HabitService. */
@Entity
@Table(name = "habit_completions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HabitCompletion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "habit_id", nullable = false)
    private Long habitId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "completion_date", nullable = false)
    private LocalDate completionDate;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    void onCreate() {
        if (createdAt == null) createdAt = Instant.now();
    }
}
