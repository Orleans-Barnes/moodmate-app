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
    // Bug fix - this read had no .catch(). DynamicTabBar now waits for `hydrated` before
    // rendering the real tab bar (to avoid a standard/dynamic flip on cold start - see its own
    // comment), which means if this promise ever rejects (storage not ready yet, permission
    // hiccup, anything) `hydrated` was stuck false forever and the ENTIRE bottom nav bar silently
    // vanished for the rest of the session. Falls back to the default mode on failure instead of
    // hanging - a wrong-but-visible tab bar beats no tab bar at all.
    AsyncStorage.getItem(KEY)
      .then(v => {
        if (v === 'standard' || v === 'dynamic') setModeState(v);
      })
      .catch(() => {})
      .finally(() => setHydrated(true));
  }, []);

  const setMode = async (m: TabLayoutMode) => {
    setModeState(m);
    await AsyncStorage.setItem(KEY, m);
  };

  return { mode, setMode, hydrated };
}
