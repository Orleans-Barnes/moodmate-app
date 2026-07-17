package com.moodmate.journal.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "journal_entries")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JournalEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String body;

    @Column(name = "mood_emoji")
    private String moodEmoji;

    // Feature 12 (Favorites). Defaults to false for both new entries and pre-existing rows
    // (V2 migration sets a NOT NULL DEFAULT FALSE), so this never comes back null.
    @Column(name = "is_favorite", nullable = false)
    @Builder.Default
    private boolean favorite = false;

    // Feature 12 (Tags). Plain side table (journal_entry_tags), not a Postgres array column, so
    // it stays queryable with ordinary JPQL joins - see V2 migration's comment.
    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "journal_entry_tags", joinColumns = @JoinColumn(name = "entry_id"))
    @Column(name = "tag")
    @Builder.Default
    private Set<String> tags = new HashSet<>();

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    void onCreate() {
        Instant now = Instant.now();
        if (createdAt == null) {
            createdAt = now;
        }
        updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }
}
