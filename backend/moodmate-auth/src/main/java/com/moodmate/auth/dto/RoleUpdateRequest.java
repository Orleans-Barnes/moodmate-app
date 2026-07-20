package com.moodmate.auth.dto;

import com.moodmate.auth.entity.Role;
import jakarta.validation.constraints.NotNull;

/** Body for the internal role-promotion endpoint - see InternalUserController. Currently only
 * called by support-service when an admin approves a self-serve counsellor request (replaces the
 * monolith's in-process CounsellorApprovedEvent -> CounsellorRoleGrantor listener, which can't
 * work across services). A future manual "5-tap on the role select screen" admin path is planned
 * to call this same endpoint. */
public record RoleUpdateRequest(@NotNull Role role) {
}
