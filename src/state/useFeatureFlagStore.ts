import { create } from 'zustand';
import { getPublicFeatureFlags } from '@/api/support';

// Admin Platform (Milestone 1) - the first real feature-flag consumer. Plain create (no persist),
// same "fetch once, read from many screens" pattern as useNotificationStore. A flag defaults to
// "on" (isEnabled returns true) when it hasn't been fetched yet or doesn't exist server-side -
// this is deliberate: a feature flag should only ever be used to turn something OFF for specific
// rollout control, never to gate a feature "closed by default", so an unfetched/unknown flag must
// never silently hide something that was always meant to be visible.

interface FeatureFlagState {
  flags: Record<string, boolean>;
  loaded: boolean;

  load: (token: string) => Promise<void>;
  isEnabled: (flagKey: string) => boolean;
}

export const useFeatureFlagStore = create<FeatureFlagState>((set, get) => ({
  flags: {},
  loaded: false,

  load: async (token) => {
    if (!token || token === 'guest') return;
    try {
      const flags = await getPublicFeatureFlags(token);
      set({ flags, loaded: true });
    } catch {
      // Silent - a failed flag fetch should never block app usage; isEnabled() already
      // fails open (defaults true) for any key not present in `flags`.
    }
  },

  isEnabled: (flagKey) => {
    const flags = get().flags;
    return flagKey in flags ? flags[flagKey] : true;
  },
}));
