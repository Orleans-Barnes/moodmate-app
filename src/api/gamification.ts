import { apiGet, apiPost } from './client';
import type { UserAchievementView } from './types';

// Mirrors com.moodmate.gamification.entity.UserAchievement / dto.AchievementUnlockRequest.
// achievementKey is always the frontend's BadgeId uppercased (e.g. 'streak_7' -> 'STREAK_7') -
// see useGamificationStore.ts's BADGE_DEFS and the V3 migration that aligned the backend's
// achievement catalog to match these ids exactly.

export function getMyAchievements(token: string): Promise<UserAchievementView[]> {
  return apiGet<UserAchievementView[]>('/api/gamification/achievements/mine', token);
}

export function unlockAchievement(token: string, achievementKey: string): Promise<UserAchievementView> {
  return apiPost<UserAchievementView>('/api/gamification/achievements/unlock', { achievementKey }, token);
}
