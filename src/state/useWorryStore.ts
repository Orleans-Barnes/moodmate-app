/**
 * useWorryStore — local Worry Box state (no backend; persisted via SecureStore)
 *
 * Inspired by Quabble's Worry Box: externalise anxious thoughts by "locking"
 * them away, creating psychological distance and reducing rumination.
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

export interface Worry {
  id: string;
  text: string;
  date: string; // ISO date string
}

interface WorryState {
  worries: Worry[];
  addWorry: (text: string) => void;
  releaseWorry: (id: string) => void;
  clearAll: () => void;
}

export const useWorryStore = create<WorryState>()(
  persist(
    (set, get) => ({
      worries: [],

      addWorry: (text: string) => {
        const worry: Worry = {
          id: Date.now().toString(),
          text: text.trim(),
          date: new Date().toISOString(),
        };
        set({ worries: [worry, ...get().worries] });
      },

      releaseWorry: (id: string) => {
        set({ worries: get().worries.filter((w) => w.id !== id) });
      },

      clearAll: () => set({ worries: [] }),
    }),
    {
      name: 'moodmate-worry-box',
      storage: createJSONStorage(() => secureStorage),
    }
  )
);
