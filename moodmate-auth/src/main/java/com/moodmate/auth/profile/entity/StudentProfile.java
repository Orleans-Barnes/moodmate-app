package com.moodmate.auth.profile.entity;

import com.moodmate.auth.profile.enums.Programme;
import com.moodmate.auth.profile.enums.YearOfStudy;
import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;

/**
 * Academic identity — Phase 1C-i. Deliberately a plain `userId` field, not a `@OneToOne User`
 * relationship (matches EmergencyContact.java's existing precedent): User never needs to
 * eagerly/lazily load this, so there's no proxy or N+1 risk, and User.java stays completely
 * untouched by this feature. Lazily created — no row exists until the student saves the
 * profile-completion flow at least once (see StudentProfileService.save()).
 */
@Entity
@Table(name = "student_profiles")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class StudentProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false, unique = true)
    private Long userId;

    @Enumerated(EnumType.STRING)
    private Programme programme;

    @Enumerated(EnumType.STRING)
    @Column(name = "year_of_study")
    private YearOfStudy yearOfStudy;

    // Optimistic locking (Phase 1C-i.6) - Hibernate manages this entirely (initializes to 0 on
    // insert, increments on every update, rejects a stale-based update with
    // ObjectOptimisticLockingFailureException). Deliberately not @Builder.Default - manually
    // setting a starting value here would fight Hibernate's own management of it.
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
