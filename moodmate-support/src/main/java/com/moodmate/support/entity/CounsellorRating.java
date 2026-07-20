package com.moodmate.support.entity;

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

/** Fix #5 (rating/review system) - one rating per COMPLETED counsellor appointment, submitted by
 * the student who booked it. Deliberately scoped to counsellors only, not peer mentors: an
 * appointment is a single bounded session with a clear "it just ended" moment to prompt a rating;
 * a mentor "session" is just an open-ended chat with no equivalent moment (see the scoping decision
 * this fix was built under). appointmentId is unique - findOwnedAppointment + the unique constraint
 * on appointment_id (migration V7) together make this "one rating per appointment", not "one rating
 * per student per counsellor", matching how a real review site works (you review the visit, not the
 * business as a standing relationship). */
@Entity
@Table(name = "counsellor_ratings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CounsellorRating {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "appointment_id", nullable = false, unique = true)
    private Long appointmentId;

    @Column(name = "counsellor_id", nullable = false)
    private Long counsellorId;

    @Column(name = "student_user_id", nullable = false)
    private Long studentUserId;

    @Column(nullable = false)
    private int stars;

    @Column(columnDefinition = "TEXT")
    private String comment;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @PrePersist
    void onCreate() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }
}
