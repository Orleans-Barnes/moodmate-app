package com.moodmate.notifications.scheduling.rules;

import java.time.LocalDate;
import java.time.LocalTime;

/**
 * Phase 1E, Step 4 - "no check-in today -> remind 8pm." Pure, no Spring/DB/HTTP dependencies, same
 * philosophy as the frontend's recommendationEngine.ts: given fixed inputs (a clock reading and a
 * fact about the world), decide one boolean, and let a test fix the clock and fake the fact rather
 * than needing a running scheduler/database. MoodReminderScheduledJob is the only caller today -
 * it fetches lastCheckInDate per user from MoodServiceClient and evaluates this per user, once per
 * scheduled run.
 */
public final class MoodCheckInReminderRule {

    private MoodCheckInReminderRule() {}

    /** Give the day a chance before nagging - no reminder fires before 8pm local/UTC time, even if
     * the user hasn't checked in yet today. */
    public static final LocalTime REMINDER_CUTOFF = LocalTime.of(20, 0);

    /**
     * @param today            the current date the job is evaluating against
     * @param now              the current time of day the job is evaluating against
     * @param lastCheckInDate  the user's most recent check-in date, or null if moodmate-mood has
     *                         no record of this user at all (see MoodServiceClient's doc comment
     *                         for why that case is rare in practice, but this rule still handles
     *                         it defensively - a genuinely unknown user should still be reminded).
     */
    public static boolean shouldRemind(LocalDate today, LocalTime now, LocalDate lastCheckInDate) {
        boolean checkedInToday = lastCheckInDate != null && lastCheckInDate.isEqual(today);
        boolean pastCutoff = !now.isBefore(REMINDER_CUTOFF);
        return !checkedInToday && pastCutoff;
    }
}
