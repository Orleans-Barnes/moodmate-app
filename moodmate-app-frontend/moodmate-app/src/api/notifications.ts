import { apiGet, apiPatch } from './client';
import type { NotificationView, PageResponse } from './types';

// Phase 1E, Step 3 - thin wrappers over moodmate-notifications' public endpoints (gateway-routed
// at /api/notifications, port 8102 - see moodmate-notifications/README.md). Same "one file per
// backend resource" convention as notificationPreferences.ts, checkin.ts, journal.ts, etc.

export function listNotifications(
  token: string,
  page = 0,
  size = 20,
): Promise<PageResponse<NotificationView>> {
  return apiGet<PageResponse<NotificationView>>(
    `/api/notifications?page=${page}&size=${size}`,
    token,
  );
}

export function getUnreadNotificationCount(token: string): Promise<{ unreadCount: number }> {
  return apiGet<{ unreadCount: number }>('/api/notifications/unread-count', token);
}

export function markNotificationRead(token: string, id: number): Promise<NotificationView> {
  return apiPatch<NotificationView>(`/api/notifications/${id}/read`, undefined, token);
}

export function markAllNotificationsRead(token: string): Promise<void> {
  return apiPatch<void>('/api/notifications/read-all', undefined, token);
}
