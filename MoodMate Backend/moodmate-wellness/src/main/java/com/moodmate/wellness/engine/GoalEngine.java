package com.moodmate.wellness.engine;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

/**
 * Pure, dependency-free gamification engine, ported verbatim from the monolith - deliberately has
 * no Spring/JPA annotations so the rules can be reasoned about and unit-tested without a database
 * or app context. See GoalEngineTest, which is now actually runnable (and should be run) since
 * this project has real Maven/JDK access, unlike the sandbox that originally wrote it.
 *
 * Contract this must not regress:
 *  - completing ALL of today's goals raises treeXP by each goal's xp value, and increments
 *    streakCount by exactly 1 - but only on the toggle that completes the LAST remaining goal,
 *    never per-goal.
 *  - unchecking a goal afterward does NOT undo a streak increment that already happened.
 *  - treeXP never drops below 0.
 *  - a purchase costing more than the available balance is rejected with no mutation.
 *
 * Multi-day handling: if more than one full calendar day has passed since
 * lastAllGoalsCompletedDate, the streak breaks - see {@link #reconcile}. That break either resets
 * the streak to 0, or, if a streak shield is active, consumes the shield instead and leaves the
 * streak untouched (see reconcile's own doc comment for why lastAllGoalsCompletedDate is bumped
 * forward rather than left alone when a shield is consumed).
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

    /**
     * Immutable snapshot of the per-user gamification state the engine reads and writes.
     * doubleXpActiveUntil (Feature 14 - Shop Improvements) is null when no boost is active, or
     * the instant it expires - see applyToggle's doc comment for how it's used.
     */
    public record WellnessState(int treeXp, int streakCount, LocalDate lastAllGoalsCompletedDate,
                                 boolean hasStreakShield, Instant doubleXpActiveUntil) {
    }

    public record ToggleResult(int newTreeXp, int newStreakCount, LocalDate newLastAllGoalsCompletedDate,
                                boolean streakIncrementedThisToggle, boolean hasStreakShield,
                                boolean streakShieldConsumedThisCall, boolean doubleXpAppliedThisToggle) {
    }

    /** Result of {@link #reconcile} - the streak-break check in isolation, used both by a plain
     * read (WellnessService.getState, so a stale streak is never displayed just because the user
     * hasn't toggled anything today) and internally by {@link #applyToggle}. */
    public record ReconcileResult(int streakCount, LocalDate lastAllGoalsCompletedDate,
                                   boolean hasStreakShield, boolean streakShieldConsumed, boolean streakReset) {
    }

    /**
     * Checks whether more than one full day has passed since lastAllGoalsCompletedDate. If not,
     * returns the state unchanged. If so:
     *  - with an active shield: the shield is consumed (hasStreakShield -> false) and the streak
     *    is preserved. lastAllGoalsCompletedDate is deliberately bumped forward to "yesterday"
     *    (today.minusDays(1)) rather than left at its old value - without this, calling reconcile
     *    a second time on the SAME day (e.g. two GET /state calls before the user completes
     *    anything) would see the exact same gap and incorrectly consume/reset again. Bumping it
     *    forward makes today's check pass cleanly while still allowing tomorrow's check to catch a
     *    genuinely new gap if the user still hasn't played.
     *  - with no shield: the streak resets to 0 and lastAllGoalsCompletedDate clears to null.
     */
    public static ReconcileResult reconcile(WellnessState state, LocalDate today) {
        LocalDate lastCompleted = state.lastAllGoalsCompletedDate();
        boolean broken = lastCompleted != null && lastCompleted.isBefore(today.minusDays(1));
        if (!broken) {
            return new ReconcileResult(state.streakCount(), lastCompleted, state.hasStreakShield(), false, false);
        }
        if (state.hasStreakShield()) {
            return new ReconcileResult(state.streakCount(), today.minusDays(1), false, true, false);
        }
        return new ReconcileResult(0, null, false, false, true);
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
     * @param now                         caller-supplied "now" (Feature 14 - Shop Improvements),
     *                                    compared against state.doubleXpActiveUntil() to decide
     *                                    whether the Double XP boost is active for this toggle.
     *                                    While active, the goal's xp is doubled in BOTH
     *                                    directions (checking on and unchecking off), matching
     *                                    this engine's existing pattern of always recomputing the
     *                                    delta from the goal's current definition rather than
     *                                    storing what was actually awarded at check-time (the
     *                                    same simplification already applies if a goal's xp value
     *                                    itself changes between a check and an uncheck).
     */
    public static ToggleResult applyToggle(WellnessState state, List<GoalDef> todaysGoalDefs, long toggledGoalId,
                                            boolean toggledGoalWasDoneBefore, boolean allGoalsDoneAfterThisToggle,
                                            LocalDate today, Instant now) {
        GoalDef toggled = todaysGoalDefs.stream()
                .filter(g -> g.templateId() == toggledGoalId)
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException(
                        "toggledGoalId not present in todaysGoalDefs: " + toggledGoalId));

        boolean doubleXpActive = state.doubleXpActiveUntil() != null && now != null
                && now.isBefore(state.doubleXpActiveUntil());
        int effectiveXp = doubleXpActive ? toggled.xp() * 2 : toggled.xp();
        int delta = toggledGoalWasDoneBefore ? -effectiveXp : effectiveXp;
        int nextXp = Math.max(0, state.treeXp() + delta);

        ReconcileResult reconciled = reconcile(state, today);
        int streak = reconciled.streakCount();
        LocalDate lastCompleted = reconciled.lastAllGoalsCompletedDate();
        boolean hasShield = reconciled.hasStreakShield();

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

        return new ToggleResult(nextXp, streak, lastCompleted, streakIncrementedThisToggle,
                hasShield, reconciled.streakShieldConsumed(), doubleXpActive);
    }

    // ── Leaf-balance pure functions ─────────────────────────────────────────
    // These don't belong to wellness's own data anymore (leaf balance moved to wallet-service's
    // LeafWallet - see moodmate-wallet), but they're kept here, unmodified, purely so
    // GoalEngineTest - the ONE unit test suite this whole port has, and one this project can
    // actually execute for the first time - keeps testing the exact same pure logic it always did,
    // with zero behavior drift. wallet-service's WalletService independently inlines this same
    // cost > balance check rather than depending on wellness-service for it.

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

    /** Crediting leaves never fails. */
    public static int credit(int leafBalance, int amount) {
        return leafBalance + amount;
    }
}
