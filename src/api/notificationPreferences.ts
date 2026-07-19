import { apiGet, apiPut } from './client';
import type { NotificationPreferenceRequest, NotificationPreferenceResponse } from './types';

// Phase 1E, Step 1 — thin wrappers over moodmate-auth's notification-preference endpoints, same
// shape as src/api/profileSetup.ts's wellness-preference wrappers. Unlike those, GET here never
// 404s (the backend creates a default row lazily), so no try/catch-404-to-null wrapper is needed.

export function getNotificationPreferences(token: string): Promise<NotificationPreferenceResponse> {
  return apiGet<NotificationPreferenceResponse>('/api/users/me/notification-preferences', token);
}

export function putNotificationPreferences(
  token: string,
  body: NotificationPreferenceRequest,
): Promise<NotificationPreferenceResponse> {
  return apiPut<NotificationPreferenceResponse>('/api/users/me/notification-preferences', body, token);
}
