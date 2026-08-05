package com.moodmate.auth.profile.entity;

import com.moodmate.auth.profile.enums.Challenge;
import com.moodmate.auth.profile.enums.PreferredSupport;
import com.moodmate.auth.profile.enums.WellnessGoal;
import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
import java.util.HashSet;
import java.util.Set;

/**
 * Personalization — Phase 1C-i. Kept separate from StudentProfile (academic identity changes
 * rarely; goals/challenges/support preference can change every semester). Side-table collections
 * mirror moodmate-journal's JournalEntry.tags (@ElementCollection) pattern for the same reason
 * documented there: stays queryable/indexable per-value, unlike a single array/CSV column.
 *
 * completedAt/skippedAt/lastPromptedAt exist because "a row exists" is not the same as "the user
 * finished onboarding" — a user can save one field and leave. completedAt != null is the only
 * source of truth for completion; skippedAt + lastPromptedAt together drive a 7-day
 * skip-reminder cooldown (see ProfileCompletionService) without renagging on every app open.
 */
@Entity
@Table(name = "wellness_preferences")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class WellnessPreference {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false, unique = true)
    private Long userId;

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "wellness_preference_goals", joinColumns = @JoinColumn(name = "preference_id"))
    @Enumerated(EnumType.STRING)
    @Column(name = "goal")
    @Builder.Default
    private Set<WellnessGoal> goals = new HashSet<>();

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "wellness_preference_challenges", joinColumns = @JoinColumn(name = "preference_id"))
    @Enumerated(EnumType.STRING)
    @Column(name = "challenge")
    @Builder.Default
    private Set<Challenge> challenges = new HashSet<>();

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "wellness_preference_support_types", joinColumns = @JoinColumn(name = "preference_id"))
    @Enumerated(EnumType.STRING)
    @Column(name = "support_type")
    @Builder.Default
    private Set<PreferredSupport> preferredSupport = new HashSet<>();

    @Column(name = "completed_at")
    private Instant completedAt;

    @Column(name = "skipped_at")
    private Instant skippedAt;

    @Column(name = "last_prompted_at")
    private Instant lastPromptedAt;

    // Optimistic locking (Phase 1C-i.6) - same reasoning as StudentProfile.version.
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
