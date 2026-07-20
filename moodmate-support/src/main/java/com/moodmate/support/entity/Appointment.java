package com.moodmate.support.entity;

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

/** counsellorId is a plain column, not a @ManyToOne - the pre-existing stub used a JPA
 * relationship to Counsellor, which only worked because both tables lived in the same schema.
 * Once this schema is its own "support" schema on the shared instance, a cross-table FK-mapped
 * relationship is still fine (Counsellor lives in the same schema), but a plain id column matches
 * the monolith's actual column shape and keeps this entity simple to map straight from the
 * migration - see CounsellorRepository.findAllById() usage in SupportService for how names are
 * resolved without needing a join. */
@Entity
@Table(name = "appointments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Appointment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "counsellor_id", nullable = false)
    private Long counsellorId;

    @Column(name = "scheduled_at", nullable = false)
    private Instant scheduledAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private AppointmentStatus status = AppointmentStatus.PENDING;

    @Column(columnDefinition = "TEXT")
    private String notes;

    // Phase 1F-B (Jitsi) - a random, non-guessable room name generated once at booking time
    // (SupportService.bookAppointment), never derived from the sequential appointment id. Since
    // meet.jit.si is a public instance with no server-side room auth, this room name is itself the
    // only real access control on the video side - our backend controls who ever *learns* it (via
    // the time- and identity-gated /meeting endpoints), not who can technically join once known.
    // Nullable so pre-1F-B rows (booked before this column existed) don't break; the meeting
    // endpoint lazily backfills one if a legacy row is ever fetched with this null.
    @Column(name = "jitsi_room_name", length = 100)
    private String jitsiRoomName;

    // Premium gating breadth (Milestone item 7) - set once, at booking time, from whether the
    // student was Pro at that moment (SupportService.bookAppointment). Not re-evaluated later
    // (unlike WalletService's proOnly skin check, which is live) - a real minimal "priority
    // booking" perk: priority appointments sort first in the counsellor's queue regardless of
    // status, see AppointmentRepository.findByCounsellorIdOrderByPriorityDescScheduledAtDesc.
    @Column(nullable = false)
    @Builder.Default
    private boolean priority = false;

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
