import { create } from 'zustand';
import {
  checkoutSubscription as checkoutSubscriptionApi,
  getPlans,
  getSubscriptionState,
  startTrial as startTrialApi,
  verifyPayment,
} from '@/api/payments';
import type { SubscriptionPlanView, SubscriptionStateView } from '@/api/types';

export type PaymentOutcome = 'success' | 'failed' | 'pending' | 'none';

interface PaymentsState {
  plans: SubscriptionPlanView[];
  subscription: SubscriptionStateView;
  loading: boolean;
  /** Reference of a checkout that was started but not yet confirmed - survives screen navigation
   *  (but not app restart) so returning from the Paystack browser page can be verified. */
  pendingReference: string | null;
  load: (token: string) => Promise<void>;
  startTrial: (token: string, planCode: string) => Promise<SubscriptionStateView>;
  /** Starts real Paystack checkout for a paid plan. Returns the hosted checkout URL to open in
   *  the system browser - the store just tracks the reference, it doesn't open anything itself. */
  startCheckout: (token: string, planCode: string) => Promise<string>;
  /** Call when the screen regains focus after a checkout was started. Verifies the pending
   *  reference (matches the backend's own documented "verify right after returning" flow) and
   *  refreshes subscription state on success. No-ops if nothing is pending. */
  verifyPending: (token: string) => Promise<PaymentOutcome>;
}

const NO_SUBSCRIPTION: SubscriptionStateView = {
  planCode: null,
  status: null,
  trialEndsAt: null,
  currentPeriodEnd: null,
  pro: false,
  graceEndsAt: null,
};

/**
 * Backed by the real Payments API (com.moodmate.wallet.controller.PaymentsController). Trial and
 * real paid checkout (Task #26) both live here - checkout opens Paystack's hosted page in the
 * system browser via Linking (see ProScreen.tsx), then verifyPending() confirms it on return.
 */
export const usePaymentsStore = create<PaymentsState>((set, get) => ({
  plans: [],
  subscription: NO_SUBSCRIPTION,
  loading: false,
  pendingReference: null,
  load: async (token) => {
    // Guest users have no JWT — bail before hitting the real API (prevents 403). Checked before
    // setting loading:true so a guest doesn't get stuck on a loading state forever.
    if (token === 'guest') return;

    set({ loading: true });
    try {
      const [plans, subscription] = await Promise.all([
        getPlans(token),
        getSubscriptionState(token),
      ]);
      set({ plans, subscription });
    } finally {
      set({ loading: false });
    }
  },
  startTrial: async (token, planCode) => {
    const subscription = await startTrialApi(token, planCode);
    set({ subscription });
    return subscription;
  },
  startCheckout: async (token, planCode) => {
    const { authorizationUrl, reference } = await checkoutSubscriptionApi(token, planCode);
    set({ pendingReference: reference });
    return authorizationUrl;
  },
  verifyPending: async (token) => {
    const { pendingReference } = get();
    if (!pendingReference || token === 'guest') return 'none';

    const tx = await verifyPayment(token, pendingReference);
    if (tx.status === 'SUCCESS') {
      set({ pendingReference: null });
      const subscription = await getSubscriptionState(token);
      set({ subscription });
      return 'success';
    }
    if (tx.status === 'FAILED') {
      set({ pendingReference: null });
      return 'failed';
    }
    return 'pending'; // still PENDING - webhook/verify hasn't resolved it yet, leave reference set
  },
}));
