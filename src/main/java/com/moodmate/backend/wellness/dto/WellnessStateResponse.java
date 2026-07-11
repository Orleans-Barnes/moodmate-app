package com.moodmate.backend.wellness.dto;

import com.moodmate.backend.common.GoalEngine;

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
        boolean hasStreakShield
) {
}
