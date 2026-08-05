package com.moodmate.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;
import java.util.Map;

/** Body for POST /internal/push/notify-roles - broadcasts to every user currently holding any of
 * the given roles (e.g. ["ADMIN", "COUNSELLOR"] for a crisis alert). Role names are plain strings
 * here (not the Role enum) so this stays a local, dependency-free wire contract for callers -
 * NotificationService validates/parses them against Role internally. */
public record NotifyRoleRequest(@NotEmpty List<String> roles, @NotBlank String title,
                                 @NotBlank String body, Map<String, String> data) {
}
