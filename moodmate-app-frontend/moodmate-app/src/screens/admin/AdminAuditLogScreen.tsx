/**
 * AdminAuditLogScreen — Phase 1H (Admin Portal - Audit Logs).
 *
 * Read-only, paginated list of admin actions (SUSPEND_USER, REINSTATE_COUNSELLOR,
 * APPROVE_REPORT, etc.) fanned in from auth/support/community's AuditLogServiceClient calls.
 * Sorted newest-first (backend orders by created_at DESC). "Load more" appends the next page
 * rather than a full pull-to-refresh list, since this is expected to grow unbounded.
 *
 * Deliberate scope note: moodmate-wellness's article/event admin CRUD is NOT represented here —
 * it was excluded from audit logging this pass as a documented, lower-stakes content-only action
 * (vs. account/safety actions in auth/support/community).
 */
import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator, FlatList } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { useAuthStore } from '@/state/useAuthStore';
import { getAuditLogs, type AuditLogView } from '@/api/support';
import { ApiRequestError } from '@/api/client';
import { colors, fonts, fontSizes, radii, spacing, shadow } from '@/theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'AdminAuditLog'>;

const PAGE_SIZE = 30;

const ACTION_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  SUSPEND_USER: 'ban-outline',
  REINSTATE_USER: 'checkmark-circle-outline',
  SUSPEND_COUNSELLOR: 'ban-outline',
  REINSTATE_COUNSELLOR: 'checkmark-circle-outline',
  EDIT_COUNSELLOR: 'create-outline',
  DEACTIVATE_MENTOR: 'ban-outline',
  ACTIVATE_MENTOR: 'checkmark-circle-outline',
  APPROVE_REPORT: 'checkmark-done-outline',
  REMOVE_REPORTED_CONTENT: 'trash-outline',
  BAN_REPORTED_AUTHOR: 'ban-outline',
  WARN_REPORTED_AUTHOR: 'warning-outline',
};

function formatAction(action: string): string {
  return action.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatWhen(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export function AdminAuditLogScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const token = useAuthStore((s) => s.token) ?? '';

  const [logs, setLogs] = useState<AuditLogView[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadFirstPage = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getAuditLogs(token, 0, PAGE_SIZE);
      setLogs(result.content);
      setPage(0);
      setHasMore(result.content.length === PAGE_SIZE);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Could not load audit logs.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { loadFirstPage(); }, [loadFirstPage]);

  const loadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const result = await getAuditLogs(token, nextPage, PAGE_SIZE);
      setLogs((prev) => [...prev, ...result.content]);
      setPage(nextPage);
      // PageResponse<T> only has `content` (no `last`/pagination metadata from the backend) - use
      // the same page-size heuristic loadFirstPage() already uses above, for consistency.
      setHasMore(result.content.length === PAGE_SIZE);
    } catch {
      // Silent — the user can just tap the bottom of the list again.
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <LinearGradient colors={['#24412A', '#579E65']} style={s.header}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <Pressable style={s.backBtn} onPress={() => navigation.goBack()} hitSlop={10}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </Pressable>
        <Text style={s.headerTitle}>Audit Log</Text>
        <View style={{ width: 34 }} />
      </LinearGradient>

      {error ? (
        <View style={s.alertBanner}>
          <Ionicons name="warning-outline" size={18} color={colors.error} />
          <Text style={s.alertText}>{error}</Text>
        </View>
      ) : loading ? (
        <ActivityIndicator color={colors.coral} style={{ marginVertical: 24 }} />
      ) : logs.length === 0 ? (
        <View style={s.emptyState}>
          <Ionicons name="document-text-outline" size={36} color={colors.inkFaint} />
          <Text style={s.emptyBody}>No admin actions recorded yet.</Text>
        </View>
      ) : (
        <FlatList
          data={logs}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ paddingHorizontal: spacing.xl, paddingBottom: insets.bottom + 40 }}
          onEndReachedThreshold={0.4}
          onEndReached={loadMore}
          ListFooterComponent={loadingMore ? <ActivityIndicator color={colors.coral} style={{ marginVertical: 16 }} /> : null}
          renderItem={({ item }) => (
            <View style={s.logRow}>
              <View style={s.logIcon}>
                <Ionicons name={ACTION_ICONS[item.action] ?? 'ellipse-outline'} size={16} color={colors.coralDeep} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.logAction}>{formatAction(item.action)}</Text>
                <Text style={s.logMeta}>
                  {item.adminName} · {item.targetType}{item.targetId ? ` #${item.targetId}` : ''}
                </Text>
                {item.details ? <Text style={s.logDetails}>{item.details}</Text> : null}
              </View>
              <Text style={s.logWhen}>{formatWhen(item.createdAt)}</Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.lg,
  },
  backBtn: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: fonts.displaySemibold, fontSize: fontSizes.lg, color: '#fff' },

  alertBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: spacing.xl, marginTop: spacing.md,
    backgroundColor: colors.errorSoft, borderRadius: radii.md, padding: spacing.md,
    borderLeftWidth: 3, borderLeftColor: colors.error,
  },
  alertText: { fontFamily: fonts.bodyMedium, fontSize: fontSizes.sm, color: colors.errorDeep, flex: 1 },

  emptyState: { alignItems: 'center', paddingVertical: spacing.xxl, gap: 8 },
  emptyBody: { fontFamily: fonts.bodyMedium, fontSize: fontSizes.sm, color: colors.inkSoft },

  logRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: colors.surface, borderRadius: radii.md, padding: spacing.md,
    marginTop: spacing.sm, ...shadow.sm,
  },
  logIcon: {
    width: 30, height: 30, borderRadius: 15, backgroundColor: colors.coralSoft,
    alignItems: 'center', justifyContent: 'center', marginTop: 2,
  },
  logAction: { fontFamily: fonts.bodyBold, fontSize: fontSizes.sm, color: colors.ink },
  logMeta: { fontFamily: fonts.body, fontSize: fontSizes.xs, color: colors.inkSoft, marginTop: 2 },
  logDetails: { fontFamily: fonts.body, fontSize: fontSizes.xs, color: colors.inkFaint, marginTop: 4 },
  logWhen: { fontFamily: fonts.body, fontSize: fontSizes.xs, color: colors.inkFaint, marginLeft: 8 },
});
