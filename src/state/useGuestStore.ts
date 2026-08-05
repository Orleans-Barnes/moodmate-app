/**
 * useGuestStore — session-only (no persist) store for guest UX.
 *
 * Tracks whether the "Save progress" modal has been shown this session
 * so it only fires once (Duolingo-style: feel the value first, gate once).
 */
import { create } from 'zustand';

interface GuestState {
  isModalVisible: boolean;
  modalActivity: string;   // e.g. "Breathing session"
  modalXp: number;         // XP the guest would have earned
  hasSeenModal: boolean;   // fire at most once per session

  showProgressModal: (activity: string, xp: number) => void;
  hideProgressModal: () => void;
}

export const useGuestStore = create<GuestState>()((set, get) => ({
  isModalVisible: false,
  modalActivity: '',
  modalXp: 0,
  hasSeenModal: false,

  showProgressModal: (activity, xp) => {
    if (get().hasSeenModal) return; // only once per session
    set({ isModalVisible: true, modalActivity: activity, modalXp: xp, hasSeenModal: true });
  },

  hideProgressModal: () => set({ isModalVisible: false }),
}));
