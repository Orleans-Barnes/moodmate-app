package com.moodmate.support.dto;

import java.time.Instant;

/** Public student-facing availability shape. Deliberately exposes only time windows, not the
 * student/account details of the appointment occupying that window. */
public record BookedSlotView(Instant scheduledAt, Instant windowEndsAt) {
}
