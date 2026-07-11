package com.moodmate.backend.admin;

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

/**
 * An email address pre-approved to hold the COUNSELLOR role.
 *
 * Login gate (enforced in AuthService.login):
 *   • Email IS in this table     → auto-promoted to COUNSELLOR on next login.
 *   • Email is NOT in this table → login blocked if user already holds COUNSELLOR role.
 *
 * Does NOT gate signup — all signups produce STUDENT accounts.
 * Managed by admin via GET/POST/DELETE /api/admin/whitelist.
 */
@Entity
@Table(name = "counsellor_whitelist")
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CounsellorWhitelist {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Always stored lowercase; AuthService normalises before insert and lookup. */
    @Column(nullable = false, unique = true, length = 255)
    @Setter private String email;

    /** Optional admin note, e.g. institution or referral source. */
    @Column(length = 500)
    @Setter private String notes;

    /** Timezone-aware — stored as UTC. Never modified after creation. */
    @Column(name = "added_at", nullable = false, updatable = false)
    private Instant addedAt;

    @PrePersist
    void prePersist() {
        if (addedAt == null) addedAt = Instant.now();
    }
}
