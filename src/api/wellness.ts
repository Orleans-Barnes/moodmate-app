import { apiGet, apiPost } from './client';
import type { ToggleGoalResponseView, WellnessStateView } from './types';

export function getWellnessState(token: string): Promise<WellnessStateView> {
  return apiGet<WellnessStateView>('/api/wellness/state', token);
}

export function toggleGoal(token: string, key: string): Promise<ToggleGoalResponseView> {
  return apiPost<ToggleGoalResponseView>(`/api/wellness/goals/${key}/toggle`, {}, token);
}

export function buyStreakShield(token: string): Promise<WellnessStateView> {
  return apiPost<WellnessStateView>('/api/wellness/streak/shield', {}, token);
}

export function buyDoubleXpBoost(token: string): Promise<WellnessStateView> {
  return apiPost<WellnessStateView>('/api/wellness/boosts/double-xp', {}, token);
}
