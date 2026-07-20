import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import * as SecureStore from 'expo-secure-store';
import { getMyAchievements, unlockAchievement } from '@/api/gamification';

// ─── Secure storage adapter for Zustand persist ─────────────────────────────
const secureStorage = {
  getItem: async (name: string): Promise<string | null> => {
    try { return await SecureStore.getItemAsync(name); }
    catch { return null; }
  },
  setItem: async (name: string, value: string): Promise<void> => {
    try { await SecureStore.setItemAsync(name, value); }
    catch { /* silent on storage full */ }
  },
  removeItem: async (name: string): Promise<void> => {
    try { await SecureStore.deleteItemAsync(name); }
    catch { /* ignore */ }
  },
};

// ─── XP Level thresholds ────────────────────────────────────────────────────
const LEVEL_THRESHOLDS = [0, 100, 300, 600, 1000, 1500, 2200, 3000];

function xpToLevel(xp: number): { level: number; xpInLevel: number; xpForNextLevel: number } {
  let level = 1;
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i]) { level = i + 1; break; }
  }
  const base    = LEVEL_THRESHOLDS[level - 1] ?? 0;
  const next    = LEVEL_THRESHOLDS[level] ?? LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1] + 500;
  return { level, xpInLevel: xp - base, xpForNextLevel: next - base };
}

// ─── Badge definitions ───────────────────────────────────────────────────────
export type BadgeId =
  | 'first_checkin' | 'streak_3' | 'streak_7' | 'streak_30'
  | 'journaller' | 'deep_breather' | 'community_voice' | 'grateful_heart'
  | 'xp_100' | 'xp_500';

export interface BadgeDef {
  id: BadgeId;
  name: string;
  emoji: string;
  desc: string;
}

export const BADGE_DEFS: BadgeDef[] = [
  { id: 'first_checkin',    name: 'First Step',       emoji: '🌱', desc: 'Complete your first mood check-in' },
  { id: 'streak_3',         name: '3-Day Streak',     emoji: '🔥', desc: 'Check in 3 days in a row' },
  { id: 'streak_7',         name: 'Week Warrior',     emoji: '⚡', desc: 'Maintain a 7-day streak' },
  { id: 'streak_30',        name: 'Monthly Legend',   emoji: '🏆', desc: '30-day streak — unstoppable!' },
  { id: 'journaller',       name: 'Journaller',       emoji: '📓', desc: 'Write 3 journal entries' },
  { id: 'deep_breather',    name: 'Deep Breather',    emoji: '🫁', desc: 'Complete 3 breathing sessions' },
  { id: 'community_voice',  name: 'Community Voice',  emoji: '💬', desc: 'Post something in the community' },
  { id: 'grateful_heart',   name: 'Grateful Heart',   emoji: '🙏', desc: 'Add 3 gratitude notes' },
  { id: 'xp_100',           name: 'Rising Star',      emoji: '⭐', desc: 'Earn 100 XP' },
  { id: 'xp_500',           name: 'Wellness Pro',     emoji: '💎', desc: 'Earn 500 XP' },
];

// ─── Action counts ───────────────────────────────────────────────────────────
export interface ActionCounts {
  checkins:  number;
  journals:  number;
  breathing: number;
  posts:     number;
  gratitude: number;
}

// ─── XP award sources ────────────────────────────────────────────────────────
export const XP_VALUES = {
  moodGate:   10,
  checkin:    10,
  journal:    15,
  breathing:  20,
  community:  10,
  gratitude:  10,
  streakDay:   5,
  missionBonus: 25,
} as const;

// ─── Today helper ────────────────────────────────────────────────────────────
function todayStr(): string {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

// ─── Check which new badges were unlocked ────────────────────────────────────
function checkBadges(
  totalXp: number,
  actions: ActionCounts,
  streakCount: number,
  already: BadgeId[],
): BadgeId[] {
  const newBadges: BadgeId[] = [];
  const unlock = (id: BadgeId, cond: boolean) => {
    if (cond && !already.includes(id) && !newBadges.includes(id)) newBadges.push(id);
  };
  unlock('first_checkin',   actions.checkins  >= 1);
  unlock('streak_3',        streakCount       >= 3);
  unlock('streak_7',        streakCount       >= 7);
  unlock('streak_30',       streakCount       >= 30);
  unlock('journaller',      actions.journals  >= 3);
  unlock('deep_breather',   actions.breathing >= 3);
  unlock('community_voice', actions.posts     >= 1);
  unlock('grateful_heart',  actions.gratitude >= 3);
  unlock('xp_100',          totalXp           >= 100);
  unlock('xp_500',          totalXp           >= 500);
  return newBadges;
}

// ─── Daily mission pool ──────────────────────────────────────────────────────
export interface DailyMission {
  icon: string;
  title: string;
  xp: number;
  route: string;
  params?: Record<string, unknown>;
}

const MISSION_POOL: DailyMission[] = [
  { icon: '📓', title: 'Write one thing on your mind',          xp: 20, route: 'JournalEntry', params: { template: 'Free write', icon: '📝' } },
  { icon: '🫁', title: 'Complete a 4-min breathing reset',      xp: 20, route: 'BreathingSession', params: { session: 'Breathing Reset', duration: 240 } },
  { icon: '🙏', title: "Add one thing you're grateful for",      xp: 15, route: 'GratitudeJar' },
  { icon: '🖐️', title: 'Try the 5-4-3-2-1 grounding exercise',  xp: 20, route: 'Grounding' },
  { icon: '🎯', title: 'Check in with how you feel today',       xp: 10, route: 'CheckIn' },
  { icon: '🫧', title: 'Pop some stress away',                   xp: 10, route: 'BubblePop' },
  { icon: '💬', title: 'Share a thought in the community',       xp: 15, route: 'Community' },
];

export function getTodayMission(): DailyMission {
  const day = Math.floor(Date.now() / 86_400_000);
  return MISSION_POOL[day % MISSION_POOL.length];
}

// ─── Backend sync (Task #25) ─────────────────────────────────────────────────
// Best-effort only: local state (computed via checkBadges above) is always the source of truth
// for gameplay logic (what's "unlocked" in this session), so a failed/offline push here never
// blocks the UI - it just means that badge won't show up yet on another device until the next
// successful syncFromBackend(). 409 (already unlocked server-side) is expected and fine to ignore.
function pushUnlocksToBackend(token: string | null, ids: BadgeId[]): void {
  if (!token || token === 'guest' || ids.length === 0) return;
  for (const id of ids) {
    unlockAchievement(token, id.toUpperCase()).catch(() => {
      /* offline or already-unlocked - local state already reflects the unlock either way */
    });
  }
}

// ─── Store ───────────────────────────────────────────────────────────────────
interface GamificationState {
  totalXp: number;
  unlockedBadges: BadgeId[];
  actionCounts: ActionCounts;
  moodGateLastDate: string | null;
  missionCompletedDate: string | null;
  newlyUnlockedBadge: BadgeId | null; // set when a badge is just unlocked, read + cleared by UI

  // Daily reminder preferences (persisted)
  reminderEnabled: boolean;
  reminderHour: number;    // 0-23
  reminderMinute: number;  // 0-59

  // Computed (not persisted – derived on-the-fly)
  level: number;
  xpInLevel: number;
  xpForNextLevel: number;

  // Actions
  awardXp: (amount: number, streakCount?: number) => BadgeId[];
  recordAction: (type: keyof ActionCounts, streakCount?: number) => BadgeId[];
  clearNewBadge: () => void;
  markMoodGateShown: () => void;
  shouldShowMoodGate: () => boolean;
  completeMission: () => void;
  isMissionDoneToday: () => boolean;
  hydrate: () => void;
  setReminder: (enabled: boolean, hour: number, minute: number) => void;

  // Backend sync (Task #25) - not persisted, set once from MainRouter.tsx whenever the auth
  // token changes. See pushUnlocksToBackend() above for the write side.
  syncToken: string | null;
  setSyncToken: (token: string | null) => void;
  syncFromBackend: () => Promise<void>;
}

export const useGamificationStore = create<GamificationState>()(
  persist(
    (set, get) => ({
      totalXp: 0,
      unlockedBadges: [],
      actionCounts: { checkins: 0, journals: 0, breathing: 0, posts: 0, gratitude: 0 },
      moodGateLastDate: null,
      missionCompletedDate: null,
      newlyUnlockedBadge: null,
      reminderEnabled: false,
      reminderHour: 8,
      reminderMinute: 0,

      // Derived (re-computed every call so they're always fresh)
      get level()            { return xpToLevel(get().totalXp).level; },
      get xpInLevel()        { return xpToLevel(get().totalXp).xpInLevel; },
      get xpForNextLevel()   { return xpToLevel(get().totalXp).xpForNextLevel; },

      awardXp: (amount, streakCount = 0) => {
        const { totalXp, unlockedBadges, actionCounts, syncToken } = get();
        const newTotal = totalXp + amount;
        const newBadges = checkBadges(newTotal, actionCounts, streakCount, unlockedBadges);
        set({
          totalXp: newTotal,
          unlockedBadges: [...unlockedBadges, ...newBadges],
          newlyUnlockedBadge: newBadges[0] ?? null,
        });
        pushUnlocksToBackend(syncToken, newBadges);
        return newBadges;
      },

      recordAction: (type, streakCount = 0) => {
        const { totalXp, unlockedBadges, actionCounts, syncToken } = get();
        const newCounts = { ...actionCounts, [type]: actionCounts[type] + 1 };
        const newBadges = checkBadges(totalXp, newCounts, streakCount, unlockedBadges);
        set({
          actionCounts: newCounts,
          unlockedBadges: [...unlockedBadges, ...newBadges],
          newlyUnlockedBadge: newBadges[0] ?? null,
        });
        pushUnlocksToBackend(syncToken, newBadges);
        return newBadges;
      },

      clearNewBadge: () => set({ newlyUnlockedBadge: null }),
      markMoodGateShown: () => set({ moodGateLastDate: todayStr() }),
      shouldShowMoodGate: () => get().moodGateLastDate !== todayStr(),
      completeMission: () => set({ missionCompletedDate: todayStr() }),
      isMissionDoneToday: () => get().missionCompletedDate === todayStr(),
      hydrate: () => { /* persist handles rehydration automatically */ },
      setReminder: (enabled, hour, minute) => set({ reminderEnabled: enabled, reminderHour: hour, reminderMinute: minute }),

      syncToken: null,
      setSyncToken: (token) => {
        set({ syncToken: token });
        if (token && token !== 'guest') {
          get().syncFromBackend();
        }
      },
      // Pulls this user's earned achievements from moodmate-gamification and merges them into
      // local state (union, never removes a locally-unlocked badge) - covers the case where a
      // badge was earned on another device/reinstall and this device hasn't seen it yet.
      syncFromBackend: async () => {
        const token = get().syncToken;
        if (!token || token === 'guest') return;
        try {
          const remote = await getMyAchievements(token);
          const remoteIds = remote
            .map((a) => a.achievementKey.toLowerCase() as BadgeId)
            .filter((id) => BADGE_DEFS.some((b) => b.id === id));
          const { unlockedBadges } = get();
          const merged = Array.from(new Set([...unlockedBadges, ...remoteIds]));
          if (merged.length !== unlockedBadges.length) {
            set({ unlockedBadges: merged });
          }
        } catch {
          // Best-effort only - local badge state (from SecureStore) remains authoritative offline
        }
      },
    }),
    {
      name: 'moodmate_gamification',
      storage: createJSONStorage(() => secureStorage),
      // Only persist the data fields, not derived/action fields
      partialize: (state) => ({
        totalXp: state.totalXp,
        unlockedBadges: state.unlockedBadges,
        actionCounts: state.actionCounts,
        moodGateLastDate: state.moodGateLastDate,
        missionCompletedDate: state.missionCompletedDate,
        reminderEnabled: state.reminderEnabled,
        reminderHour: state.reminderHour,
        reminderMinute: state.reminderMinute,
      }),
    },
  ),
);
