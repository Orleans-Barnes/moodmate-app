import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import type { UserProfile } from '@/api/types';
import { BACKEND_BASE_URL } from '@/config';

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
    set({ token, refreshToken, user });
    await Promise.all([
      SecureStore.setItemAsync(TOKEN_KEY, token),
      SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken),
      SecureStore.setItemAsync(PROFILE_KEY, JSON.stringify(user)),
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
    // Synthetic guest profile — never persisted to SecureStore
    set({
      token: 'guest',
      refreshToken: null,
      user: {
        id: -1,
        email: 'guest@local',
        fullName: 'Guest',
        institution: null,
        avatarEmoji: '👤',
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
        set({ token, refreshToken, user: JSON.parse(profileJson) as UserProfile });
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
    set({ token: null, refreshToken: null, user: null });
    await Promise.all([
      SecureStore.deleteItemAsync(TOKEN_KEY),
      SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
      SecureStore.deleteItemAsync(PROFILE_KEY),
    ]);
  },
}));
