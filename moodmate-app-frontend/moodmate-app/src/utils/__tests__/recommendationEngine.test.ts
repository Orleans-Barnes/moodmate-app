import { test } from 'node:test';
import assert from 'node:assert/strict';
import { recommendationEngine } from '../recommendationEngine.ts';
import type {
  RecommendationInput,
  RecommendationMoodInput,
  RecommendationWellnessStateInput,
} from '../recommendationEngine.ts';
import type { EmotionKey, PreferredSupport, WellnessGoal } from '@/api/types';

// Phase 1D. Tests for recommendationEngine.ts, pinned against the rule hierarchy documented in
// PHASE_1D_DASHBOARD_DATA_CONTRACT.md ("Recommendation engine - rule hierarchy" section). If this
// priority order ever changes, both that document and this file's "priority ordering" group
// should be updated together, per the doc's own instruction.
//
// Run with: node --experimental-strip-types --test src/utils/__tests__/recommendationEngine.test.ts
// Zero new dependencies: recommendationEngine.ts's only import is `import type { ... } from
// '@/api/types'`, which Node's native TypeScript stripping erases entirely at runtime, so no path
// alias resolution is needed for the source file. This test file imports the real, type-only
// `@/api/types` the same way - erased, not resolved.

function todayISO(): string {
  return new Date().toISOString();
}

function yesterdayISO(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString();
}

/** A "calm today" mood: today's date, non-distressed emotion, low stress - the shape needed so
 * rules 1-2 don't fire and the goal-based branch (rule 3) is what's actually under test. */
function calmMoodToday(overrides: Partial<RecommendationMoodInput> = {}): RecommendationMoodInput {
  return {
    emotionKey: 'HAPPY',
    stressLevel: 1,
    energyLevel: 3,
    createdAt: todayISO(),
    ...overrides,
  };
}

function baseInput(overrides: Partial<RecommendationInput> = {}): RecommendationInput {
  return {
    goals: [],
    preferredSupport: [],
    latestMood: null,
    wellnessState: null,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// 1. No / stale mood -> neutral CHECK_IN default, unconditionally, before anything else runs.
// ---------------------------------------------------------------------------

test('no check-in at all (latestMood null) returns the default CHECK_IN recommendation', () => {
  const result = recommendationEngine(baseInput({ latestMood: null, goals: ['LESS_STRESS'] }));
  assert.equal(result.action.type, 'CHECK_IN');
  assert.equal(result.action.route, 'CheckIn');
  assert.equal(result.title, 'Start where you are');
});

test('stale mood (createdAt is yesterday, not today) falls back to the default, even with goals set', () => {
  const result = recommendationEngine(
    baseInput({
      latestMood: calmMoodToday({ createdAt: yesterdayISO() }),
      goals: ['BETTER_SLEEP'],
    }),
  );
  assert.equal(result.action.type, 'CHECK_IN');
  assert.equal(result.action.route, 'CheckIn');
});

// ---------------------------------------------------------------------------
// 2. High stress / distressed emotion overrides any selected goal (rule 2 beats rule 3).
// ---------------------------------------------------------------------------

const DISTRESSED_EMOTIONS: EmotionKey[] = ['ANXIOUS', 'STRESSED', 'OVERWHELMED', 'FRUSTRATED', 'LONELY'];

for (const emotion of DISTRESSED_EMOTIONS) {
  test(`distressed emotion ${emotion} (low stress) overrides a selected goal with BREATHING`, () => {
    const result = recommendationEngine(
      baseInput({
        latestMood: calmMoodToday({ emotionKey: emotion, stressLevel: 1 }),
        goals: ['BETTER_SLEEP'],
      }),
    );
    assert.equal(result.action.type, 'BREATHING');
    assert.equal(result.action.route, 'BreathingSession');
    assert.match(result.message, /heavy feeling/);
  });
}

test('high stress (stressLevel >= 4) with a non-distressed emotion also overrides a selected goal', () => {
  const result = recommendationEngine(
    baseInput({
      latestMood: calmMoodToday({ emotionKey: 'HAPPY', stressLevel: 5 }),
      goals: ['BETTER_SLEEP'],
    }),
  );
  assert.equal(result.action.type, 'BREATHING');
  assert.match(result.message, /stress level looks high/);
});

test('stressLevel exactly at the threshold (4) counts as high stress', () => {
  const result = recommendationEngine(
    baseInput({
      latestMood: calmMoodToday({ emotionKey: 'CALM', stressLevel: 4 }),
      goals: ['MORE_MOTIVATION'],
    }),
  );
  assert.equal(result.action.type, 'BREATHING');
});

test('stressLevel just below the threshold (3) with a non-distressed emotion does NOT override goals', () => {
  const result = recommendationEngine(
    baseInput({
      latestMood: calmMoodToday({ emotionKey: 'CALM', stressLevel: 3 }),
      goals: ['MORE_MOTIVATION'],
    }),
  );
  assert.equal(result.action.type, 'WELLNESS_TREE');
});

// ---------------------------------------------------------------------------
// 3. One test per wellness goal - single goal selected, calm mood, no preferredSupport.
// ---------------------------------------------------------------------------

const GOAL_EXPECTATIONS: Record<WellnessGoal, { type: string; route: string }> = {
  LESS_STRESS: { type: 'BREATHING', route: 'BreathingSession' },
  BETTER_SLEEP: { type: 'SLEEP', route: 'SleepTracker' },
  MORE_CONFIDENT: { type: 'GRATITUDE', route: 'GratitudeJar' },
  BETTER_FOCUS: { type: 'HABIT', route: 'HabitTracker' },
  BETTER_GRADES: { type: 'JOURNAL', route: 'JournalEntry' },
  TRACK_EMOTIONS: { type: 'CHECK_IN', route: 'CheckIn' },
  BUILD_HEALTHY_HABITS: { type: 'HABIT', route: 'HabitTracker' },
  CONNECT_WITH_SUPPORT: { type: 'COMMUNITY', route: 'Community' },
  MORE_MOTIVATION: { type: 'WELLNESS_TREE', route: 'WellnessTree' },
};

for (const [goal, expected] of Object.entries(GOAL_EXPECTATIONS) as [WellnessGoal, { type: string; route: string }][]) {
  test(`single goal ${goal} recommends ${expected.type} / ${expected.route}`, () => {
    const result = recommendationEngine(
      baseInput({ latestMood: calmMoodToday(), goals: [goal] }),
    );
    assert.equal(result.action.type, expected.type);
    assert.equal(result.action.route, expected.route);
  });
}

// ---------------------------------------------------------------------------
// 4. Multi-goal + preferredSupport tie-breaking.
// ---------------------------------------------------------------------------

test('multiple goals, no preferredSupport match -> first selected goal wins by array order', () => {
  const result = recommendationEngine(
    baseInput({
      latestMood: calmMoodToday(),
      goals: ['LESS_STRESS', 'BETTER_SLEEP'],
      preferredSupport: [],
    }),
  );
  assert.equal(result.action.type, 'BREATHING'); // LESS_STRESS, first in array
});

test('preferredSupport with no matching candidate action falls back to first selected goal', () => {
  const result = recommendationEngine(
    baseInput({
      latestMood: calmMoodToday(),
      goals: ['BETTER_SLEEP', 'MORE_CONFIDENT'],
      preferredSupport: ['JOURNALING'], // maps to JOURNAL, neither SLEEP nor GRATITUDE matches
    }),
  );
  assert.equal(result.action.type, 'SLEEP'); // BETTER_SLEEP, first in array, no support match
});

test('preferredSupport match overrides array order when a later goal matches the preference', () => {
  const result = recommendationEngine(
    baseInput({
      latestMood: calmMoodToday(),
      goals: ['CONNECT_WITH_SUPPORT', 'LESS_STRESS'], // COMMUNITY is first by array order
      preferredSupport: ['BREATHING'], // maps to BREATHING, matches the *second* goal instead
    }),
  );
  assert.equal(result.action.type, 'BREATHING'); // LESS_STRESS wins via preferredSupport, not array order
});

test('preferredSupport entries not in the support-to-action map (e.g. SELF_GUIDED) are skipped, falls back to array order', () => {
  const result = recommendationEngine(
    baseInput({
      latestMood: calmMoodToday(),
      goals: ['MORE_CONFIDENT', 'BETTER_FOCUS'],
      preferredSupport: ['SELF_GUIDED', 'AI_COACH'], // neither is in SUPPORT_TO_ACTION
    }),
  );
  assert.equal(result.action.type, 'GRATITUDE'); // MORE_CONFIDENT, first in array
});

test('preferredSupport is checked in its own array order: first preference with any match wins', () => {
  const result = recommendationEngine(
    baseInput({
      latestMood: calmMoodToday(),
      goals: ['MORE_CONFIDENT', 'BETTER_FOCUS'],
      // COMMUNITY doesn't match either goal's action; PEER_MENTOR also maps to COMMUNITY and
      // also doesn't match - both should be skipped, falling back to array order.
      preferredSupport: ['COMMUNITY', 'PEER_MENTOR'],
    }),
  );
  assert.equal(result.action.type, 'GRATITUDE');
});

// ---------------------------------------------------------------------------
// 5. Priority ordering: distress beats goals - the BETTER_SLEEP + ANXIOUS + stress-5 case.
// ---------------------------------------------------------------------------

test('priority ordering: BETTER_SLEEP goal + ANXIOUS emotion + stressLevel 5 -> BREATHING wins, not SLEEP', () => {
  const result = recommendationEngine(
    baseInput({
      latestMood: calmMoodToday({ emotionKey: 'ANXIOUS', stressLevel: 5 }),
      goals: ['BETTER_SLEEP'],
    }),
  );
  assert.equal(result.action.type, 'BREATHING');
  assert.equal(result.action.route, 'BreathingSession');
  // Both isHighStress and isDistressedEmotion are true here; the high-stress message wins the
  // ternary in the implementation (checked first), so pin that specific wording choice too.
  assert.match(result.message, /stress level looks high/);
});

test('priority ordering: distressed emotion alone (low stress) still beats a selected goal', () => {
  const result = recommendationEngine(
    baseInput({
      latestMood: calmMoodToday({ emotionKey: 'LONELY', stressLevel: 2 }),
      goals: ['MORE_MOTIVATION'],
    }),
  );
  assert.equal(result.action.type, 'BREATHING');
  assert.match(result.message, /heavy feeling/);
});

test('priority ordering: no check-in today beats everything, even high stress data from a stale entry', () => {
  const result = recommendationEngine(
    baseInput({
      latestMood: calmMoodToday({ emotionKey: 'ANXIOUS', stressLevel: 5, createdAt: yesterdayISO() }),
      goals: ['BETTER_SLEEP'],
    }),
  );
  assert.equal(result.action.type, 'CHECK_IN');
});

// ---------------------------------------------------------------------------
// 6. Guest-shaped input: no auth, no profile, no check-in - must degrade to the neutral default.
// ---------------------------------------------------------------------------

test('guest-shaped input (empty goals, empty preferredSupport, no mood, no wellnessState) returns the default', () => {
  const result = recommendationEngine(
    baseInput({ goals: [], preferredSupport: [], latestMood: null, wellnessState: null }),
  );
  assert.equal(result.action.type, 'CHECK_IN');
  assert.equal(result.title, 'Start where you are');
});

test('guest-shaped input stays on the default even if wellnessState is (unexpectedly) populated', () => {
  const result = recommendationEngine(
    baseInput({
      goals: [],
      preferredSupport: [],
      latestMood: null,
      wellnessState: { streakCount: 3, allGoalsDoneToday: false },
    }),
  );
  assert.equal(result.action.type, 'CHECK_IN');
});

// ---------------------------------------------------------------------------
// 7. wellnessState is accepted but not yet consulted by any rule (documented in
//    PHASE_1D_DASHBOARD_DATA_CONTRACT.md's "wellnessState - accepted, not yet consulted" section).
//    These tests exist to make that fact explicit and to fail loudly the day someone adds a rule
//    that reads wellnessState without updating this file and the doc together.
// ---------------------------------------------------------------------------

test('wellnessState does not affect the result: identical mood/goals with different wellnessState produce identical output', () => {
  const input = { latestMood: calmMoodToday(), goals: ['BETTER_FOCUS'] as WellnessGoal[], preferredSupport: [] as PreferredSupport[] };

  const withNullState = recommendationEngine(baseInput({ ...input, wellnessState: null }));
  const withPopulatedState = recommendationEngine(
    baseInput({
      ...input,
      wellnessState: { streakCount: 30, allGoalsDoneToday: true } as RecommendationWellnessStateInput,
    }),
  );

  assert.deepEqual(withNullState, withPopulatedState);
});

test('wellnessState.allGoalsDoneToday=true does not suppress or change a goal-based recommendation', () => {
  const result = recommendationEngine(
    baseInput({
      latestMood: calmMoodToday(),
      goals: ['BETTER_FOCUS'],
      wellnessState: { streakCount: 7, allGoalsDoneToday: true },
    }),
  );
  // If a future rule implements the "streak >= 7 and all goals done -> suggest something new"
  // idea noted in the data contract, this assertion should change deliberately, alongside an
  // update to PHASE_1D_DASHBOARD_DATA_CONTRACT.md's rule hierarchy section - not silently.
  assert.equal(result.action.type, 'HABIT');
  assert.equal(result.action.route, 'HabitTracker');
});
