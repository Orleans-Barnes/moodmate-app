import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance } from 'react-native';

export type AppearanceMode = 'system' | 'light' | 'dark';

interface AppearanceState {
  mode: AppearanceMode;
  setMode: (mode: AppearanceMode) => void;
}

export function applyNativeAppearanceMode(mode: AppearanceMode) {
  const setColorScheme = (Appearance as unknown as {
    setColorScheme?: (scheme: 'light' | 'dark' | null) => void;
  }).setColorScheme;
  setColorScheme?.(mode === 'system' ? null : mode);
}

export const useAppearanceStore = create<AppearanceState>()(
  persist(
    (set) => ({
      mode: 'system',
      setMode: (mode) => {
        applyNativeAppearanceMode(mode);
        set({ mode });
      },
    }),
    {
      name: 'moodmate_appearance',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        applyNativeAppearanceMode(state?.mode ?? 'system');
      },
    },
  ),
);
