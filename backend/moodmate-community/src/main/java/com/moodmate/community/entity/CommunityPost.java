package com.moodmate.community.entity;

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

/** flagged/flagReason are additive columns, not in the monolith - kept from the pre-existing
 * stub's admin moderation feature (flag/clear-flag/remove a post), which is reasonable to have
 * even though the monolith never built it. Everything else here matches the monolith exactly. */
@Entity
@Table(name = "community_posts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CommunityPost {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "author_id", nullable = false)
    private Long authorId;

    /** Generated fresh per post by AnonymousHandleGenerator - not a stable per-user pseudonym. */
    @Column(name = "anonymous_handle", nullable = false, length = 50)
    private String anonymousHandle;

    @Column(nullable = false, length = 50)
    private String topic;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "is_flagged", nullable = false)
    @Builder.Default
    private boolean flagged = false;

    @Column(name = "flag_reason")
    private String flagReason;

    @PrePersist
    void onCreate() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }
}
