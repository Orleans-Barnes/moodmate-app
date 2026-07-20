package com.moodmate.wellness.entity;

import com.moodmate.wellness.engine.GoalEngine;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.time.LocalDate;

/**
 * 1:1 with a user. Trimmed from the monolith's version: leafBalance and treeSkinId moved to
 * wallet-service's LeafWallet, since money/cosmetics ownership belongs there now. This service
 * fetches those two values from wallet-service (see WalletServiceClient) when building
 * WellnessStateResponse, instead of reading them off this row.
 *
 * Unlike the monolith (where WellnessProfileInitializer created this row eagerly on signup via an
 * in-process Spring event), this row is created lazily on first read/write - see
 * WellnessService.getOrCreateProfile() - since there's no cross-service event bus wired up yet.
 */
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
    @Builder.Default
    private int treeXp = 0;

    @Enumerated(EnumType.STRING)
    @Column(name = "tree_stage", nullable = false)
    @Builder.Default
    private GoalEngine.TreeStage treeStage = GoalEngine.TreeStage.ROOTS;

    @Column(name = "streak_count", nullable = false)
    @Builder.Default
    private int streakCount = 0;

    @Column(name = "last_all_goals_completed_date")
    private LocalDate lastAllGoalsCompletedDate;

    // Purchased via POST /api/wellness/streak/shield (costs leaves - see TreeProperties'
    // streakShieldCostLeaves). At most one active at a time. Consumed automatically the next time
    // GoalEngine.reconcile() detects a broken streak (more than one full day since
    // lastAllGoalsCompletedDate) - see WellnessService.reconcileProfile(), called on every read
    // AND at the start of every toggle, so this is never stale.
    @Column(name = "has_streak_shield", nullable = false)
    @Builder.Default
    private boolean hasStreakShield = false;

    // Purchased via POST /api/wellness/boosts/double-xp (Feature 14 - Shop Improvements, costs
    // leaves - see TreeProperties' doubleXpCostLeaves). Null when no boost is active. Unlike
    // hasStreakShield, this needs no explicit "consumed" flag/reconcile step - it's purely
    // time-based and naturally stops applying once GoalEngine.applyToggle() sees `now` has passed
    // this instant, so it's left in place after expiry rather than cleared (harmless either way,
    // and avoids an extra write on every read just to null it out).
    @Column(name = "double_xp_active_until")
    private Instant doubleXpActiveUntil;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    @PreUpdate
    void touch() {
        updatedAt = Instant.now();
    }
}
