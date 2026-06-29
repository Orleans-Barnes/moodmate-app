package com.moodmate.backend.wellness;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.time.LocalDate;

/** 1:1 with users - the row is created automatically by WellnessProfileInitializer on signup. */
@Entity
@Table(name = "wellness_profiles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WellnessProfile {

    @Id
    @Column(name = "user_id")
    private Long userId;

    @Column(name = "tree_xp", nullable = false)
    private int treeXp;

    @Enumerated(EnumType.STRING)
    @Column(name = "tree_stage", nullable = false)
    private GoalEngine.TreeStage treeStage;

    @Column(name = "tree_skin_id", nullable = false)
    private Long treeSkinId;

    @Column(name = "leaf_balance", nullable = false)
    private int leafBalance;

    @Column(name = "streak_count", nullable = false)
    private int streakCount;

    @Column(name = "last_all_goals_completed_date")
    private LocalDate lastAllGoalsCompletedDate;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    @PreUpdate
    void touch() {
        updatedAt = Instant.now();
    }
}
