package com.moodmate.notifications.scheduling.rules;

import com.moodmate.notifications.client.dto.NotificationPreferences;
import com.moodmate.notifications.entity.NotificationType;
import org.junit.jupiter.api.Test;

import java.time.LocalTime;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class PushGatingRuleTest {

    private static final LocalTime NOON = LocalTime.of(12, 0);

    private static NotificationPreferences prefs(boolean mood, boolean journal, boolean habit,
                                                  boolean sleep, boolean appointment,
                                                  String quietStart, String quietEnd) {
        return new NotificationPreferences(mood, journal, habit, sleep, appointment, quietStart, quietEnd, null);
    }

    private static NotificationPreferences allEnabledNoQuietHours() {
        return prefs(true, true, true, true, true, null, null);
    }

    @Test
    void crisisAlert_alwaysPushes_evenWithNullPreferences() {
        assertTrue(PushGatingRule.shouldPush(NotificationType.CRISIS_ALERT, null, NOON));
    }

    @Test
    void nullPreferences_failsOpen_forNonCrisisType() {
        assertTrue(PushGatingRule.shouldPush(NotificationType.MOOD_REMINDER, null, NOON));
    }

    @Test
    void typeToggleDisabled_suppressesPush() {
        NotificationPreferences p = prefs(false, true, true, true, true, null, null);
        assertFalse(PushGatingRule.shouldPush(NotificationType.MOOD_REMINDER, p, NOON));
    }

    @Test
    void typeToggleEnabled_noQuietHours_pushes() {
        assertTrue(PushGatingRule.shouldPush(NotificationType.JOURNAL_REMINDER, allEnabledNoQuietHours(), NOON));
    }

    @Test
    void appointmentTypes_allGatedBySameToggle() {
        NotificationPreferences disabled = prefs(true, true, true, true, false, null, null);
        assertFalse(PushGatingRule.shouldPush(NotificationType.APPOINTMENT_BOOKED, disabled, NOON));
        assertFalse(PushGatingRule.shouldPush(NotificationType.APPOINTMENT_CONFIRMED, disabled, NOON));
        assertFalse(PushGatingRule.shouldPush(NotificationType.APPOINTMENT_CANCELLED, disabled, NOON));
        assertFalse(PushGatingRule.shouldPush(NotificationType.APPOINTMENT_COMPLETED, disabled, NOON));
        assertFalse(PushGatingRule.shouldPush(NotificationType.APPOINTMENT_REMINDER, disabled, NOON));
    }

    @Test
    void typesWithNoMatchingToggle_alwaysPush_outsideQuietHours() {
        NotificationPreferences p = allEnabledNoQuietHours();
        assertTrue(PushGatingRule.shouldPush(NotificationType.MENTOR_REQUEST, p, NOON));
        assertTrue(PushGatingRule.shouldPush(NotificationType.ACHIEVEMENT_UNLOCKED, p, NOON));
        assertTrue(PushGatingRule.shouldPush(NotificationType.ADMIN_ANNOUNCEMENT, p, NOON));
        assertTrue(PushGatingRule.shouldPush(NotificationType.SYSTEM, p, NOON));
    }

    @Test
    void withinQuietHours_suppressesPush_evenWithToggleEnabled() {
        NotificationPreferences p = prefs(true, true, true, true, true, "22:00", "07:00");
        assertFalse(PushGatingRule.shouldPush(NotificationType.MOOD_REMINDER, p, LocalTime.of(23, 0)));
    }

    @Test
    void withinQuietHours_stillPushesCrisisAlert() {
        NotificationPreferences p = prefs(true, true, true, true, true, "22:00", "07:00");
        assertTrue(PushGatingRule.shouldPush(NotificationType.CRISIS_ALERT, p, LocalTime.of(23, 0)));
    }

    @Test
    void outsideQuietHoursWindow_pushes() {
        NotificationPreferences p = prefs(true, true, true, true, true, "22:00", "07:00");
        assertTrue(PushGatingRule.shouldPush(NotificationType.MOOD_REMINDER, p, LocalTime.of(15, 0)));
    }

    // ── isWithinQuietHours boundary tests (package-private helper) ──────────────────────────────

    @Test
    void quietHours_nullFields_neverWithin() {
        assertFalse(PushGatingRule.isWithinQuietHours(NOON, null, null));
        assertFalse(PushGatingRule.isWithinQuietHours(NOON, "22:00", null));
    }

    @Test
    void quietHours_sameStartAndEnd_treatedAsNoQuietHours() {
        assertFalse(PushGatingRule.isWithinQuietHours(NOON, "22:00", "22:00"));
    }

    @Test
    void quietHours_nonWrapping_withinRange() {
        assertTrue(PushGatingRule.isWithinQuietHours(LocalTime.of(14, 0), "13:00", "15:00"));
        assertFalse(PushGatingRule.isWithinQuietHours(LocalTime.of(12, 0), "13:00", "15:00"));
    }

    @Test
    void quietHours_wrapping_acrossMidnight() {
        assertTrue(PushGatingRule.isWithinQuietHours(LocalTime.of(23, 30), "22:00", "07:00"));
        assertTrue(PushGatingRule.isWithinQuietHours(LocalTime.of(3, 0), "22:00", "07:00"));
        assertFalse(PushGatingRule.isWithinQuietHours(LocalTime.of(12, 0), "22:00", "07:00"));
    }

    @Test
    void quietHours_boundary_exactlyAtStartAndEnd() {
        // Start is inclusive, end is exclusive.
        assertTrue(PushGatingRule.isWithinQuietHours(LocalTime.of(22, 0), "22:00", "07:00"));
        assertFalse(PushGatingRule.isWithinQuietHours(LocalTime.of(7, 0), "22:00", "07:00"));
    }
}
