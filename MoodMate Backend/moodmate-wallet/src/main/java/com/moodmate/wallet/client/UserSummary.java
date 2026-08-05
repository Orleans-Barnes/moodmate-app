package com.moodmate.wallet.client;

/** Local copy of auth-service's UserSummary shape - deserialized from its
 * GET /api/users/{id}/summary response. Each service keeps its own copy of DTOs it consumes from
 * another service rather than sharing a library module, so the two can evolve independently. */
public record UserSummary(Long id, String fullName, String avatarEmoji, String email) {
}
