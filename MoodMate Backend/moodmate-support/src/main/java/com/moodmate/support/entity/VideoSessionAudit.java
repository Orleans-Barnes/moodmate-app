package com.moodmate.support.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/** Phase 1F-B - Audit log for video session access. Records every meeting-credentials request
 * (successful or denied) for compliance, debugging, and analytics. A single appointment can have
 * multiple audit entries: student checked window (too early), refreshed (still too early), checked
 * again (granted), counsellor joined (granted), student refreshed mid-call (granted), etc. */
@Entity
@Table(name = "video_session_audit")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class VideoSessionAudit {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "appointment_id", nullable = false)
    private Long appointmentId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "user_role", nullable = false, length = 20)
    private String userRole;  // "STUDENT" or "COUNSELLOR"

    @Column(name = "action", nullable = false, length = 50)
    private String action;  // "WINDOW_CHECK", "JOIN_GRANTED", "JOIN_DENIED"

    @Column(name = "reason", length = 100)
    private String reason;  // null for granted, or NOT_CONFIRMED/TOO_EARLY/EXPIRED/UNAUTHORIZED

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    /** Factory for successful join (window open, credentials returned). */
    public static VideoSessionAudit granted(Long appointmentId, Long userId, String role) {
        VideoSessionAudit audit = new VideoSessionAudit();
        audit.setAppointmentId(appointmentId);
        audit.setUserId(userId);
        audit.setUserRole(role);
        audit.setAction("JOIN_GRANTED");
        audit.setReason(null);
        audit.setCreatedAt(Instant.now());
        return audit;
    }

    /** Factory for denied join (window closed, or unauthorized). */
    public static VideoSessionAudit denied(Long appointmentId, Long userId, String role, String reason) {
        VideoSessionAudit audit = new VideoSessionAudit();
        audit.setAppointmentId(appointmentId);
        audit.setUserId(userId);
        audit.setUserRole(role);
        audit.setAction("JOIN_DENIED");
        audit.setReason(reason);
        audit.setCreatedAt(Instant.now());
        return audit;
    }
}
