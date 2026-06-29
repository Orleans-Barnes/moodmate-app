package com.moodmate.backend.wellness;

import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Exercises the contract documented on {@link GoalEngine}. These are pure unit tests with no
 * Spring context, so they can run the moment a JDK + Maven are available - this sandbox has
 * neither (see README "Sandbox limitations"), so this suite has been hand-traced but not
 * actually executed.
 */
class GoalEngineTest {

    private static final List<GoalEngine.GoalDef> GOALS = List.of(
            new GoalEngine.GoalDef(1L, 10),
            new GoalEngine.GoalDef(2L, 10),
            new GoalEngine.GoalDef(3L, 15)
    );

    @Test
    void completingLastGoalIncrementsStreakExactlyOnce() {
        LocalDate today = LocalDate.of(2026, 6, 28);
        GoalEngine.WellnessState state = new GoalEngine.WellnessState(0, 0, null);

        GoalEngine.ToggleResult result = GoalEngine.applyToggle(state, GOALS, 3L, false, true, today);

        assertEquals(15, result.newTreeXp());
        assertEquals(1, result.newStreakCount());
        assertEquals(today, result.newLastAllGoalsCompletedDate());
        assertTrue(result.streakIncrementedThisToggle());
    }

    @Test
    void completingANonFinalGoalDoesNotIncrementStreak() {
        LocalDate today = LocalDate.of(2026, 6, 28);
        GoalEngine.WellnessState state = new GoalEngine.WellnessState(0, 0, null);

        GoalEngine.ToggleResult result = GoalEngine.applyToggle(state, GOALS, 1L, false, false, today);

        assertEquals(10, result.newTreeXp());
        assertEquals(0, result.newStreakCount());
        assertFalse(result.streakIncrementedThisToggle());
    }

    @Test
    void uncheckingAfterStreakIncrementDoesNotDecrementStreak() {
        LocalDate today = LocalDate.of(2026, 6, 28);
        // All 3 goals already done today; streak already counted.
        GoalEngine.WellnessState state = new GoalEngine.WellnessState(35, 1, today);

        // Uncheck goal 3 (wasDoneBefore=true); allGoalsDoneAfter becomes false.
        GoalEngine.ToggleResult result = GoalEngine.applyToggle(state, GOALS, 3L, true, false, today);

        assertEquals(20, result.newTreeXp());        // 35 - 15
        assertEquals(1, result.newStreakCount());    // unchanged - no decrement on uncheck
        assertEquals(today, result.newLastAllGoalsCompletedDate());
        assertFalse(result.streakIncrementedThisToggle());
    }

    @Test
    void treeXpNeverDropsBelowZero() {
        LocalDate today = LocalDate.of(2026, 6, 28);
        GoalEngine.WellnessState state = new GoalEngine.WellnessState(5, 0, null);

        GoalEngine.ToggleResult result = GoalEngine.applyToggle(state, GOALS, 3L, true, false, today);

        assertEquals(0, result.newTreeXp());
    }

    @Test
    void gapOfMoreThanOneDayResetsStreakBeforeApplyingToday() {
        LocalDate lastCompleted = LocalDate.of(2026, 6, 20);
        LocalDate today = LocalDate.of(2026, 6, 28);
        GoalEngine.WellnessState state = new GoalEngine.WellnessState(100, 9, lastCompleted);

        GoalEngine.ToggleResult result = GoalEngine.applyToggle(state, GOALS, 3L, false, true, today);

        assertEquals(1, result.newStreakCount()); // reset to 0, then +1 for completing today
    }

    @Test
    void consecutiveDayKeepsStreakGoing() {
        LocalDate yesterday = LocalDate.of(2026, 6, 27);
        LocalDate today = LocalDate.of(2026, 6, 28);
        GoalEngine.WellnessState state = new GoalEngine.WellnessState(100, 5, yesterday);

        GoalEngine.ToggleResult result = GoalEngine.applyToggle(state, GOALS, 3L, false, true, today);

        assertEquals(6, result.newStreakCount());
    }

    @Test
    void purchaseRejectedWhenCostExceedsBalance() {
        GoalEngine.BalanceMutationResult result = GoalEngine.purchase(100, 150);

        assertFalse(result.success());
        assertEquals(100, result.newLeafBalance());
    }

    @Test
    void purchaseSucceedsWhenBalanceCoversCost() {
        GoalEngine.BalanceMutationResult result = GoalEngine.purchase(150, 150);

        assertTrue(result.success());
        assertEquals(0, result.newLeafBalance());
    }
}
