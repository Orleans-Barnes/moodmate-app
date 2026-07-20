package com.moodmate.auth.dto;

import com.moodmate.auth.entity.Role;

import java.time.Instant;

/** Phase 1H (Admin Portal - User Management). Backs GET /api/users/admin - a full-fidelity row for
 * the admin user-search table, distinct from UserSummary (name/email/avatar only, used for
 * cross-service display like "who booked this appointment") and from ModerationStatusResponse
 * (just the ban-related fields, returned by the suspend/reinstate actions themselves). */
public record AdminUserView(Long id, String email, String fullName, String institution, Role role,
                             boolean guest, boolean banned, String bannedReason, Instant bannedAt,
                             int warningCount, Instant createdAt) {
}
