package com.moodmate.admin.dto;

import jakarta.validation.constraints.NotBlank;

/** audience is one of ALL/STUDENT/COUNSELLOR/MENTOR/ADMIN, validated in AdminService (not a Java
 * enum here since it's compared against auth.users.role, a plain string column read via
 * JdbcTemplate, not a JPA-mapped type this service owns). */
public record BroadcastAnnouncementRequest(@NotBlank String title, @NotBlank String body, @NotBlank String audience) {
}
