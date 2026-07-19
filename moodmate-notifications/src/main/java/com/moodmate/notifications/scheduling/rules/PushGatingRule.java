package com.moodmate.notifications.scheduling.rules;

import com.moodmate.notifications.client.dto.NotificationPreferences;
import com.moodmate.notifications.entity.NotificationType;

import java.time.LocalTime;
import java.time.format.DateTimeParseException;

/**
 * Phase 1E, Step 5 (Expo Push) - decides whether NotificationService.create() should actually
 * attempt a push for a given notification, on top of always creating the in-app inbox row
 * regardless (this rule never affects that - see NotificationStatus's doc comment: "push is a
 * separate concern layered on top"). Pure, no Spring/DB/HTTP dependency, same philosophy as every
 * other rule in this package.
 *
 * Two independent gates, both must pass:
 * 1. Per-type toggle - only the four Phase 1E Step 1 reminder types (mood/journal/habit/sleep)
 *    plus appointment-related types have a matching preference; everything else (mentor requests,
 *    crisis alerts, achievements, admin announcements, etc.) has no corresponding toggle in the
 *    Step 1 model and is therefore never gated by one.
 * 2. Quiet hours - suppresses ALL push except CRISIS_ALERT, which must never be silenced
 *    regardless of the user's quiet-hours settings (a safety-critical exception, not an oversight).
 *
 * `preferences` may be null - AuthServiceClient.getPreferences() returns empty when auth-service
 * is unreachable, and this rule treats that as "allow" (fail-open). Silently dropping a real
 * notification's push because a preferences fetch timed out would be a worse outcome than
 * occasionally pushing when the user's actual settings would have suppressed it.
 */
public final class PushGatingRule {

    private PushGatingRule() {}

    public static boolean shouldPush(NotificationType type, NotificationPreferences preferences, LocalTime now) {
        if (type == NotificationType.CRISIS_ALERT) return true; // never gated, by either toggle or quiet hours

        if (preferences == null) return true; // fail-open - see class doc comment

        if (!typeToggleEnabled(type, preferences)) return false;

        return !isWithinQuietHours(now, preferences.quietHoursStart(), preferences.quietHoursEnd());
    }

    private static boolean typeToggleEnabled(NotificationType type, NotificationPreferences preferences) {
        return switch (type) {
            case MOOD_REMINDER -> preferences.moodReminders();
            case JOURNAL_REMINDER -> preferences.journalReminders();
            case HABIT_REMINDER -> preferences.habitReminders();
            case SLEEP_REMINDER -> preferences.sleepReminders();
            case APPOINTMENT_BOOKED, APPOINTMENT_CONFIRMED, APPOINTMENT_CANCELLED,
                 APPOINTMENT_COMPLETED, APPOINTMENT_REMINDER -> preferences.appointmentReminders();
            // No matching toggle in the Step 1 preference model - never gated by one.
            default -> true;
        };
    }

    /** "HH:mm" strings, as stored by moodmate-auth's NotificationPreferenceService - null means no
     * quiet hours configured. Handles the wraparound case (e.g. "22:00"-"07:00" spans midnight);
     * an equal start/end is treated as "no quiet hours" rather than "always quiet," since that
     * shape can only arise from a data anomaly, not a real user intent. */
    static boolean isWithinQuietHours(LocalTime now, String startRaw, String endRaw) {
        if (startRaw == null || endRaw == null) return false;
        LocalTime start, end;
        try {
            start = LocalTime.parse(startRaw);
            end = LocalTime.parse(endRaw);
        } catch (DateTimeParseException e) {
            return false; // malformed data - fail open rather than accidentally silencing everything
        }
        if (start.equals(end)) return false;
        if (start.isBefore(end)) {
            return !now.isBefore(start) && now.isBefore(end);
        }
        return !now.isBefore(start) || now.isBefore(end);
    }
}
