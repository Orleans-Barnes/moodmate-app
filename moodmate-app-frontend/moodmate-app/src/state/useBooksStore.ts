import { create } from 'zustand';
import { checkoutBook as checkoutBookApi, getBooks, verifyPayment } from '@/api/payments';
import type { BookView } from '@/api/types';
import type { PaymentOutcome } from './usePaymentsStore';

interface BooksState {
  books: BookView[];
  loading: boolean;
  pendingReference: string | null;
  /** Data-isolation fix - see useWellnessStore.reset's doc comment for the full rationale. Wired
   *  into useAuthStore's resetPerUserStores() alongside the other per-user stores, since "owned"
   *  is exactly the kind of per-account state that must never survive a login/logout/guest-switch. */
  reset: () => void;
  load: (token: string) => Promise<void>;
  /** Starts real Paystack checkout for a book. Returns the hosted checkout URL to open in the
   *  system browser - mirrors useWalletStore.startLeafCheckout exactly. */
  startBookCheckout: (token: string, bookCode: string) => Promise<string>;
  /** Call when the Wellness Library screen regains focus after a checkout was started. */
  verifyPending: (token: string) => Promise<PaymentOutcome>;
}

const INITIAL_STATE = {
  books: [] as BookView[],
  loading: false,
  pendingReference: null as string | null,
};

export const useBooksStore = create<BooksState>((set, get) => ({
  ...INITIAL_STATE,
  reset: () => set({ ...INITIAL_STATE }),
  load: async (token) => {
    // Guest users have no JWT — bail before hitting the real API (prevents 403), same guard every
    // other per-user store in this app uses.
    if (token === 'guest') {
      set({ ...INITIAL_STATE });
      return;
    }

    set({ loading: true });
    try {
      const books = await getBooks(token);
      set({ books });
    } finally {
      set({ loading: false });
    }
  },
  startBookCheckout: async (token, bookCode) => {
    const { authorizationUrl, reference } = await checkoutBookApi(token, bookCode);
    set({ pendingReference: reference });
    return authorizationUrl;
  },
  verifyPending: async (token) => {
    const { pendingReference } = get();
    if (!pendingReference || token === 'guest') return 'none';

    const tx = await verifyPayment(token, pendingReference);
    if (tx.status === 'SUCCESS') {
      set({ pendingReference: null });
      const books = await getBooks(token);
      set({ books });
      return 'success';
    }
    if (tx.status === 'FAILED') {
      set({ pendingReference: null });
      return 'failed';
    }
    return 'pending';
  },
}));
