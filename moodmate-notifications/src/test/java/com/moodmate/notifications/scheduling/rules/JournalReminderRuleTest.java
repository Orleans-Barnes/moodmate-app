package com.moodmate.notifications.scheduling.rules;

import org.junit.jupiter.api.Test;

import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class JournalReminderRuleTest {

    private static final LocalDate TODAY = LocalDate.of(2026, 7, 19);

    @Test
    void neverWritten_reminds() {
        assertTrue(JournalReminderRule.shouldRemind(TODAY, null));
    }

    @Test
    void writtenToday_doesNotRemind() {
        assertFalse(JournalReminderRule.shouldRemind(TODAY, TODAY));
    }

    @Test
    void writtenYesterday_doesNotRemind() {
        assertFalse(JournalReminderRule.shouldRemind(TODAY, TODAY.minusDays(1)));
    }

    @Test
    void boundary_exactlyTwoDaysStale_reminds() {
        assertTrue(JournalReminderRule.shouldRemind(TODAY, TODAY.minusDays(2)));
    }

    @Test
    void boundary_oneDayShortOfStale_doesNotRemind() {
        // Redundant with writtenYesterday() but named to make the exact boundary explicit.
        assertFalse(JournalReminderRule.shouldRemind(TODAY, TODAY.minusDays(1)));
    }

    @Test
    void staleForWeeks_reminds() {
        assertTrue(JournalReminderRule.shouldRemind(TODAY, TODAY.minusDays(30)));
    }
}
