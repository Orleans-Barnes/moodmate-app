package com.moodmate.ai.entity;

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

/** New for Feature 11 (AI Safety Improvements). One row per user (user_id UNIQUE) - re-
 * acknowledging just updates the existing row's version/timestamp rather than accumulating a
 * history, since only "did they acknowledge the current version" matters, not a full audit trail
 * of every acknowledgement ever made. */
@Entity
@Table(name = "ai_disclaimer_acknowledgements")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DisclaimerAcknowledgement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false, unique = true)
    private Long userId;

    @Column(name = "acknowledged_version", nullable = false)
    private int acknowledgedVersion;

    @Column(name = "acknowledged_at", nullable = false)
    private Instant acknowledgedAt;

    @PrePersist
    void onCreate() {
        if (acknowledgedAt == null) {
            acknowledgedAt = Instant.now();
        }
    }
}
