/**
 * NotificationCenterScreen — Phase 1E, Step 3.
 *
 * The inbox that must work standalone before Expo Push exists at all (Step 5) - nothing is lost
 * if push fails, since every notification is also recorded here via moodmate-notifications'
 * backend (Step 2). Tapping a row marks it read and, if the notification carries a
 * destinationScreen, deep-links there - same "navigate then fall back to a safe screen on error"
 * pattern as HomeScreen's handleRecommendationAction.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, View, Text, Pressable, StyleSheet, ActivityIndicator, RefreshControl, FlatList } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useAuthStore } from '@/state/useAuthStore';
import { useNotificationStore } from '@/state/useNotificationStore';
import type { NotificationView, NotificationTypeKey } from '@/api/types';
import { getMyProfile } from '@/api/auth';
import { colors, fonts, fontSizes, radii, spacing, shadow } from '@/theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'NotificationCenter'>;

// Screens that live inside MainTabParamList (nested under the root's 'Main' screen), not directly
// on RootStackParamList - see handleTap's doc comment above for why this distinction matters.
const MAIN_TAB_SCREENS = new Set(['Home', 'Journal', 'Explore', 'Community', 'Insights', 'Support']);

const TYPE_ICON: Record<NotificationTypeKey, keyof typeof Ionicons.glyphMap> = {
  MOOD_REMINDER: 'happy-outline',
  JOURNAL_REMINDER: 'book-outline',
  HABIT_REMINDER: 'checkmark-circle-outline',
  SLEEP_REMINDER: 'moon-outline',
  APPOINTMENT_BOOKED: 'calendar-outline',
  APPOINTMENT_CONFIRMED: 'calendar-outline',
  APPOINTMENT_CANCELLED: 'calendar-outline',
  APPOINTMENT_COMPLETED: 'calendar-outline',
  APPOINTMENT_REMINDER: 'time-outline',
  MENTOR_REQUEST: 'people-outline',
  MENTOR_ACCEPTED: 'people-outline',
  MENTOR_DECLINED: 'people-outline',
  COUNSELLOR_APPROVED: 'checkmark-done-outline',
  COUNSELLOR_REJECTED: 'close-circle-outline',
  COUNSELLOR_SUSPENDED: 'pause-circle-outline',
  COUNSELLOR_REINSTATED: 'checkmark-done-outline',
  MENTOR_APPROVED: 'checkmark-done-outline',
  MENTOR_REJECTED: 'close-circle-outline',
  MENTOR_DEACTIVATED: 'pause-circle-outline',
  MENTOR_REACTIVATED: 'checkmark-done-outline',
  CRISIS_ALERT: 'alert-circle-outline',
  ARTICLE_PUBLISHED: 'newspaper-outline',
  EVENT_REMINDER: 'megaphone-outline',
  ACHIEVEMENT_UNLOCKED: 'trophy-outline',
  MISSION_COMPLETED: 'flag-outline',
  ADMIN_ANNOUNCEMENT: 'megaphone-outline',
  SYSTEM: 'information-circle-outline',
};

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function NotificationRow({
  item,
  index,
  onPress,
}: {
  item: NotificationView;
  index: number;
  onPress: () => void;
}) {
  const unread = !item.readAt;

  // Notification-flow fix - the list previously appeared all at once with no motion, so a
  // populated inbox and a "stuck" screen looked identical for a beat. A short, staggered
  // fade+rise per row (capped so a long inbox doesn't feel sluggish) makes it obvious the screen
  // is alive and actually rendering fetched data.
  const enter = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(enter, {
      toValue: 1,
      duration: 260,
      delay: Math.min(index, 8) * 35,
      useNativeDriver: true,
    }).start();
  }, [enter, index]);

  return (
    <Animated.View
      style={{
        opacity: enter,
        transform: [{ translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }],
      }}
    >
      <Pressable style={[s.row, unread && s.rowUnread]} onPress={onPress}>
        <View style={[s.rowIcon, unread && s.rowIconUnread]}>
          <Ionicons name={TYPE_ICON[item.type] ?? 'notifications-outline'} size={18} color={unread ? '#FFFFFF' : colors.coral} />
        </View>
        <View style={s.rowText}>
          <Text style={s.rowTitle} numberOfLines={1}>{item.title}</Text>
          <Text style={s.rowBody} numberOfLines={2}>{item.body}</Text>
          <Text style={s.rowTime}>{timeAgo(item.createdAt)}</Text>
        </View>
        {unread && <View style={s.unreadDot} />}
      </Pressable>
    </Animated.View>
  );
}

export function NotificationCenterScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const token = useAuthStore((s) => s.token) ?? '';

  const notifications = useNotificationStore((s) => s.notifications);
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const loading = useNotificationStore((s) => s.loading);
  const error = useNotificationStore((s) => s.error);
  const load = useNotificationStore((s) => s.load);
  const markRead = useNotificationStore((s) => s.markRead);
  const markAllRead = useNotificationStore((s) => s.markAllRead);
  const currentUser = useAuthStore((s) => s.user);

  const [refreshing, setRefreshing] = useState(false);

  // Notification-flow fix - the screen's body used to fade in identically whether it ended up
  // showing real notifications, an empty inbox, or a silent failure, so a load failure (bad
  // connection, backend hiccup) looked exactly like "you have no notifications" - the screen
  // "showing nothing" the user reported. Fading the whole body in on mount also makes opening the
  // screen itself feel intentional rather than an instant, jarring swap.
  const bodyFade = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(bodyFade, { toValue: 1, duration: 220, useNativeDriver: true }).start();
  }, [bodyFade]);

  const refreshProfileIfNeeded = useCallback(async () => {
    if (!token || token === 'guest' || currentUser?.role !== 'STUDENT') return;
    try {
      const freshUser = await getMyProfile(token);
      if (freshUser.role !== currentUser.role) {
        await useAuthStore.getState().setUser(freshUser);
      }
    } catch {
      // Ignore refresh failures here; the notification list still loads.
    }
  }, [token, currentUser?.role]);

  useFocusEffect(useCallback(() => {
    load(token);
    refreshProfileIfNeeded();
  }, [load, refreshProfileIfNeeded]));

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load(token);
    setRefreshing(false);
  }, [load, token]);

  const handleTap = (item: NotificationView) => {
    if (!item.readAt) markRead(token, item.id);
    if (!item.destinationScreen) return;

    const params = item.destinationParams ? JSON.parse(item.destinationParams) : undefined;
    try {
      if (MAIN_TAB_SCREENS.has(item.destinationScreen)) {
        // destinationScreen is a bottom-tab screen (e.g. "Journal", "Support") - it only exists
        // nested inside MainTabParamList, not directly on the root stack. Navigating to it
        // directly from here (a modal on the root stack) fails silently the same way SOSScreen's
        // "Talk to a counsellor" link once did - see that fix's history for the exact symptom.
        (navigation as any).navigate('Main', { screen: item.destinationScreen, params });
      } else {
        (navigation as any).navigate(item.destinationScreen, params);
      }
    } catch { /* destinationScreen unrecognized or destinationParams malformed - stay put */ }
  };

  return (
    <View style={s.root}>
      <View style={s.headerWrap}>
        <ScreenHeader
          title="Notifications"
          onClose={() => navigation.goBack()}
          compact
          rightSlot={
            <Pressable
              style={s.markAllBtn}
              onPress={() => markAllRead(token)}
              disabled={unreadCount === 0}
              hitSlop={10}
            >
              <Text style={[s.markAllText, unreadCount === 0 && s.markAllTextDisabled]}>Mark all read</Text>
            </Pressable>
          }
        />
      </View>

      <Animated.View style={{ flex: 1, opacity: bodyFade }}>
        {loading && notifications.length === 0 ? (
          <View style={s.centerFill}><ActivityIndicator color={colors.coral} /></View>
        ) : !token || token === 'guest' ? (
          <View style={s.centerFill}>
            <Ionicons name="log-in-outline" size={36} color={colors.inkFaint} />
            <Text style={s.emptyText}>Sign in to see your notifications.</Text>
          </View>
        ) : error && notifications.length === 0 ? (
          // Notification-flow fix - this branch is new. Previously a failed load (allFailed in
          // useNotificationStore.load) fell through to the exact same UI as a genuinely empty
          // inbox, so a backend hiccup silently looked like "the notification tab shows nothing" -
          // now it says so explicitly and offers a retry instead of leaving the user guessing.
          <View style={s.centerFill}>
            <Ionicons name="cloud-offline-outline" size={36} color={colors.inkFaint} />
            <Text style={s.emptyText}>{error}</Text>
            <Pressable style={s.retryBtn} onPress={() => load(token)} hitSlop={10}>
              <Ionicons name="refresh" size={16} color={colors.coral} />
              <Text style={s.retryText}>Try again</Text>
            </Pressable>
          </View>
        ) : notifications.length === 0 ? (
          <View style={s.centerFill}>
            <Ionicons name="notifications-off-outline" size={36} color={colors.inkFaint} />
            <Text style={s.emptyText}>Nothing here yet - you're all caught up.</Text>
          </View>
        ) : (
          <FlatList
            data={notifications}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={[s.list, { paddingBottom: insets.bottom + 40 }]}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.coral} />}
            renderItem={({ item, index }) => (
              <NotificationRow item={item} index={index} onPress={() => handleTap(item)} />
            )}
          />
        )}
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  headerWrap: { paddingHorizontal: spacing.lg },
  markAllBtn: { paddingVertical: spacing.xs, paddingHorizontal: spacing.xs },
  markAllText: { fontFamily: fonts.bodyBold, fontSize: fontSizes.xs, color: colors.coral },
  markAllTextDisabled: { color: colors.inkFaint },
  centerFill: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.sm },
  emptyText: { fontFamily: fonts.body, fontSize: fontSizes.sm, color: colors.inkFaint, textAlign: 'center' },
  retryBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: spacing.xs, paddingVertical: spacing.xs, paddingHorizontal: spacing.md,
    borderRadius: radii.pill, backgroundColor: colors.coralSoft,
  },
  retryText: { fontFamily: fonts.bodyBold, fontSize: fontSizes.xs, color: colors.coral },

  list: { padding: spacing.lg, gap: spacing.sm },
  row: {
    flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm,
    backgroundColor: colors.surface, borderRadius: radii.md, padding: spacing.md, ...shadow.sm,
  },
  rowUnread: { backgroundColor: 'rgba(87,158,101,0.06)' },
  rowIcon: {
    width: 34, height: 34, borderRadius: 17, marginTop: 2,
    backgroundColor: colors.coralSoft, alignItems: 'center', justifyContent: 'center',
  },
  rowIconUnread: { backgroundColor: colors.coral },
  rowText: { flex: 1, gap: 2 },
  rowTitle: { fontFamily: fonts.bodyBold, fontSize: fontSizes.sm, color: colors.ink },
  rowBody: { fontFamily: fonts.body, fontSize: fontSizes.xs, color: colors.inkSoft, lineHeight: 16 },
  rowTime: { fontFamily: fonts.bodyMedium, fontSize: 10, color: colors.inkFaint, marginTop: 2 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.coral, marginTop: 6 },
});
