import { create } from 'zustand';
import { listCheckIns } from '@/api/checkin';
import { listJournalEntries } from '@/api/journal';
import { getWellnessPreferences } from '@/api/profileSetup';
import type { CheckInResponse, JournalEntryView, WellnessPreferenceResponse } from '@/api/types';
import {
  recommendationEngine,
  type Recommendation,
  type RecommendationWellnessStateInput,
} from '@/utils/recommendationEngine';

// Phase 1D. Orchestration only, no business rules - this store's job is to fetch, cache, and hand
// off to recommendationEngine (src/utils/recommendationEngine.ts), never to decide what to
// recommend itself. Matches the existing useWellnessStore/useGamificationStore pattern (plain
// create, no persist, token passed per call) rather than a screen-scoped hook, since this data
// realistically has a lifespan beyond Home - notifications, other widgets, and future
// counsellor/peer-mentor recommendations will all want "latest mood/recommendation" without
// re-fetching it themselves.

const DEFAULT_RECOMMENDATION: Recommendation = recommendationEngine({
  goals: [],
  preferredSupport: [],
  latestMood: null,
  wellnessState: null,
});

interface DashboardState {
  latestMood: CheckInResponse | null;
  latestJournal: JournalEntryView | null;
  preferences: WellnessPreferenceResponse | null;
  recommendation: Recommendation;
  loading: boolean;
  /** Set only when every source failed - if at least one call succeeded, prior data for the
   * failed ones is preserved instead of blanking the whole dashboard (see refresh() below). */
  error: string | null;

  /** Data-isolation fix - restores every field to its zeroed default, including latestMood/
   * latestJournal/preferences which the guest-mode early-return in refresh() below never touched
   * (it only reset loading/error), letting a previous account's dashboard data silently persist
   * into a new guest session. */
  reset: () => void;

  /**
   * Single refresh entry point - fetches all three sources in parallel, updates each field only
   * from a fulfilled promise (a failed one keeps whatever was there before), then recomputes the
   * recommendation once from whatever data is now available. Safe to call repeatedly: on mount,
   * pull-to-refresh, returning from CheckIn/Journal, app foregrounding, or a future notification
   * tap - callers never need their own fetch logic.
   *
   * `wellnessState` is optional and supplied by the caller (HomeScreen already holds it via
   * useWellnessStore) rather than fetched again here - avoids a redundant GET /api/wellness/state
   * call on every dashboard refresh.
   */
  refresh: (token: string, wellnessState?: RecommendationWellnessStateInput) => Promise<void>;
}

const INITIAL_STATE = {
  latestMood: null as CheckInResponse | null,
  latestJournal: null as JournalEntryView | null,
  preferences: null as WellnessPreferenceResponse | null,
  recommendation: DEFAULT_RECOMMENDATION,
  loading: false,
  error: null as string | null,
};

let inFlightRefresh: { token: string; promise: Promise<void> } | null = null;

export const useDashboardStore = create<DashboardState>((set, get) => ({
  ...INITIAL_STATE,
  reset: () => set({ ...INITIAL_STATE }),

  refresh: (token, wellnessState) => {
    // Guest users have no JWT - bail before hitting any of these (prevents 401/403 spam), same
    // pattern as useWellnessStore.load().
    if (token === 'guest') {
      set({ ...INITIAL_STATE });
      return Promise.resolve();
    }

    if (inFlightRefresh?.token === token) {
      return inFlightRefresh.promise;
    }

    const run = (async () => {
      set({ loading: true, error: null });

      const [moodResult, journalResult, preferencesResult] = await Promise.allSettled([
        listCheckIns(token, 0, 1),
        listJournalEntries(token, 0, 1),
        getWellnessPreferences(token),
      ]);

      const prior = get();

      const latestMood =
        moodResult.status === 'fulfilled'
          ? (moodResult.value.content[0] ?? null)
          : prior.latestMood;

      const latestJournal =
        journalResult.status === 'fulfilled'
          ? (journalResult.value.content[0] ?? null)
          : prior.latestJournal;

      const preferences =
        preferencesResult.status === 'fulfilled'
          ? preferencesResult.value // null is a valid, real result (404 -> null, not-yet-saved)
          : prior.preferences;

      const allFailed =
        moodResult.status === 'rejected' &&
        journalResult.status === 'rejected' &&
        preferencesResult.status === 'rejected';

      const recommendation = recommendationEngine({
        goals: preferences?.goals ?? [],
        preferredSupport: preferences?.preferredSupport ?? [],
        latestMood: latestMood
          ? {
              emotionKey: latestMood.emotionKey,
              stressLevel: latestMood.stressLevel,
              energyLevel: latestMood.energyLevel,
              createdAt: latestMood.createdAt,
            }
          : null,
        wellnessState: wellnessState ?? null,
      });

      set({
        latestMood,
        latestJournal,
        preferences,
        recommendation,
        loading: false,
        error: allFailed ? "Couldn't load your dashboard - check your connection." : null,
      });
    })();

    inFlightRefresh = { token, promise: run };
    run.finally(() => {
      if (inFlightRefresh?.promise === run) inFlightRefresh = null;
    });
    return run;
  },
}));
