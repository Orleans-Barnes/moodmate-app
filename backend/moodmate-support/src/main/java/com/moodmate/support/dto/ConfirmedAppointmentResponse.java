package com.moodmate.support.dto;

import java.time.Instant;

/**
 * Internal-only (GET /internal/support/appointments/confirmed, Phase 1E Step 4) - every CONFIRMED
 * appointment, regardless of when it's scheduled for. Deliberately omits AppointmentStatus itself
 * (only CONFIRMED rows are ever returned, filtered server-side) so moodmate-notifications never
 * needs to import or understand this service's status enum - see AppointmentReminderRule's doc
 * comment for why it only takes Instants. Window filtering (is this within the next 24h?) is the
 * caller's job, applied per row via that rule.
 */
public record ConfirmedAppointmentResponse(Long id, Long userId, Instant scheduledAt) {
}
