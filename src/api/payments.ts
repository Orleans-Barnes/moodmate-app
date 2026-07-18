import { apiGet, apiPost } from './client';
import type {
  CheckoutResponseView,
  LeafPackView,
  PaymentTransactionView,
  SubscriptionPlanView,
  SubscriptionStateView,
} from './types';

export function getPlans(token: string): Promise<SubscriptionPlanView[]> {
  return apiGet<SubscriptionPlanView[]>('/api/payments/plans', token);
}

export function getLeafPacks(token: string): Promise<LeafPackView[]> {
  return apiGet<LeafPackView[]>('/api/payments/leaf-packs', token);
}

export function getSubscriptionState(token: string): Promise<SubscriptionStateView> {
  return apiGet<SubscriptionStateView>('/api/payments/subscription', token);
}

// Free trial only - no Paystack call involved.
export function startTrial(token: string, planCode: string): Promise<SubscriptionStateView> {
  return apiPost<SubscriptionStateView>('/api/payments/subscription/trial', { planCode }, token);
}

// Real paid checkout (Task #26) - both return a hosted Paystack page URL + a reference to verify
// once the user returns to the app. See usePaymentsStore.ts / useWalletStore.ts for the
// open-browser-then-verify-on-focus flow built around these.
export function checkoutSubscription(token: string, planCode: string): Promise<CheckoutResponseView> {
  return apiPost<CheckoutResponseView>('/api/payments/subscription/checkout', { planCode }, token);
}

export function checkoutLeafPack(token: string, packCode: string): Promise<CheckoutResponseView> {
  return apiPost<CheckoutResponseView>('/api/payments/leaf-packs/checkout', { packCode }, token);
}

export function verifyPayment(token: string, reference: string): Promise<PaymentTransactionView> {
  return apiGet<PaymentTransactionView>(`/api/payments/verify/${reference}`, token);
}
