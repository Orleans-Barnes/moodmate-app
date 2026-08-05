package com.moodmate.wellness.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "sleep_goals")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SleepGoal {

    @Id
    @Column(name = "user_id")
    private Long userId;

    @Column(name = "target_minutes", nullable = false)
    @Builder.Default
    private int targetMinutes = 480;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    @PreUpdate
    void touch() {
        updatedAt = Instant.now();
    }
}
