package com.moodmate.notifications.scheduling.rules;

import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.time.LocalTime;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class MoodCheckInReminderRuleTest {

    private static final LocalDate TODAY = LocalDate.of(2026, 7, 19);
    private static final LocalDate YESTERDAY = TODAY.minusDays(1);

    @Test
    void neverCheckedIn_beforeCutoff_doesNotRemind() {
        assertFalse(MoodCheckInReminderRule.shouldRemind(TODAY, LocalTime.of(19, 59), null));
    }

    @Test
    void neverCheckedIn_atOrAfterCutoff_reminds() {
        assertTrue(MoodCheckInReminderRule.shouldRemind(TODAY, LocalTime.of(20, 0), null));
        assertTrue(MoodCheckInReminderRule.shouldRemind(TODAY, LocalTime.of(23, 30), null));
    }

    @Test
    void checkedInToday_afterCutoff_doesNotRemind() {
        assertFalse(MoodCheckInReminderRule.shouldRemind(TODAY, LocalTime.of(21, 0), TODAY));
    }

    @Test
    void checkedInYesterday_afterCutoff_reminds() {
        assertTrue(MoodCheckInReminderRule.shouldRemind(TODAY, LocalTime.of(20, 0), YESTERDAY));
    }

    @Test
    void checkedInYesterday_beforeCutoff_doesNotRemind() {
        assertFalse(MoodCheckInReminderRule.shouldRemind(TODAY, LocalTime.of(9, 0), YESTERDAY));
    }

    @Test
    void checkedInLongAgo_afterCutoff_reminds() {
        assertTrue(MoodCheckInReminderRule.shouldRemind(TODAY, LocalTime.of(20, 5), TODAY.minusDays(30)));
    }

    @Test
    void boundary_exactlyAtCutoff_reminds() {
        assertTrue(MoodCheckInReminderRule.shouldRemind(TODAY, LocalTime.of(20, 0), null));
    }

    @Test
    void boundary_oneMinuteBeforeCutoff_doesNotRemind() {
        assertFalse(MoodCheckInReminderRule.shouldRemind(TODAY, LocalTime.of(19, 59, 59), null));
    }
}
