package com.moodmate.mood.client;

import java.time.LocalDate;

/** Local copy of moodmate-wellness's DailyWellnessStat shape - same "local DTO copy" pattern as
 * moodmate-journal/moodmate-ai's SubscriptionSummary. */
public record DailyWellnessStat(LocalDate date, int habitsCompleted, Integer sleepMinutes) {
}
