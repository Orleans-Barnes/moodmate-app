/**
 * useProudStore — local Proud Dandelion state (persisted via SecureStore)
 * Inspired by Quabble's "Proud Dandelion": build confidence by celebrating wins.
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// ─── SecureStore adapter (same pattern used across all MoodMate stores) ──────
import * as SecureStore from 'expo-secure-store';
const secureStorage = {
  getItem: async (name: string): Promise<string | null> => {
    try { return await SecureStore.getItemAsync(name); } catch { return null; }
  },
  setItem: async (name: string, value: string): Promise<void> => {
    try { await SecureStore.setItemAsync(name, value); } catch {}
  },
  removeItem: async (name: string): Promise<void> => {
    try { await SecureStore.deleteItemAsync(name); } catch {}
  },
};

export interface ProudMoment {
  id: string;
  text: string;
  emoji: string;
  date: string; // ISO
}

const WIN_EMOJIS = ['🌻', '⭐', '🌟', '💪', '🎉', '🏆', '🌸', '✨', '🦋', '🌈'];

interface ProudState {
  moments: ProudMoment[];
  addMoment: (text: string) => void;
  deleteMoment: (id: string) => void;
}

export const useProudStore = create<ProudState>()(
  persist(
    (set, get) => ({
      moments: [],

      addMoment: (text: string) => {
        const emoji = WIN_EMOJIS[Math.floor(Math.random() * WIN_EMOJIS.length)];
        const moment: ProudMoment = {
          id: Date.now().toString(),
          text: text.trim(),
          emoji,
          date: new Date().toISOString(),
        };
        set({ moments: [moment, ...get().moments] });
      },

      deleteMoment: (id: string) => {
        set({ moments: get().moments.filter((m) => m.id !== id) });
      },
    }),
    {
      name: 'moodmate-proud-dandelion',
      storage: createJSONStorage(() => secureStorage),
    }
  )
);
