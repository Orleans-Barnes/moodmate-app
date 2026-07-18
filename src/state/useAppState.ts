import { create } from 'zustand';

export type DailyGoal = {
  id: string;
  label: string;
  xp: number;
  done: boolean;
};

const INITIAL_GOALS: DailyGoal[] = [
  { id: 'mood-checkin', label: 'Morning mood check-in', xp: 10, done: false },
  { id: 'gratitude-note', label: 'Write one gratitude', xp: 10, done: false },
  { id: 'breathing', label: '2-min breathing', xp: 15, done: false },
];

const TREE_XP_MAX = 700;

type TreeStage = 'Roots' | 'Sprout' | 'Bloom' | 'Canopy';

interface AppState {
  // wellness tree
  treeXP: number;
  treeXPMax: number;
  treeStage: TreeStage;
  treeSkin: string;

  // streak
  streakCount: number;

  // daily goals (drives tree growth — this is the real wiring behind
  // "does the tree grow when the streak increases?")
  goals: DailyGoal[];

  // cosmetic currency (Tree Shop)
  leafBalance: number;

  // actions
  toggleGoal: (id: string) => void;
  addTreeXP: (amount: number) => void;
  setTreeSkin: (emoji: string, cost: number) => boolean;
  spendLeaves: (amount: number) => boolean;
  earnLeaves: (amount: number) => void;
}

function stageForXP(xp: number, max: number): TreeStage {
  const pct = xp / max;
  if (pct < 0.25) return 'Roots';
  if (pct < 0.75) return 'Sprout';
  if (pct < 1) return 'Bloom';
  return 'Canopy';
}

export const useAppState = create<AppState>((set, get) => ({
  treeXP: 420,
  treeXPMax: TREE_XP_MAX,
  treeStage: stageForXP(420, TREE_XP_MAX),
  treeSkin: '🌳',

  streakCount: 7,

  goals: INITIAL_GOALS,

  leafBalance: 240,

  toggleGoal: (id) => {
    const { goals, treeXP, treeXPMax, streakCount } = get();
    const goal = goals.find((g) => g.id === id);
    if (!goal) return;

    const wasDone = goal.done;
    const nextGoals = goals.map((g) => (g.id === id ? { ...g, done: !wasDone } : g));
    const delta = wasDone ? -goal.xp : goal.xp;
    const nextXP = Math.max(0, treeXP + delta);

    const allDoneNow = !wasDone && nextGoals.every((g) => g.done);

    set({
      goals: nextGoals,
      treeXP: nextXP,
      treeStage: stageForXP(nextXP, treeXPMax),
      streakCount: allDoneNow ? streakCount + 1 : streakCount,
    });
  },

  addTreeXP: (amount) => {
    const { treeXP, treeXPMax } = get();
    const nextXP = Math.max(0, treeXP + amount);
    set({ treeXP: nextXP, treeStage: stageForXP(nextXP, treeXPMax) });
  },

  setTreeSkin: (emoji, cost) => {
    const { leafBalance } = get();
    if (cost > 0 && cost > leafBalance) return false;
    set({ treeSkin: emoji, leafBalance: leafBalance - cost });
    return true;
  },

  spendLeaves: (amount) => {
    const { leafBalance } = get();
    if (amount > leafBalance) return false;
    set({ leafBalance: leafBalance - amount });
    return true;
  },

  earnLeaves: (amount) => set((s) => ({ leafBalance: s.leafBalance + amount })),
}));

/** Convenience selector — what % full the tree's XP bar should render at. */
export function useTreeProgressPct(): number {
  const { treeXP, treeXPMax } = useAppState();
  return Math.max(0, Math.min(100, Math.round((treeXP / treeXPMax) * 100)));
}
