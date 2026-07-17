package com.moodmate.wellness.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/** Default XP awarded per habit completion when a habit is created without the frontend
 * specifying one - see Habit.xpPerCompletion, which stores its own value per-habit after
 * creation so this default only affects new habits going forward. */
@ConfigurationProperties(prefix = "moodmate.habits")
public record HabitProperties(int defaultXpPerCompletion) {
}
