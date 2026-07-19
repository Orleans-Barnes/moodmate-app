package com.moodmate.notifications.scheduling.rules;

import java.time.Duration;
import java.time.Instant;

/**
 * Phase 1E, Step 4 - "counsellor appointment tomorrow -> reminder." Pure (see
 * MoodCheckInReminderRule's doc comment for the "why pure" rationale) - not yet wired to a
 * scheduled job/client (needs a moodmate-support internal endpoint listing CONFIRMED appointments
 * within the reminder window, which doesn't exist yet). Tracked in
 * MASTER_IMPLEMENTATION_TRACKER.md's Phase 1E Step 4 section as the next mechanical repeat of the
 * pattern MoodReminderScheduledJob already established.
 *
 * Deliberately takes only Instants, not an AppointmentStatus - filtering to CONFIRMED-only (never
 * PENDING/CANCELLED/COMPLETED) is the caller's job, since AppointmentStatus is owned by
 * moodmate-support's entity, not this service's scheduling package.
 */
public final class AppointmentReminderRule {

    private AppointmentReminderRule() {}

    public static final Duration REMINDER_WINDOW = Duration.ofHours(24);

    /**
     * @param now          the current instant the job is evaluating against
     * @param scheduledAt  the confirmed appointment's scheduled start time
     */
    public static boolean shouldRemind(Instant now, Instant scheduledAt) {
        if (!scheduledAt.isAfter(now)) return false; // already started or in the past
        Duration untilAppointment = Duration.between(now, scheduledAt);
        return untilAppointment.compareTo(REMINDER_WINDOW) <= 0;
    }
}
