package com.moodmate.notifications.client.dto;

/** Mirrors moodmate-auth's profile.dto.NotificationPreferenceResponse field-for-field (the per-type
 * reminder toggles + quiet hours, Phase 1E Step 1) - PushGatingRule only reads the first seven
 * fields, but `updatedAt` is still declared here rather than omitted: Spring Boot's default Jackson
 * config fails deserialization on an unrecognized JSON property (FAIL_ON_UNKNOWN_PROPERTIES is NOT
 * disabled project-wide), so a response DTO missing a field the source DTO actually sends would
 * throw at runtime, not just look slightly incomplete - see moodmate-wallet's Paystack DTOs for the
 * one place this codebase deliberately opts out of that (external, not-fully-known API shapes;
 * this is different - an internal DTO whose exact shape we already control on both ends). */
public record NotificationPreferences(
        boolean moodReminders,
        boolean journalReminders,
        boolean habitReminders,
        boolean sleepReminders,
        boolean appointmentReminders,
        String quietHoursStart,
        String quietHoursEnd,
        String updatedAt
) {
}
