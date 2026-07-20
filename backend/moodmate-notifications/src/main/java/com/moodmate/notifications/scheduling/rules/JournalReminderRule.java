package com.moodmate.notifications.scheduling.rules;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

/**
 * Phase 1E, Step 4 - "journal untouched 2 days -> gentle reminder." Pure (see
 * MoodCheckInReminderRule's doc comment for the "why pure" rationale) - not yet wired to a
 * scheduled job/client (that requires a moodmate-journal internal endpoint analogous to
 * moodmate-mood's GET /internal/mood/latest-per-user, which doesn't exist yet). Tracked in
 * MASTER_IMPLEMENTATION_TRACKER.md's Phase 1E Step 4 section as the next mechanical repeat of the
 * pattern MoodReminderScheduledJob already established.
 */
public final class JournalReminderRule {

    private JournalReminderRule() {}

    public static final int STALE_AFTER_DAYS = 2;

    /**
     * @param today          the current date the job is evaluating against
     * @param lastEntryDate  the user's most recent journal entry date, or null if they've never
     *                       written one - which qualifies immediately, since "never" is the most
     *                       extreme case of "gone quiet" this rule is meant to catch.
     */
    public static boolean shouldRemind(LocalDate today, LocalDate lastEntryDate) {
        if (lastEntryDate == null) return true;
        return ChronoUnit.DAYS.between(lastEntryDate, today) >= STALE_AFTER_DAYS;
    }
}
