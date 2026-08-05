package com.moodmate.wellness.dto;

/** Mirrors HabitTrackerScreen.tsx's HabitView exactly (id, name, icon, color, completedToday,
 * streak) - xpPerCompletion is additive and safe for the existing frontend to ignore. */
public record HabitResponse(
        Long id,
        String name,
        String icon,
        String color,
        boolean completedToday,
        int streak,
        int xpPerCompletion
) {
}
