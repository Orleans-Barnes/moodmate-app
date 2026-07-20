import { create } from 'zustand';
import { equipSkin, getWalletState } from '@/api/wallet';
import { checkoutLeafPack as checkoutLeafPackApi, getLeafPacks, verifyPayment } from '@/api/payments';
import type { LeafPackView, SkinView } from '@/api/types';
import type { PaymentOutcome } from './usePaymentsStore';

interface WalletState {
  leafBalance: number;
  skins: SkinView[];
  leafPacks: LeafPackView[];
  loading: boolean;
  pendingReference: string | null;
  load: (token: string) => Promise<void>;
  /** Returns true if the skin was already owned (no leaves spent). Throws ApiRequestError on insufficient balance. */
  equip: (token: string, code: string) => Promise<boolean>;
  /** Starts real Paystack checkout for a leaf pack (Task #26). Returns the hosted checkout URL. */
  startLeafCheckout: (token: string, packCode: string) => Promise<string>;
  /** Call when the Shop screen regains focus after a checkout was started - verifies and refreshes leafBalance on success. */
  verifyPending: (token: string) => Promise<PaymentOutcome>;
}

/**
 * Backed by the real Wallet + Payments APIs (com.moodmate.wallet). Leaf packs are fetched from
 * the backend's live catalog rather than hardcoded, so pricing always matches what checkout will
 * actually charge.
 */
export const useWalletStore = create<WalletState>((set, get) => ({
  leafBalance: 0,
  skins: [],
  leafPacks: [],
  loading: false,
  pendingReference: null,
  load: async (token) => {
    // Guest users have no JWT — bail before hitting the real API (prevents 403). Checked before
    // setting loading:true so a guest doesn't get stuck on a loading state forever.
    if (token === 'guest') return;

    set({ loading: true });
    try {
      const [wallet, leafPacks] = await Promise.all([
        getWalletState(token),
        getLeafPacks(token),
      ]);
      set({ leafBalance: wallet.leafBalance, skins: wallet.skins, leafPacks });
    } finally {
      set({ loading: false });
    }
  },
  equip: async (token, code) => {
    const result = await equipSkin(token, code);
    set({ leafBalance: result.wallet.leafBalance, skins: result.wallet.skins });
    return result.alreadyOwned;
  },
  startLeafCheckout: async (token, packCode) => {
    const { authorizationUrl, reference } = await checkoutLeafPackApi(token, packCode);
    set({ pendingReference: reference });
    return authorizationUrl;
  },
  verifyPending: async (token) => {
    const { pendingReference } = get();
    if (!pendingReference || token === 'guest') return 'none';

    const tx = await verifyPayment(token, pendingReference);
    if (tx.status === 'SUCCESS') {
      set({ pendingReference: null });
      const wallet = await getWalletState(token);
      set({ leafBalance: wallet.leafBalance, skins: wallet.skins });
      return 'success';
    }
    if (tx.status === 'FAILED') {
      set({ pendingReference: null });
      return 'failed';
    }
    return 'pending';
  },
}));
