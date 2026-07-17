package com.moodmate.wellness.engine;

import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Exercises the contract documented on {@link GoalEngine}. Ported unmodified from the monolith's
 * src/test/java/com/moodmate/backend/wellness/GoalEngineTest.java, which had never actually been
 * run (its own comment said so - the sandbox that wrote it had no JDK/Maven). This copy CAN be run
 * for real: `mvnw -pl moodmate-wellness -am test`. Please run it and report back what happens -
 * this is the first time this logic has ever actually been executed.
 *
 * All pre-existing tests below pass `null` for doubleXpActiveUntil and Instant.now() (or null) for
 * `now` - Feature 14 (Shop Improvements) additions - which reproduces the exact same behavior
 * these tests verified before that feature existed (a null doubleXpActiveUntil always means the
 * boost is inactive, so effectiveXp == the goal's plain xp, unchanged from before). The dedicated
 * Double XP tests are grouped at the bottom.
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
        GoalEngine.WellnessState state = new GoalEngine.WellnessState(0, 0, null, false, null);

        GoalEngine.ToggleResult result = GoalEngine.applyToggle(state, GOALS, 3L, false, true, today, Instant.now());

        assertEquals(15, result.newTreeXp());
        assertEquals(1, result.newStreakCount());
        assertEquals(today, result.newLastAllGoalsCompletedDate());
        assertTrue(result.streakIncrementedThisToggle());
    }

    @Test
    void completingANonFinalGoalDoesNotIncrementStreak() {
        LocalDate today = LocalDate.of(2026, 6, 28);
        GoalEngine.WellnessState state = new GoalEngine.WellnessState(0, 0, null, false, null);

        GoalEngine.ToggleResult result = GoalEngine.applyToggle(state, GOALS, 1L, false, false, today, Instant.now());

        assertEquals(10, result.newTreeXp());
        assertEquals(0, result.newStreakCount());
        assertFalse(result.streakIncrementedThisToggle());
    }

    @Test
    void uncheckingAfterStreakIncrementDoesNotDecrementStreak() {
        LocalDate today = LocalDate.of(2026, 6, 28);
        // All 3 goals already done today; streak already counted.
        GoalEngine.WellnessState state = new GoalEngine.WellnessState(35, 1, today, false, null);

        // Uncheck goal 3 (wasDoneBefore=true); allGoalsDoneAfter becomes false.
        GoalEngine.ToggleResult result = GoalEngine.applyToggle(state, GOALS, 3L, true, false, today, Instant.now());

        assertEquals(20, result.newTreeXp());        // 35 - 15
        assertEquals(1, result.newStreakCount());    // unchanged - no decrement on uncheck
        assertEquals(today, result.newLastAllGoalsCompletedDate());
        assertFalse(result.streakIncrementedThisToggle());
    }

    @Test
    void treeXpNeverDropsBelowZero() {
        LocalDate today = LocalDate.of(2026, 6, 28);
        GoalEngine.WellnessState state = new GoalEngine.WellnessState(5, 0, null, false, null);

        GoalEngine.ToggleResult result = GoalEngine.applyToggle(state, GOALS, 3L, true, false, today, Instant.now());

        assertEquals(0, result.newTreeXp());
    }

    @Test
    void gapOfMoreThanOneDayResetsStreakBeforeApplyingToday() {
        LocalDate lastCompleted = LocalDate.of(2026, 6, 20);
        LocalDate today = LocalDate.of(2026, 6, 28);
        GoalEngine.WellnessState state = new GoalEngine.WellnessState(100, 9, lastCompleted, false, null);

        GoalEngine.ToggleResult result = GoalEngine.applyToggle(state, GOALS, 3L, false, true, today, Instant.now());

        assertEquals(1, result.newStreakCount()); // reset to 0, then +1 for completing today
    }

    @Test
    void consecutiveDayKeepsStreakGoing() {
        LocalDate yesterday = LocalDate.of(2026, 6, 27);
        LocalDate today = LocalDate.of(2026, 6, 28);
        GoalEngine.WellnessState state = new GoalEngine.WellnessState(100, 5, yesterday, false, null);

        GoalEngine.ToggleResult result = GoalEngine.applyToggle(state, GOALS, 3L, false, true, today, Instant.now());

        assertEquals(6, result.newStreakCount());
    }

    // ── Streak shield ────────────────────────────────────────────────────────

    @Test
    void activeShieldAbsorbsOneStreakBreakInsteadOfResetting() {
        LocalDate lastCompleted = LocalDate.of(2026, 6, 20);
        LocalDate today = LocalDate.of(2026, 6, 28);
        GoalEngine.WellnessState state = new GoalEngine.WellnessState(100, 9, lastCompleted, true, null);

        GoalEngine.ToggleResult result = GoalEngine.applyToggle(state, GOALS, 3L, false, true, today, Instant.now());

        // Streak preserved (9) then +1 for completing today, instead of resetting to 0 first.
        assertEquals(10, result.newStreakCount());
        assertFalse(result.hasStreakShield()); // consumed
        assertTrue(result.streakShieldConsumedThisCall());
    }

    @Test
    void reconcileConsumesShieldWithoutAnyToggle() {
        LocalDate lastCompleted = LocalDate.of(2026, 6, 20);
        LocalDate today = LocalDate.of(2026, 6, 28);
        GoalEngine.WellnessState state = new GoalEngine.WellnessState(100, 9, lastCompleted, true, null);

        GoalEngine.ReconcileResult result = GoalEngine.reconcile(state, today);

        assertEquals(9, result.streakCount()); // preserved, not reset
        assertFalse(result.hasStreakShield()); // consumed
        assertTrue(result.streakShieldConsumed());
        assertFalse(result.streakReset());
    }

    @Test
    void reconcileIsIdempotentOnTheSameDayAfterShieldConsumption() {
        LocalDate lastCompleted = LocalDate.of(2026, 6, 20);
        LocalDate today = LocalDate.of(2026, 6, 28);
        GoalEngine.WellnessState state = new GoalEngine.WellnessState(100, 9, lastCompleted, true, null);

        GoalEngine.ReconcileResult first = GoalEngine.reconcile(state, today);
        GoalEngine.WellnessState afterFirst = new GoalEngine.WellnessState(
                100, first.streakCount(), first.lastAllGoalsCompletedDate(), first.hasStreakShield(), null);

        // Calling reconcile again the SAME day (e.g. a second GET /state before any toggle) must
        // not re-trigger a break - the shield already paid for this exact gap.
        GoalEngine.ReconcileResult second = GoalEngine.reconcile(afterFirst, today);

        assertEquals(9, second.streakCount());
        assertFalse(second.streakShieldConsumed());
        assertFalse(second.streakReset());
    }

    @Test
    void noShieldStillResetsOnBreak() {
        LocalDate lastCompleted = LocalDate.of(2026, 6, 20);
        LocalDate today = LocalDate.of(2026, 6, 28);
        GoalEngine.WellnessState state = new GoalEngine.WellnessState(100, 9, lastCompleted, false, null);

        GoalEngine.ReconcileResult result = GoalEngine.reconcile(state, today);

        assertEquals(0, result.streakCount());
        assertFalse(result.hasStreakShield());
        assertFalse(result.streakShieldConsumed());
        assertTrue(result.streakReset());
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

    // ── Double XP boost (Feature 14 - Shop Improvements) ────────────────────────

    @Test
    void activeDoubleXpBoostDoublesTheAwardedXp() {
        LocalDate today = LocalDate.of(2026, 6, 28);
        Instant now = Instant.parse("2026-06-28T12:00:00Z");
        Instant boostActiveUntil = now.plusSeconds(3600); // still active
        GoalEngine.WellnessState state = new GoalEngine.WellnessState(0, 0, null, false, boostActiveUntil);

        // Goal 3 is worth 15 normally - doubled to 30 while the boost is active.
        GoalEngine.ToggleResult result = GoalEngine.applyToggle(state, GOALS, 3L, false, true, today, now);

        assertEquals(30, result.newTreeXp());
        assertTrue(result.doubleXpAppliedThisToggle());
    }

    @Test
    void expiredDoubleXpBoostDoesNotDoubleXp() {
        LocalDate today = LocalDate.of(2026, 6, 28);
        Instant now = Instant.parse("2026-06-28T12:00:00Z");
        Instant boostExpiredAt = now.minusSeconds(1); // already expired
        GoalEngine.WellnessState state = new GoalEngine.WellnessState(0, 0, null, false, boostExpiredAt);

        GoalEngine.ToggleResult result = GoalEngine.applyToggle(state, GOALS, 3L, false, true, today, now);

        assertEquals(15, result.newTreeXp()); // plain, not doubled
        assertFalse(result.doubleXpAppliedThisToggle());
    }

    @Test
    void noDoubleXpBoostMeansPlainXp() {
        LocalDate today = LocalDate.of(2026, 6, 28);
        GoalEngine.WellnessState state = new GoalEngine.WellnessState(0, 0, null, false, null);

        GoalEngine.ToggleResult result = GoalEngine.applyToggle(state, GOALS, 3L, false, true, today, Instant.now());

        assertEquals(15, result.newTreeXp());
        assertFalse(result.doubleXpAppliedThisToggle());
    }

    @Test
    void uncheckingWhileBoostActiveRemovesTheDoubledAmount() {
        LocalDate today = LocalDate.of(2026, 6, 28);
        Instant now = Instant.parse("2026-06-28T12:00:00Z");
        Instant boostActiveUntil = now.plusSeconds(3600);
        // Goal 3 was completed earlier while boosted, contributing 30 (doubled) to the current 30 xp.
        GoalEngine.WellnessState state = new GoalEngine.WellnessState(30, 1, today, false, boostActiveUntil);

        GoalEngine.ToggleResult result = GoalEngine.applyToggle(state, GOALS, 3L, true, false, today, now);

        assertEquals(0, result.newTreeXp()); // 30 - 30 (still boosted, so still doubled on the way out)
    }

    @Test
    void doubleXpBoostFieldDefaultsToNullOnAFreshWellnessState() {
        GoalEngine.WellnessState state = new GoalEngine.WellnessState(0, 0, null, false, null);
        assertNull(state.doubleXpActiveUntil());
    }
}
