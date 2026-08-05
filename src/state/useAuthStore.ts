import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import type { UserProfile } from '@/api/types';

const TOKEN_KEY = 'moodmate_token';
const PROFILE_KEY = 'moodmate_profile';

interface AuthState {
  token: string | null;
  user: UserProfile | null;
  hydrated: boolean;

  setSession: (token: string, user: UserProfile) => Promise<void>;
  /** Update the in-memory + persisted user profile after an edit. */
  setUser: (user: UserProfile) => Promise<void>;
  /** Sign in without an account — session only, not persisted. */
  loginAsGuest: () => void;
  hydrate: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  hydrated: false,

  setSession: async (token, user) => {
    set({ token, user });
    await SecureStore.setItemAsync(TOKEN_KEY, token);
    await SecureStore.setItemAsync(PROFILE_KEY, JSON.stringify(user));
  },

  setUser: async (user) => {
    set({ user });
    await SecureStore.setItemAsync(PROFILE_KEY, JSON.stringify(user));
  },

  loginAsGuest: () => {
    // Synthetic guest profile — never persisted to SecureStore
    set({
      token: 'guest',
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
      const [token, profileJson] = await Promise.all([
        SecureStore.getItemAsync(TOKEN_KEY),
        SecureStore.getItemAsync(PROFILE_KEY),
      ]);
      if (token && profileJson) {
        set({ token, user: JSON.parse(profileJson) as UserProfile });
      }
    } finally {
      set({ hydrated: true });
    }
  },

  logout: async () => {
    set({ token: null, user: null });
    await Promise.all([SecureStore.deleteItemAsync(TOKEN_KEY), SecureStore.deleteItemAsync(PROFILE_KEY)]);
  },
}));
