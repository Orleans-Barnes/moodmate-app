package com.moodmate.support.dto;

import java.time.Instant;

/** Fix #5. */
public record CounsellorRatingResponse(Long id, Long appointmentId, int stars, String comment, Instant createdAt) {
}
