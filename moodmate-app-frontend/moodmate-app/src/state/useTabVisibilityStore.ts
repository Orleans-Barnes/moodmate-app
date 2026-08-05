import { create } from 'zustand';

interface TabVisibilityState {
  visible: boolean;
  showTabBar: () => void;
  hideTabBar: () => void;
}

export const useTabVisibilityStore = create<TabVisibilityState>((set, get) => ({
  visible: true,
  showTabBar: () => {
    if (!get().visible) set({ visible: true });
  },
  hideTabBar: () => {
    if (get().visible) set({ visible: false });
  },
}));
