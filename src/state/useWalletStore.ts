import { create } from 'zustand';
import { equipSkin, getWalletState } from '@/api/wallet';
import type { SkinView } from '@/api/types';

interface WalletState {
  leafBalance: number;
  skins: SkinView[];
  loading: boolean;
  load: (token: string) => Promise<void>;
  /** Returns true if the skin was already owned (no leaves spent). Throws ApiRequestError on insufficient balance. */
  equip: (token: string, code: string) => Promise<boolean>;
}

/**
 * Backed by the real Wallet API (com.moodmate.backend.wallet) - Phase 3/Task #7. Replaces the
 * leafBalance/treeSkin slice of the old local-only useAppState mock for the Shop screen.
 */
export const useWalletStore = create<WalletState>((set) => ({
  leafBalance: 0,
  skins: [],
  loading: false,
  load: async (token) => {
    set({ loading: true });
    // Guest users have no JWT — bail before hitting the real API (prevents 403)
    if (token === 'guest') return;

    try {
      const wallet = await getWalletState(token);
      set({ leafBalance: wallet.leafBalance, skins: wallet.skins });
    } finally {
      set({ loading: false });
    }
  },
  equip: async (token, code) => {
    const result = await equipSkin(token, code);
    set({ leafBalance: result.wallet.leafBalance, skins: result.wallet.skins });
    return result.alreadyOwned;
  },
}));
