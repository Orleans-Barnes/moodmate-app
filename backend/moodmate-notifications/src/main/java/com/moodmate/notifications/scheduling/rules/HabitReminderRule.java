package com.moodmate.notifications.scheduling.rules;

import java.time.LocalTime;

/**
 * Phase 1E, Step 4 - "habit incomplete -> reminder." Pure (see MoodCheckInReminderRule's doc
 * comment for the "why pure" rationale) - not yet wired to a scheduled job/client (needs a
 * moodmate-wellness internal endpoint exposing each user's today's-habit completion counts, which
 * doesn't exist yet). Tracked in MASTER_IMPLEMENTATION_TRACKER.md's Phase 1E Step 4 section as the
 * next mechanical repeat of the pattern MoodReminderScheduledJob already established.
 */
public final class HabitReminderRule {

    private HabitReminderRule() {}

    /** Same "give the day a chance" cutoff philosophy as MoodCheckInReminderRule, one hour earlier
     * since habits are typically checked off earlier in the evening than a mood check-in. */
    public static final LocalTime REMINDER_CUTOFF = LocalTime.of(19, 0);

    /**
     * @param totalHabitsToday      how many habits are scheduled/defined for the user today
     * @param completedHabitsToday  how many of those the user has already completed today
     * @param now                   the current time of day the job is evaluating against
     */
    public static boolean shouldRemind(int totalHabitsToday, int completedHabitsToday, LocalTime now) {
        boolean hasIncomplete = totalHabitsToday > 0 && completedHabitsToday < totalHabitsToday;
        boolean pastCutoff = !now.isBefore(REMINDER_CUTOFF);
        return hasIncomplete && pastCutoff;
    }
}
