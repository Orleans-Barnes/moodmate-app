import { apiGet, apiPost } from './client';
import type { SubscriptionPlanView, SubscriptionStateView } from './types';

export function getPlans(token: string): Promise<SubscriptionPlanView[]> {
  return apiGet<SubscriptionPlanView[]>('/api/payments/plans', token);
}

export function getSubscriptionState(token: string): Promise<SubscriptionStateView> {
  return apiGet<SubscriptionStateView>('/api/payments/subscription', token);
}

// Free trial only - no Paystack call involved. Real checkout (paid subscribe / leaf packs)
// needs a browser-redirect + deep-link flow and a Paystack key, deferred until that's ready.
export function startTrial(token: string, planCode: string): Promise<SubscriptionStateView> {
  return apiPost<SubscriptionStateView>('/api/payments/subscription/trial', { planCode }, token);
}
