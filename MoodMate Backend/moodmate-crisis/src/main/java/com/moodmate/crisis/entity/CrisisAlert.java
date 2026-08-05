package com.moodmate.crisis.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "crisis_alerts")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class CrisisAlert {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "trigger_text", nullable = false, columnDefinition = "TEXT")
    private String triggerText;

    // Comma-joined, e.g. "suicide, self-harm" - the caller (moodmate-ai / moodmate-journal) does
    // the keyword matching and just passes the already-matched list here for a counsellor to see
    // at a glance; this service doesn't run any detection logic itself.
    @Column(name = "matched_keywords", nullable = false, length = 500)
    private String matchedKeywords;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private CrisisSeverity severity;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private CrisisSource source;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private CrisisStatus status = CrisisStatus.OPEN;

    @Column(name = "handled_by_counsellor_id")
    private Long handledByCounsellorId;

    @Column(name = "resolution_notes", columnDefinition = "TEXT")
    private String resolutionNotes;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "acknowledged_at")
    private Instant acknowledgedAt;

    @Column(name = "resolved_at")
    private Instant resolvedAt;

    @PrePersist
    void onCreate() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }
}
