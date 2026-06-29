package com.moodmate.backend.wellness.dto;

import com.moodmate.backend.wellness.GoalEngine;

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
        List<GoalDto> todaysGoals
) {
}
