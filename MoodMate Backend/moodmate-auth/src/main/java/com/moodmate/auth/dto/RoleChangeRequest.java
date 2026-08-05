package com.moodmate.auth.dto;

import com.moodmate.auth.entity.Role;
import jakarta.validation.constraints.NotNull;

/** Phase 1H (Admin Portal - User Management), Admin narrow-gaps pass. Body for the general
 * admin role-change endpoint (AdminUserController#changeRole) - distinct from AuthService's
 * internal-only updateRole(), which is the automated cross-service promotion path called by
 * moodmate-support after a counsellor/mentor application is approved, not something an admin
 * invokes directly from a screen. */
public record RoleChangeRequest(@NotNull Role role) {
}
