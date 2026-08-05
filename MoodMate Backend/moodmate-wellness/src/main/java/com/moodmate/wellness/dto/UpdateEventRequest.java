package com.moodmate.wellness.dto;

import java.time.Instant;

/** Phase 1H (Admin Portal - Wellness Content). Partial update - a null field means "leave
 * unchanged." Deliberate, documented limitation: this means capacity can't be explicitly cleared
 * back to "unlimited" via this endpoint once set (same class of tradeoff as the quiet-hours
 * partial-update convention elsewhere in this codebase, just without that endpoint's "empty
 * string clears it" escape hatch, since Integer has no empty-string equivalent) - not worth a
 * sentinel value for this pass; delete-and-recreate the event if that's ever needed. */
public record UpdateEventRequest(String title, String description, Instant startsAt, String location,
                                  Integer capacity) {
}
