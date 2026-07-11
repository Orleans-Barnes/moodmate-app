package com.moodmate.backend.crisis;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

/**
 * Stores a flagged message or journal entry that matched crisis keyword patterns.
 * Counsellors can acknowledge and resolve alerts; admins see aggregate counts only.
 */
@Entity
@Table(name = "crisis_alerts")
@Getter @Setter @NoArgsConstructor
@Builder
@AllArgsConstructor
public class CrisisAlert {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "trigger_text", nullable = false, length = 500)
    private String triggerText;

    @Column(name = "matched_keywords", nullable = false)
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

    @Column(name = "resolution_notes", length = 1000)
    private String resolutionNotes;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "acknowledged_at")
    private Instant acknowledgedAt;

    @Column(name = "resolved_at")
    private Instant resolvedAt;
}
