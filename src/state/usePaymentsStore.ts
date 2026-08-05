import { create } from 'zustand';
import { getPlans, getSubscriptionState, startTrial as startTrialApi } from '@/api/payments';
import type { SubscriptionPlanView, SubscriptionStateView } from '@/api/types';

interface PaymentsState {
  plans: SubscriptionPlanView[];
  subscription: SubscriptionStateView;
  loading: boolean;
  load: (token: string) => Promise<void>;
  startTrial: (token: string, planCode: string) => Promise<SubscriptionStateView>;
}

const NO_SUBSCRIPTION: SubscriptionStateView = {
  planCode: null,
  status: null,
  trialEndsAt: null,
  currentPeriodEnd: null,
  pro: false,
};

/**
 * Backed by the real Payments API (com.moodmate.backend.payments) - Task #61. Trial-only scope
 * for now: real plans + real free trial + real Pro status. Paid checkout (subscribe / leaf packs)
 * needs a browser-redirect + deep-link flow and a Paystack key, so it stays out of this store
 * until that's built.
 */
export const usePaymentsStore = create<PaymentsState>((set) => ({
  plans: [],
  subscription: NO_SUBSCRIPTION,
  loading: false,
  load: async (token) => {
    set({ loading: true });
    // Guest users have no JWT — bail before hitting the real API (prevents 403)
    if (token === 'guest') return;

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
}));
