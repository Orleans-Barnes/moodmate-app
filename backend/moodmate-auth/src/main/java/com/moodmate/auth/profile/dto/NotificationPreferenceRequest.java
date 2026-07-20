package com.moodmate.auth.profile.dto;

/**
 * Phase 1E, Step 1. Every field nullable for partial-update - same "null means don't touch"
 * semantics as WellnessPreferenceRequest/StudentProfileRequest. Unlike those, a null Boolean here
 * just means "leave this reminder type as it was", not "clear this field" - there's no meaningful
 * "unset" state for a boolean toggle the way there is for a Set.
 *
 * quietHoursStart/End are "HH:mm" strings (e.g. "22:00"), not java.time.LocalTime directly, to
 * keep the wire format unambiguous across client/server without depending on Jackson's default
 * ISO-8601 time serialization matching what the frontend sends - parsed and validated server-side
 * in the service layer. Passing an empty string clears quiet hours entirely (distinct from null,
 * which leaves the existing value untouched) - see NotificationPreferenceService.
 */
public record NotificationPreferenceRequest(
    Boolean moodReminders,
    Boolean journalReminders,
    Boolean habitReminders,
    Boolean sleepReminders,
    Boolean appointmentReminders,
    String quietHoursStart,
    String quietHoursEnd
) {}
