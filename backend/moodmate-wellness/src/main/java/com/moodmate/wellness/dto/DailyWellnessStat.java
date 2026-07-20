package com.moodmate.wellness.dto;

import java.time.LocalDate;

/** New for Feature 8 (Mood Analytics) - one row per calendar day in the requested range, always
 * present even for days with zero activity (habitsCompleted=0, sleepMinutes=null) so
 * moodmate-mood's WellnessServiceClient can pair these up by date with its own daily mood
 * aggregates without having to guess which dates are "missing because no data" vs "missing
 * because nothing happened that day" - there's no ambiguity, every date in range is present. */
public record DailyWellnessStat(LocalDate date, int habitsCompleted, Integer sleepMinutes) {
}
