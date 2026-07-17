package com.moodmate.wellness.dto;

/** 'completed' is the only field the current frontend reads (HabitTrackerScreen.tsx expects
 * { completed: boolean }) - streak/treeXp are additive extras for future UI. */
public record ToggleHabitResponse(boolean completed, int streak, int treeXp) {
}
