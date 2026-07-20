package com.moodmate.admin.entity;

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
 * Pre-approved counsellor emails - lets an admin fast-track/pre-vet specific people before they
 * even file a self-serve counsellor request (see moodmate-support's CounsellorRequestInput flow).
 * No monolith counterpart - the frontend called this endpoint with nothing behind it at all; this
 * is the first table moodmate-admin owns outright (everything else it does is read-only queries
 * against other services' schemas - see AdminService's class-level doc comment).
 */
@Entity
@Table(name = "counsellor_whitelist")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WhitelistEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(length = 500)
    private String notes;

    @Column(name = "added_at", nullable = false)
    private Instant addedAt;

    @PrePersist
    void onCreate() {
        if (addedAt == null) {
            addedAt = Instant.now();
        }
    }
}
