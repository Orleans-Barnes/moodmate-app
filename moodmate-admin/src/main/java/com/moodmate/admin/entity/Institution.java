package com.moodmate.admin.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
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

/** Institution Management (Milestone). Replaces the frontend's hardcoded ghana.ts catalogue as the
 * source of truth for signup's institution picker (GET /api/public/institutions) and adds an admin
 * CRUD surface, following the exact same shape/CRUD pattern as FeatureFlag in this module.
 *
 * The last four fields (website, logoUrl, licenseType, licenseExpiry, studentLimit) are nullable
 * and unused by any endpoint yet - they exist now so the future Institution Licensing & Premium
 * Access milestone (institutions purchasing seats for their students) can build directly on this
 * entity without another migration. Nothing reads or writes them today; do not build UI/endpoints
 * around them until that milestone actually starts. */
@Entity
@Table(name = "institutions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Institution {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 255)
    private String name;

    @Column(name = "short_name", nullable = false, length = 50)
    private String shortName;

    @Column(length = 100)
    private String city;

    @Column(nullable = false, length = 100)
    private String country;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private InstitutionType type;

    @Column(nullable = false)
    private boolean active;

    @Column(length = 255)
    private String website;

    @Column(name = "logo_url", length = 500)
    private String logoUrl;

    // ── Future licensing fields (Institution Licensing & Premium Access milestone) - nullable,
    // not yet exposed via any endpoint. See class doc comment. ──────────────────────────────────
    @Column(name = "license_type", length = 50)
    private String licenseType;

    @Column(name = "license_expiry")
    private LocalDate licenseExpiry;

    @Column(name = "student_limit")
    private Integer studentLimit;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    void onCreate() {
        Instant now = Instant.now();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }
}
