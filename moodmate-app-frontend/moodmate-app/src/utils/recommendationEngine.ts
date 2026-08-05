import type { EmotionKey, PreferredSupport, WellnessGoal } from '@/api/types';

// Phase 1D. Deterministic, rule-based recommendation logic — no React, Zustand, navigation, or
// network imports (only plain types from '@/api/types', which are just string unions/interfaces,
// not runtime dependencies). Keeping this framework-free is intentional per the Phase 1D
// implementation plan: it makes the rules unit-testable in isolation, reusable from a future
// notification scheduler (Phase 1E) and from an AI-wording layer (Phase 2) without dragging in
// any UI concerns, and easy to tweak without touching a single component.

export type RecommendationActionType =
  | 'CHECK_IN'
  | 'BREATHING'
  | 'JOURNAL'
  | 'HABIT'
  | 'SLEEP'
  | 'GRATITUDE'
  | 'COMMUNITY'
  | 'COUNSELLOR'
  | 'WELLNESS_TREE';

export interface RecommendationAction {
  type: RecommendationActionType;
  /** Real route name from RootStackParamList/MainTabParamList - resolved to an actual
   * navigation.navigate() call by the caller (a component), never by this file. */
  route: string;
  params?: Record<string, unknown>;
}

export interface Recommendation {
  title: string;
  message: string;
  action: RecommendationAction;
}

export interface RecommendationMoodInput {
  emotionKey: EmotionKey;
  stressLevel: number; // 1-5, mirrors CheckInRequest/CheckInResponse
  energyLevel: number; // 1-5
  /** ISO date string (createdAt) of the latest check-in - used only to decide "today" vs stale. */
  createdAt: string;
}

export interface RecommendationWellnessStateInput {
  streakCount: number;
  /** Whether every one of today's 3 daily goals is already done - if so, don't recommend one of
   * them as "today's focus", since it's already complete. */
  allGoalsDoneToday: boolean;
}

export interface RecommendationInput {
  goals: WellnessGoal[];
  preferredSupport: PreferredSupport[];
  /** null when the student has no check-in yet today (or ever) - a distinct, higher-priority case,
   * not just "missing data". */
  latestMood: RecommendationMoodInput | null;
  wellnessState: RecommendationWellnessStateInput | null;
}

const STRESSED_EMOTIONS: ReadonlySet<EmotionKey> = new Set([
  'ANXIOUS', 'STRESSED', 'OVERWHELMED', 'FRUSTRATED', 'LONELY',
]);

const HIGH_STRESS_THRESHOLD = 4; // out of 5, matches CheckInRequest's @Min(1) @Max(5) scale

/** One default action per goal, in the exact order from PHASE_1D_WIDGET_MAPPING.md's rule table.
 * Order matters: when a student picked multiple goals, the first match here wins unless
 * preferredSupport re-weights it (see pickForGoals below). */
const GOAL_RECOMMENDATIONS: Record<WellnessGoal, Recommendation> = {
  LESS_STRESS: {
    title: 'Take a breath',
    message: 'A short breathing session can help take the edge off before you do anything else.',
    action: { type: 'BREATHING', route: 'BreathingSession', params: { session: '4-7-8', duration: 300 } },
  },
  BETTER_SLEEP: {
    title: 'Wind down tonight',
    message: 'Log tonight’s sleep goal or check your sleep trend to build a steadier rhythm.',
    action: { type: 'SLEEP', route: 'SleepTracker' },
  },
  MORE_CONFIDENT: {
    title: 'Notice something good',
    message: 'Drop a quick gratitude entry - a small win still counts.',
    action: { type: 'GRATITUDE', route: 'GratitudeJar' },
  },
  BETTER_FOCUS: {
    title: 'Build the streak',
    message: 'Check off today’s habit to keep your focus routine going.',
    action: { type: 'HABIT', route: 'HabitTracker' },
  },
  BETTER_GRADES: {
    title: 'Balance the workload',
    message: 'Write a quick reflection on how study’s going - it helps spot burnout before it hits.',
    action: { type: 'JOURNAL', route: 'JournalEntry', params: { template: 'study-balance', icon: '📚' } },
  },
  TRACK_EMOTIONS: {
    title: 'Log how you feel',
    message: 'A quick mood check-in keeps your emotional pattern visible over time.',
    action: { type: 'CHECK_IN', route: 'CheckIn' },
  },
  BUILD_HEALTHY_HABITS: {
    title: 'Keep the habit going',
    message: 'Your habit tracker is ready for today’s check-off.',
    action: { type: 'HABIT', route: 'HabitTracker' },
  },
  CONNECT_WITH_SUPPORT: {
    title: 'Reach out',
    message: 'The community and support tabs are there whenever you want to talk to someone.',
    action: { type: 'COMMUNITY', route: 'Community' },
  },
  MORE_MOTIVATION: {
    title: 'Watch your tree grow',
    message: 'Check in on your Wellness Tree - every small action moves it forward.',
    action: { type: 'WELLNESS_TREE', route: 'WellnessTree' },
  },
};

/** preferredSupport re-weighting: if the student said they prefer a support type that maps to a
 * different action than the top goal-based pick, and that support type's action is ALSO relevant
 * to one of their other selected goals, prefer it. This is a light tie-breaker, not a full
 * override - a stated goal always wins over a stated support preference on its own. */
const SUPPORT_TO_ACTION: Partial<Record<PreferredSupport, RecommendationActionType>> = {
  BREATHING: 'BREATHING',
  JOURNALING: 'JOURNAL',
  COMMUNITY: 'COMMUNITY',
  COUNSELLOR: 'COUNSELLOR',
  PEER_MENTOR: 'COMMUNITY',
};

function pickForGoals(goals: WellnessGoal[], preferredSupport: PreferredSupport[]): Recommendation | null {
  if (goals.length === 0) return null;

  const candidates = goals.map((g) => GOAL_RECOMMENDATIONS[g]).filter(Boolean);
  if (candidates.length === 0) return null;

  for (const support of preferredSupport) {
    const preferredType = SUPPORT_TO_ACTION[support];
    if (!preferredType) continue;
    const match = candidates.find((c) => c.action.type === preferredType);
    if (match) return match;
  }

  return candidates[0];
}

const DEFAULT_RECOMMENDATION: Recommendation = {
  title: 'Start where you are',
  message: 'Check in with how you’re feeling today - everything else builds from there.',
  action: { type: 'CHECK_IN', route: 'CheckIn' },
};

function isToday(isoDate: string): boolean {
  const d = new Date(isoDate);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

/**
 * Pure function: same input always produces the same output, no side effects, no I/O. Priority
 * order, highest first:
 *   1. No check-in yet today -> recommend checking in (mood data grounds every other decision).
 *   2. Latest mood is high-stress or a stressed/anxious/overwhelmed emotion -> recommend a
 *      calming action regardless of stated goals (immediate need beats a standing preference).
 *   3. Otherwise, derive from the student's stated wellness goals, tie-broken by preferredSupport.
 *   4. No goals selected (skipped onboarding, or a guest) -> a neutral default.
 */
export function recommendationEngine(input: RecommendationInput): Recommendation {
  const { goals, preferredSupport, latestMood } = input;

  if (!latestMood || !isToday(latestMood.createdAt)) {
    return DEFAULT_RECOMMENDATION;
  }

  const isHighStress = latestMood.stressLevel >= HIGH_STRESS_THRESHOLD;
  const isDistressedEmotion = STRESSED_EMOTIONS.has(latestMood.emotionKey);

  if (isHighStress || isDistressedEmotion) {
    return {
      title: 'Take a moment for yourself',
      message: isHighStress
        ? 'Your stress level looks high today - a short breathing session before anything else can help.'
        : 'That sounds like a heavy feeling to carry - a few minutes of breathing or journaling might help.',
      action: { type: 'BREATHING', route: 'BreathingSession', params: { session: '4-7-8', duration: 300 } },
    };
  }

  const goalPick = pickForGoals(goals, preferredSupport);
  if (goalPick) return goalPick;

  return DEFAULT_RECOMMENDATION;
}
