/**
 * Persists the user's chosen tab bar layout mode.
 *
 * 'standard' — all 6 tabs always visible (original behaviour)
 * 'dynamic'  — 5 tabs + slide-in Insights (Apple-style expandable)
 */

import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type TabLayoutMode = 'standard' | 'dynamic';

const KEY = 'moodmate_tab_layout';
const DEFAULT: TabLayoutMode = 'dynamic';

export function useTabLayoutStore() {
  const [mode, setModeState] = useState<TabLayoutMode>(DEFAULT);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(KEY).then(v => {
      if (v === 'standard' || v === 'dynamic') setModeState(v);
      setHydrated(true);
    });
  }, []);

  const setMode = async (m: TabLayoutMode) => {
    setModeState(m);
    await AsyncStorage.setItem(KEY, m);
  };

  return { mode, setMode, hydrated };
}
