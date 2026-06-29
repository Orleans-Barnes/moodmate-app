package com.moodmate.backend.wellness;

import java.time.LocalDate;
import java.util.List;

/**
 * Pure, dependency-free gamification engine - deliberately has no Spring/JPA annotations so the
 * rules can be reasoned about (and later unit-tested) without a database or app context.
 *
 * Contract this must not regress (the frontend's src/state/useAppState.ts, called out in its own
 * CLAUDE.md as "Verified-working logic"):
 *  - completing ALL of today's goals raises treeXP by each goal's xp value, and increments
 *    streakCount by exactly 1 - but only on the toggle that completes the LAST remaining goal,
 *    never per-goal.
 *  - unchecking a goal afterward does NOT undo a streak increment that already happened.
 *  - treeXP never drops below 0.
 *  - a purchase costing more than the available balance is rejected with no mutation.
 *
 * Extended for server-side, multi-day use - the frontend only ever ran this in a single
 * in-memory session, so it never had to handle day boundaries: if more than one full calendar
 * day has passed since lastAllGoalsCompletedDate, the streak resets to 0 before today's toggle
 * is applied.
 */
public final class GoalEngine {

    private GoalEngine() {
    }

    public enum TreeStage { ROOTS, SPROUT, BLOOM, CANOPY }

    public static TreeStage stageForXp(int xp, int xpMax) {
        double pct = xpMax <= 0 ? 0 : (double) xp / xpMax;
        if (pct < 0.25) return TreeStage.ROOTS;
        if (pct < 0.75) return TreeStage.SPROUT;
        if (pct < 1.0) return TreeStage.BLOOM;
        return TreeStage.CANOPY;
    }

    public record GoalDef(long templateId, int xp) {
    }

    /** Immutable snapshot of the per-user gamification state the engine reads and writes. */
    public record WellnessState(int treeXp, int streakCount, LocalDate lastAllGoalsCompletedDate) {
    }

    public record ToggleResult(int newTreeXp, int newStreakCount, LocalDate newLastAllGoalsCompletedDate,
                                boolean streakIncrementedThisToggle) {
    }

    /**
     * @param state                       state before this toggle
     * @param todaysGoalDefs              today's active goal definitions (id + xp)
     * @param toggledGoalId               which goal was toggled
     * @param toggledGoalWasDoneBefore    its `done` flag before this toggle (we're flipping it)
     * @param allGoalsDoneAfterThisToggle whether ALL of today's goals are done once this toggle is
     *                                    applied - computed by the caller from the goal_completions
     *                                    rows, since this engine doesn't own that storage
     * @param today                       caller-supplied "today" (keeps this pure and testable)
     */
    public static ToggleResult applyToggle(WellnessState state, List<GoalDef> todaysGoalDefs, long toggledGoalId,
                                            boolean toggledGoalWasDoneBefore, boolean allGoalsDoneAfterThisToggle,
                                            LocalDate today) {
        GoalDef toggled = todaysGoalDefs.stream()
                .filter(g -> g.templateId() == toggledGoalId)
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException(
                        "toggledGoalId not present in todaysGoalDefs: " + toggledGoalId));

        int delta = toggledGoalWasDoneBefore ? -toggled.xp() : toggled.xp();
        int nextXp = Math.max(0, state.treeXp() + delta);

        int streak = state.streakCount();
        LocalDate lastCompleted = state.lastAllGoalsCompletedDate();

        // Streak-break: a gap of more than one day since the last fully-completed day resets the
        // streak before today's toggle is applied. No-op the first time a user ever plays, since
        // lastCompleted is null then.
        if (lastCompleted != null && lastCompleted.isBefore(today.minusDays(1))) {
            streak = 0;
        }

        boolean wasAlreadyCountedToday = today.equals(lastCompleted);
        boolean justCompletedAllGoals = !toggledGoalWasDoneBefore && allGoalsDoneAfterThisToggle;

        boolean streakIncrementedThisToggle = false;
        if (justCompletedAllGoals && !wasAlreadyCountedToday) {
            streak += 1;
            lastCompleted = today;
            streakIncrementedThisToggle = true;
        }
        // Unchecking a goal (toggledGoalWasDoneBefore == true) never decrements streak or clears
        // lastCompleted - matches the verified "unchecking doesn't undo streak" behavior.

        return new ToggleResult(nextXp, streak, lastCompleted, streakIncrementedThisToggle);
    }

    public record BalanceMutationResult(boolean success, int newLeafBalance) {
    }

    /** Rejects and makes no mutation if cost > balance. Cost 0 always succeeds (e.g. re-equipping a free skin). */
    public static BalanceMutationResult purchase(int leafBalance, int cost) {
        if (cost > 0 && cost > leafBalance) {
            return new BalanceMutationResult(false, leafBalance);
        }
        return new BalanceMutationResult(true, leafBalance - cost);
    }

    public static BalanceMutationResult spend(int leafBalance, int amount) {
        if (amount > leafBalance) {
            return new BalanceMutationResult(false, leafBalance);
        }
        return new BalanceMutationResult(true, leafBalance - amount);
    }

    /** Crediting leaves (goal/checkin/gratitude rewards, leaf-pack purchases) never fails. */
    public static int credit(int leafBalance, int amount) {
        return leafBalance + amount;
    }
}
