package com.moodmate.wellness.dto;

import com.moodmate.wellness.engine.GoalEngine;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

public record WellnessStateResponse(
        int treeXp,
        int treeXpMax,
        GoalEngine.TreeStage treeStage,
        String treeSkinEmoji,
        int leafBalance,
        int streakCount,
        LocalDate lastAllGoalsCompletedDate,
        List<GoalDto> todaysGoals,
        boolean hasStreakShield,
        // Feature 14 (Shop Improvements). Null when no Double XP boost is active, otherwise the
        // instant it expires - lets the frontend show a countdown instead of just an on/off flag.
        Instant doubleXpActiveUntil
) {
}
