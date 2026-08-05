package com.moodmate.support.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

/** Fix #5 - body for POST /api/support/appointments/{id}/rating. Comment is optional; stars is
 * required and validated here (1-5) as well as by the DB check constraint (migration V7). */
public record SubmitCounsellorRatingRequest(@Min(1) @Max(5) int stars, String comment) {
}
