import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import type { UserProfile } from '@/api/types';
import { BACKEND_BASE_URL } from '@/config';
import { configureAuthSession } from '@/api/authSession';
import { useWellnessStore } from './useWellnessStore';
import { useDashboardStore } from './useDashboardStore';
import { useWalletStore } from './useWalletStore';
import { useJournalStore } from './useJournalStore';
import { useNotificationStore } from './useNotificationStore';
import { useBooksStore } from './useBooksStore';
import { switchGamificationScope } from './useGamificationStore';

// Data-isolation fix (student-view polish pass) - every per-user data store used to keep whatever
// was in memory across a login/logout/guest-switch cycle, since nothing ever reset them. That let
// one account's streak/XP/journal/wallet numbers visibly "leak" into the next session on the same
// device (Guest showing a prior real user's data; one real account briefly showing another's data
// before its own load() finished). This is the single place all of that gets cleared, called from
// every place the active account changes below - never call these stores' individual reset()
// (or switchGamificationScope()) ad hoc elsewhere, so there's exactly one code path to keep
// correct as new per-user stores are added.
function resetPerUserStores() {
  useWellnessStore.getState().reset();
  useDashboardStore.getState().reset();
  useWalletStore.getState().reset();
  useJournalStore.getState().reset();
  useNotificationStore.getState().reset();
  useBooksStore.getState().reset();
}

const TOKEN_KEY = 'moodmate_token';
const REFRESH_TOKEN_KEY = 'moodmate_refresh_token';
const PROFILE_KEY = 'moodmate_profile';

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  user: UserProfile | null;
  hydrated: boolean;

  setSession: (token: string, refreshToken: string, user: UserProfile) => Promise<void>;
  /** Update the in-memory + persisted user profile after an edit. */
  setUser: (user: UserProfile) => Promise<void>;
  /** Phase 1A - called by api/client.ts after a successful silent refresh. Updates only the
   * token pair (access + rotated refresh token), never touches the user profile. */
  setTokens: (token: string, refreshToken: string) => Promise<void>;
  /** Sign in without an account — session only, not persisted. */
  loginAsGuest: () => void;
  hydrate: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  refreshToken: null,
  user: null,
  hydrated: false,

  setSession: async (token, refreshToken, user) => {
    // Data-isolation fix - clear whatever the previous session (another account, or guest) left
    // in memory before this new session's own screens start loading and rendering it.
    resetPerUserStores();
    set({ token, refreshToken, user });
    await Promise.all([
      SecureStore.setItemAsync(TOKEN_KEY, token),
      SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken),
      SecureStore.setItemAsync(PROFILE_KEY, JSON.stringify(user)),
      switchGamificationScope(String(user.id)),
    ]);
  },

  setUser: async (user) => {
    set({ user });
    await SecureStore.setItemAsync(PROFILE_KEY, JSON.stringify(user));
  },

  setTokens: async (token, refreshToken) => {
    set({ token, refreshToken });
    await Promise.all([
      SecureStore.setItemAsync(TOKEN_KEY, token),
      SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken),
    ]);
  },

  loginAsGuest: () => {
    // Data-isolation fix - clear any previous real account's data first, and switch the
    // gamification store to the shared 'guest' scope (not awaited - loginAsGuest's callers treat
    // it as synchronous; the rehydrate finishes a moment later, well before Home ever renders).
    resetPerUserStores();
    switchGamificationScope('guest').catch(() => {});
    // Synthetic guest profile — never persisted to SecureStore
    set({
      token: 'guest',
      refreshToken: null,
      user: {
        id: -1,
        email: 'guest@local',
        fullName: 'Guest',
        institution: null,
        institutionId: null,
        avatarEmoji: 'person-outline',
        avatarUrl: null,
        guest: true,
        role: 'STUDENT',
      },
    });
  },

  hydrate: async () => {
    try {
      const [token, refreshToken, profileJson] = await Promise.all([
        SecureStore.getItemAsync(TOKEN_KEY),
        SecureStore.getItemAsync(REFRESH_TOKEN_KEY),
        SecureStore.getItemAsync(PROFILE_KEY),
      ]);
      if (token && profileJson) {
        const user = JSON.parse(profileJson) as UserProfile;
        set({ token, refreshToken, user });
        // Data-isolation fix - the gamification store's persist middleware already hydrated once
        // under the default 'guest' scope at module-load time (before we knew who's actually
        // signed in, since that hydration runs synchronously at import). Re-scope + rehydrate now
        // that the real user id is known, so a cold app start restores THIS account's XP/badges,
        // not whatever scope happened to be active last.
        switchGamificationScope(String(user.id)).catch(() => {});
      }
    } finally {
      set({ hydrated: true });
    }
  },

  // Phase 1A - previously only cleared local state, leaving the refresh token valid server-side
  // indefinitely (a stolen refresh token would keep working after the user logged out). Now
  // revokes it via POST /api/auth/logout first. Uses a raw fetch (not api/client.ts's apiPost)
  // deliberately, to avoid a circular import — client.ts itself reads this store for silent
  // refresh, so this store must not depend back on client.ts. Best-effort: local logout always
  // proceeds even if the network call fails, so a bad connection can never trap a user
  // mid-logout inside the app.
  logout: async () => {
    const { refreshToken } = get();
    if (refreshToken) {
      try {
        await fetch(`${BACKEND_BASE_URL}/api/auth/logout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });
      } catch {
        // Network unavailable or server error — proceed with local logout regardless.
      }
    }
    // Data-isolation fix - clear every per-user store so the next session (another account, or
    // guest) never briefly shows this account's streak/XP/journal/wallet data.
    resetPerUserStores();
    set({ token: null, refreshToken: null, user: null });
    await Promise.all([
      SecureStore.deleteItemAsync(TOKEN_KEY),
      SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
      SecureStore.deleteItemAsync(PROFILE_KEY),
      switchGamificationScope('guest'),
    ]);
  },
}));

configureAuthSession({
  getRefreshToken: () => useAuthStore.getState().refreshToken,
  setTokens: (token, refreshToken) => useAuthStore.getState().setTokens(token, refreshToken),
  logout: () => useAuthStore.getState().logout(),
});
