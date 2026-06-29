package com.moodmate.backend.auth.dto;

/** Minimal cross-domain read of a user's identity - exposed via AuthService.getUserSummary() so
 * other domains never need direct access to the User entity/repository. */
public record UserSummary(Long id, String fullName, String avatarEmoji) {
}
