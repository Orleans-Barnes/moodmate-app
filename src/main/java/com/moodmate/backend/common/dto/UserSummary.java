package com.moodmate.backend.common.dto;

/**
 * Minimal cross-domain view of a user's identity.
 *
 * Lives in {@code common.dto} so the auth domain (provider) and the support domain (consumer)
 * can share it without either importing from the other.
 * This is the canonical version — {@code auth.dto.UserSummary} has been removed.
 */
public record UserSummary(Long id, String fullName, String avatarEmoji) {
}
