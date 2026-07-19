package com.moodmate.wellness.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.Instant;

/** Phase 1H (Admin Portal - Wellness Content). capacity is nullable - matches
 * WellnessEvent.capacity's own doc comment ("no capacity column value means unlimited RSVPs"). */
public record CreateEventRequest(@NotBlank String title, String description, @NotNull Instant startsAt,
                                  String location, Integer capacity) {
}
