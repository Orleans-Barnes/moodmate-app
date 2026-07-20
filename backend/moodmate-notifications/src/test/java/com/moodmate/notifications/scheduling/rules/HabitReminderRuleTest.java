package com.moodmate.notifications.scheduling.rules;

import org.junit.jupiter.api.Test;

import java.time.LocalTime;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class HabitReminderRuleTest {

    @Test
    void noHabitsToday_neverReminds() {
        assertFalse(HabitReminderRule.shouldRemind(0, 0, LocalTime.of(21, 0)));
    }

    @Test
    void allHabitsDone_doesNotRemind() {
        assertFalse(HabitReminderRule.shouldRemind(3, 3, LocalTime.of(21, 0)));
    }

    @Test
    void incompleteHabits_beforeCutoff_doesNotRemind() {
        assertFalse(HabitReminderRule.shouldRemind(3, 1, LocalTime.of(18, 59)));
    }

    @Test
    void incompleteHabits_atOrAfterCutoff_reminds() {
        assertTrue(HabitReminderRule.shouldRemind(3, 1, LocalTime.of(19, 0)));
        assertTrue(HabitReminderRule.shouldRemind(3, 1, LocalTime.of(22, 0)));
    }

    @Test
    void zeroCompleted_afterCutoff_reminds() {
        assertTrue(HabitReminderRule.shouldRemind(2, 0, LocalTime.of(20, 0)));
    }

    @Test
    void boundary_exactlyAtCutoff_reminds() {
        assertTrue(HabitReminderRule.shouldRemind(1, 0, LocalTime.of(19, 0)));
    }

    @Test
    void boundary_oneSecondBeforeCutoff_doesNotRemind() {
        assertFalse(HabitReminderRule.shouldRemind(1, 0, LocalTime.of(18, 59, 59)));
    }
}
