package com.moodmate.support.client;

/** Local copy of auth-service's UserSummary shape - deserialized from its
 * GET /internal/users/{id}/summary and POST /internal/users/summaries responses. Each service
 * keeps its own copy of DTOs it consumes from another service rather than sharing a library
 * module, so the two can evolve independently - see moodmate-wallet's identical local copy. */
public record UserSummary(Long id, String fullName, String avatarEmoji, String email) {
}
