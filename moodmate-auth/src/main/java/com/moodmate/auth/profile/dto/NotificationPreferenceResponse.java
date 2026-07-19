package com.moodmate.auth.profile.dto;

import java.time.Instant;

/**
 * Phase 1E, Step 1. quietHoursStart/End are "HH:mm" strings, null when not configured - same wire
 * format as the request DTO, so the frontend never needs to parse a java.time shape itself.
 */
public record NotificationPreferenceResponse(
    boolean moodReminders,
    boolean journalReminders,
    boolean habitReminders,
    boolean sleepReminders,
    boolean appointmentReminders,
    String quietHoursStart,
    String quietHoursEnd,
    Instant updatedAt
) {}
