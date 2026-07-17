package com.moodmate.gamification.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "user_achievements")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserAchievement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "achievement_key", nullable = false)
    private String achievementKey;

    @Column(name = "earned_at", nullable = false, updatable = false)
    private Instant earnedAt;

    // Field initializers on a @Builder entity get silently dropped unless annotated
    // @Builder.Default - using @PrePersist instead keeps this consistent with every other
    // timestamped entity across the other services (Appointment, SupportMessage, CommunityPost...).
    @PrePersist
    void onCreate() {
        if (earnedAt == null) {
            earnedAt = Instant.now();
        }
    }
}
