package com.moodmate.notifications.scheduling.rules;

import org.junit.jupiter.api.Test;

import java.time.Duration;
import java.time.Instant;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class AppointmentReminderRuleTest {

    private static final Instant NOW = Instant.parse("2026-07-19T12:00:00Z");

    @Test
    void appointmentInPast_doesNotRemind() {
        assertFalse(AppointmentReminderRule.shouldRemind(NOW, NOW.minus(Duration.ofHours(1))));
    }

    @Test
    void appointmentStartingNow_doesNotRemind() {
        // isAfter(now) is strict - an appointment starting at exactly `now` has already begun.
        assertFalse(AppointmentReminderRule.shouldRemind(NOW, NOW));
    }

    @Test
    void appointmentInOneHour_reminds() {
        assertTrue(AppointmentReminderRule.shouldRemind(NOW, NOW.plus(Duration.ofHours(1))));
    }

    @Test
    void appointmentInTwentyThreeHours_reminds() {
        assertTrue(AppointmentReminderRule.shouldRemind(NOW, NOW.plus(Duration.ofHours(23))));
    }

    @Test
    void appointmentInThreeDays_doesNotRemindYet() {
        assertFalse(AppointmentReminderRule.shouldRemind(NOW, NOW.plus(Duration.ofDays(3))));
    }

    @Test
    void boundary_exactlyAtWindowEdge_reminds() {
        assertTrue(AppointmentReminderRule.shouldRemind(NOW, NOW.plus(Duration.ofHours(24))));
    }

    @Test
    void boundary_oneMinuteBeyondWindow_doesNotRemind() {
        assertFalse(AppointmentReminderRule.shouldRemind(NOW, NOW.plus(Duration.ofHours(24)).plus(Duration.ofMinutes(1))));
    }
}
