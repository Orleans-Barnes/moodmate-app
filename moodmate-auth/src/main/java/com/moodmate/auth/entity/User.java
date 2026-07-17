package com.moodmate.auth.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;

@Entity @Table(name = "users")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class User {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(name = "password_hash")
    private String passwordHash;

    @Column(name = "full_name", nullable = false)
    private String fullName;

    private String institution;

    // Null until the user uploads a real photo via POST /api/users/me/avatar - avatarEmoji stays
    // the fallback the frontend renders when this is null (see UserProfile.avatarUrl in
    // src/api/types.ts). Stores a full URL (built by AvatarStorageService), not a bare filename,
    // so the frontend can drop it straight into an <Image source={{uri:...}}> with no extra logic.
    @Column(name = "avatar_url", length = 500)
    private String avatarUrl;

    // @Builder.Default matters here: without it, Lombok's builder() goes through the all-args
    // constructor and silently drops these field initializers, so User.builder().build() (used
    // everywhere in AuthService) would previously persist avatarEmoji=null, guest=false (ok, it's
    // a primitive), role=null, and createdAt=null instead of the intended defaults.
    @Column(name = "avatar_emoji", nullable = false)
    @Builder.Default
    private String avatarEmoji = "🙂";

    @Column(name = "is_guest", nullable = false)
    @Builder.Default
    private boolean guest = false;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private Role role = Role.STUDENT;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    // ── Feature 7 (Community Moderation) - additive, not in the monolith ────────────────────────
    @Column(nullable = false)
    @Builder.Default
    private boolean banned = false;

    @Column(name = "banned_reason")
    private String bannedReason;

    @Column(name = "banned_at")
    private Instant bannedAt;

    /** Running total, never auto-reset (including on unban) - see V8 migration comment. */
    @Column(name = "warning_count", nullable = false)
    @Builder.Default
    private int warningCount = 0;

    @PrePersist
    void onCreate() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }
}
