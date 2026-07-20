package com.moodmate.support.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Did not exist in the pre-existing service stub at all - the stub only modeled counsellors.
 * Ported from the monolith's support.PeerMentor. */
@Entity
@Table(name = "peer_mentors")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PeerMentor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Phase 1G - the account this roster entry belongs to, once linked. Null for seeded rows
     * that pre-date account linkage - same pattern as Counsellor.userId (see that field's doc
     * comment). Set by SupportService.linkMentorAccount. */
    @Column(name = "user_id")
    private Long userId;

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String bio;

    @Column(name = "avatar_emoji", nullable = false)
    private String avatarEmoji;

    @Column(name = "focus_area")
    private String focusArea;

    @Column(name = "is_available", nullable = false)
    private boolean available;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder;
}
