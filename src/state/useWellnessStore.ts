import { create } from 'zustand';
import { getWellnessState, toggleGoal as apiToggleGoal, buyStreakShield as apiBuyStreakShield } from '@/api/wellness';
import type { TreeStageKey, WellnessStateView } from '@/api/types';

export interface WellnessGoal {
  id: string;
  label: string;
  xp: number;
  done: boolean;
}

export type TreeStageLabel = 'Roots' | 'Sprout' | 'Bloom' | 'Canopy';

const STAGE_LABELS: Record<TreeStageKey, TreeStageLabel> = {
  ROOTS: 'Roots',
  SPROUT: 'Sprout',
  BLOOM: 'Bloom',
  CANOPY: 'Canopy',
};

function goalsFromApi(state: WellnessStateView): WellnessGoal[] {
  return state.todaysGoals.map((g) => ({ id: g.key, label: g.label, xp: g.xp, done: g.done }));
}

interface WellnessState {
  treeXp: number;
  treeXpMax: number;
  treeStage: TreeStageLabel;
  treeSkinEmoji: string;
  leafBalance: number;
  streakCount: number;
  hasStreakShield: boolean;
  lastCompletedDate: string | null;
  goals: WellnessGoal[];
  loading: boolean;
  load: (token: string) => Promise<void>;
  /** Returns whether this toggle was the one that completed all of today's goals (streak +1). */
  toggleGoal: (token: string, key: string) => Promise<boolean>;
  /** Spends 10 leaves to activate a streak shield. */
  buyStreakShield: (token: string) => Promise<void>;
}

function applyState(set: (partial: Partial<WellnessState>) => void, state: WellnessStateView) {
  set({
    treeXp: state.treeXp,
    treeXpMax: state.treeXpMax,
    treeStage: STAGE_LABELS[state.treeStage],
    treeSkinEmoji: state.treeSkinEmoji,
    leafBalance: state.leafBalance,
    streakCount: state.streakCount,
    hasStreakShield: state.hasStreakShield ?? false,
    lastCompletedDate: state.lastAllGoalsCompletedDate ?? null,
    goals: goalsFromApi(state),
  });
}

/**
 * Backed by the real Wellness API (com.moodmate.backend.wellness) - Phase 3/Task #7. Replaces the
 * goals/treeXp/streak/treeSkin/leafBalance slice of the old local-only useAppState mock; Home,
 * Profile, WellnessTree, and Shop all read from here now so they show one consistent number.
 */
export const useWellnessStore = create<WellnessState>((set) => ({
  treeXp: 0,
  treeXpMax: 1,
  treeStage: 'Roots',
  treeSkinEmoji: '🌳',
  leafBalance: 0,
  streakCount: 0,
  hasStreakShield: false,
  lastCompletedDate: null,
  goals: [],
  loading: false,
  load: async (token) => {
    set({ loading: true });
    // Guest users have no JWT — bail before hitting the real API (prevents 403)
    if (token === 'guest') return;

    try {
      const state = await getWellnessState(token);
      applyState(set, state);
    } finally {
      set({ loading: false });
    }
  },
  toggleGoal: async (token, key) => {
    const result = await apiToggleGoal(token, key);
    applyState(set, result.state);
    return result.streakIncrementedThisToggle;
  },
  buyStreakShield: async (token) => {
    const state = await apiBuyStreakShield(token);
    applyState(set, state);
  },
}));
