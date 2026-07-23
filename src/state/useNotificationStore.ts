import { create } from 'zustand';
import {
  listNotifications,
  getUnreadNotificationCount,
  markNotificationRead,
  markAllNotificationsRead,
} from '@/api/notifications';
import type { NotificationView } from '@/api/types';

// Phase 1E, Step 3 - in-app notification center. Plain create (no persist), token passed per call,
// same pattern as useDashboardStore/useGamificationStore - this data has a lifespan beyond one
// screen (Home's bell badge + NotificationCenterScreen's list both read unreadCount/notifications
// from here, so a single fetch serves both rather than each screen fetching independently).

interface NotificationState {
  notifications: NotificationView[];
  unreadCount: number;
  loading: boolean;
  error: string | null;

  /** Fetches the first page of notifications + the unread count together - the two calls are
   * independent (Promise.allSettled, same failure-tolerance pattern as useDashboardStore.refresh())
   * so a failure on one doesn't blank out the other. */
  load: (token: string) => Promise<void>;

  /** Lightweight refresh of just the unread badge count, for polling on Home without re-fetching
   * the full list (e.g. on focus, or after returning from another screen). */
  refreshUnreadCount: (token: string) => Promise<void>;

  /** Optimistically marks one notification read locally, then confirms with the backend; reverts
   * the specific row (not the whole list) on failure - same optimistic-update-with-revert pattern
   * as NotificationPreferencesScreen's saveToggle(). */
  markRead: (token: string, id: number) => Promise<void>;

  /** Optimistically marks every notification read locally, then confirms with the backend;
   * reverts the whole list on failure since there's no single row to isolate. */
  markAllRead: (token: string) => Promise<void>;

  /** Data-isolation fix - see useWellnessStore.reset's doc comment for the full rationale. */
  reset: () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,
  error: null,
  reset: () => set({ notifications: [], unreadCount: 0, loading: false, error: null }),

  load: async (token) => {
    // Guest users have no JWT - bail before hitting either endpoint, same pattern as
    // useDashboardStore.refresh() and useWellnessStore.load().
    if (!token || token === 'guest') {
      set({ loading: false, error: null });
      return;
    }

    set({ loading: true, error: null });

    const [listResult, countResult] = await Promise.allSettled([
      listNotifications(token),
      getUnreadNotificationCount(token),
    ]);

    const prior = get();

    const notifications =
      listResult.status === 'fulfilled' ? listResult.value.content : prior.notifications;

    const unreadCount =
      countResult.status === 'fulfilled' ? countResult.value.unreadCount : prior.unreadCount;

    const allFailed = listResult.status === 'rejected' && countResult.status === 'rejected';

    set({
      notifications,
      unreadCount,
      loading: false,
      error: allFailed ? "Couldn't load your notifications - check your connection." : null,
    });
  },

  refreshUnreadCount: async (token) => {
    if (!token || token === 'guest') return;
    try {
      const { unreadCount } = await getUnreadNotificationCount(token);
      set({ unreadCount });
    } catch {
      // Silent - this is a background badge refresh, not a user-initiated action; a stale badge
      // count is preferable to surfacing a toast for a call the user never asked for.
    }
  },

  markRead: async (token, id) => {
    const prior = get().notifications;
    const target = prior.find((n) => n.id === id);
    if (!target || target.readAt) return; // already read, or unknown id - nothing to do

    set({
      notifications: prior.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString(), status: 'READ' } : n)),
      unreadCount: Math.max(0, get().unreadCount - 1),
    });

    try {
      const updated = await markNotificationRead(token, id);
      set({ notifications: get().notifications.map((n) => (n.id === id ? updated : n)) });
    } catch {
      // Revert just this row + the count decrement, leaving every other optimistic change intact.
      set({
        notifications: get().notifications.map((n) => (n.id === id ? target : n)),
        unreadCount: get().unreadCount + 1,
      });
    }
  },

  markAllRead: async (token) => {
    const prior = get().notifications;
    const priorUnread = get().unreadCount;
    if (priorUnread === 0) return;

    const now = new Date().toISOString();
    set({
      notifications: prior.map((n) => (n.readAt ? n : { ...n, readAt: now, status: 'READ' })),
      unreadCount: 0,
    });

    try {
      await markAllNotificationsRead(token);
    } catch {
      set({ notifications: prior, unreadCount: priorUnread });
    }
  },
}));
