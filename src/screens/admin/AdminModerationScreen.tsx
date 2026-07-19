/**
 * AdminModerationScreen — Phase 1H (Admin Portal - Community Moderation).
 *
 * The backend (ModerationController/ModerationService, Feature 7) was already fully built before
 * this pass - report/flag by users, an admin review queue, approve/remove/ban/warn, dedup across
 * duplicate reports on the same content. This screen is the first frontend surface for any of it.
 *
 * Status filter (Pending/Dismissed/Removed/All) + one action row per report: Approve ("content is
 * fine," dismisses this report and any duplicate PENDING reports on the same item), Remove (hard-
 * deletes the content, same dedup-resolution), Ban author, Warn author. Ban/warn don't collect a
 * custom reason in this UI - the backend falls back to the report's own stored reason when none is
 * given (see ModerationActionRequest's doc comment), which is the common case anyway.
 */
import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, Pressable, StyleSheet, ActivityIndicator, ScrollView, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { useAuthStore } from '@/state/useAuthStore';
import {
  getModerationQueue, approveReport, removeReportedContent, banReportedAuthor, warnReportedAuthor,
} from '@/api/community';
import { ApiRequestError } from '@/api/client';
import type { ReportStatus, ReportView } from '@/api/types';
import { colors, fonts, fontSizes, radii, spacing, shadow } from '@/theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'AdminModeration'>;
type FilterTab = ReportStatus | 'ALL';

const FILTERS: { key: FilterTab; label: string }[] = [
  { key: 'PENDING', label: 'Pending' },
  { key: 'DISMISSED', label: 'Dismissed' },
  { key: 'CONTENT_REMOVED', label: 'Removed' },
  { key: 'ALL', label: 'All' },
];

function formatReported(iso: string): string {
  return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export function AdminModerationScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const token = useAuthStore((s) => s.token) ?? '';

  const [filter, setFilter] = useState<FilterTab>('PENDING');
  const [reports, setReports] = useState<ReportView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionId, setActionId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const page = await getModerationQueue(token, filter);
      setReports(page.content);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Could not load the moderation queue.');
    } finally {
      setLoading(false);
    }
  }, [token, filter]);

  useEffect(() => { load(); }, [load]);

  const removeFromList = (id: number) => setReports((prev) => prev.filter((r) => r.id !== id));

  const handleApprove = async (report: ReportView) => {
    setActionId(report.id);
    try {
      await approveReport(token, report.id);
      removeFromList(report.id);
    } catch (err) {
      Alert.alert('Error', err instanceof ApiRequestError ? err.message : 'Could not approve this report.');
    } finally { setActionId(null); }
  };

  const handleRemove = (report: ReportView) => {
    Alert.alert('Remove content?', 'This will permanently delete the reported post or comment.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove', style: 'destructive',
        onPress: async () => {
          setActionId(report.id);
          try {
            await removeReportedContent(token, report.id);
            removeFromList(report.id);
          } catch (err) {
            Alert.alert('Error', err instanceof ApiRequestError ? err.message : 'Could not remove this content.');
          } finally { setActionId(null); }
        },
      },
    ]);
  };

  const handleBan = (report: ReportView) => {
    Alert.alert('Ban this author?', 'They will be immediately signed out and unable to log back in.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Ban', style: 'destructive',
        onPress: async () => {
          setActionId(report.id);
          try {
            await banReportedAuthor(token, report.id);
            Alert.alert('Author banned');
          } catch (err) {
            Alert.alert('Error', err instanceof ApiRequestError ? err.message : 'Could not ban this author.');
          } finally { setActionId(null); }
        },
      },
    ]);
  };

  const handleWarn = async (report: ReportView) => {
    setActionId(report.id);
    try {
      await warnReportedAuthor(token, report.id);
      Alert.alert('Warning sent');
    } catch (err) {
      Alert.alert('Error', err instanceof ApiRequestError ? err.message : 'Could not warn this author.');
    } finally { setActionId(null); }
  };

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <LinearGradient colors={['#2C1654', '#5B2FA0', '#2980B9']} style={s.header}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <Pressable style={s.backBtn} onPress={() => navigation.goBack()} hitSlop={10}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </Pressable>
        <Text style={s.headerTitle}>Community Moderation</Text>
        <View style={{ width: 34 }} />
      </LinearGradient>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.filterScroll} contentContainerStyle={s.filterRow}>
        {FILTERS.map((f) => (
          <Pressable key={f.key} style={[s.filterChip, filter === f.key && s.filterChipActive]} onPress={() => setFilter(f.key)}>
            <Text style={[s.filterChipText, filter === f.key && s.filterChipTextActive]}>{f.label}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}>
        {error ? (
          <View style={s.alertBanner}>
            <Ionicons name="warning-outline" size={18} color="#C0392B" />
            <Text style={s.alertText}>{error}</Text>
          </View>
        ) : loading ? (
          <ActivityIndicator color={colors.lavender} style={{ marginVertical: 40 }} />
        ) : reports.length === 0 ? (
          <View style={s.emptyState}>
            <Ionicons name="shield-checkmark-outline" size={40} color={colors.sage} />
            <Text style={s.emptyBody}>Nothing here right now.</Text>
          </View>
        ) : (
          reports.map((r) => (
            <View key={r.id} style={s.card}>
              <View style={s.cardTopRow}>
                <View style={s.typeBadge}>
                  <Text style={s.typeBadgeText}>{r.contentType}</Text>
                </View>
                <Text style={s.cardDate}>{formatReported(r.createdAt)}</Text>
              </View>

              <Text style={s.reasonLabel}>Reported for:</Text>
              <Text style={s.reasonText}>{r.reason}</Text>

              {r.contentPreview ? (
                <View style={s.previewBox}>
                  <Text style={s.previewText} numberOfLines={4}>{r.contentPreview}</Text>
                </View>
              ) : (
                <Text style={s.previewMissing}>Content already removed.</Text>
              )}

              {r.status === 'PENDING' && (
                <View style={s.actionGrid}>
                  <Pressable style={[s.actionBtn, s.approveBtn]} onPress={() => handleApprove(r)} disabled={actionId === r.id}>
                    {actionId === r.id ? <ActivityIndicator size="small" color="#27AE60" /> : <Text style={s.approveBtnText}>✓ Approve</Text>}
                  </Pressable>
                  <Pressable style={[s.actionBtn, s.removeBtn]} onPress={() => handleRemove(r)} disabled={actionId === r.id}>
                    <Text style={s.removeBtnText}>Remove</Text>
                  </Pressable>
                  <Pressable style={[s.actionBtn, s.warnBtn]} onPress={() => handleWarn(r)} disabled={actionId === r.id}>
                    <Text style={s.warnBtnText}>Warn</Text>
                  </Pressable>
                  <Pressable style={[s.actionBtn, s.banBtn]} onPress={() => handleBan(r)} disabled={actionId === r.id}>
                    <Text style={s.banBtnText}>Ban</Text>
                  </Pressable>
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>
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

  filterScroll: { flexGrow: 0, marginTop: spacing.lg, marginBottom: spacing.md },
  filterRow: { paddingHorizontal: spacing.xl, gap: 8 },
  filterChip: { paddingHorizontal: spacing.md, paddingVertical: 8, borderRadius: radii.pill, backgroundColor: colors.surface, ...shadow.sm },
  filterChipActive: { backgroundColor: colors.lavender },
  filterChipText: { fontFamily: fonts.bodyBold, fontSize: fontSizes.xs, color: colors.inkSoft },
  filterChipTextActive: { color: '#fff' },

  alertBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: spacing.xl, marginTop: spacing.md,
    backgroundColor: '#FEF0EE', borderRadius: radii.md, padding: spacing.md,
    borderLeftWidth: 3, borderLeftColor: '#C0392B',
  },
  alertText: { fontFamily: fonts.bodyMedium, fontSize: fontSizes.sm, color: '#7B1010', flex: 1 },

  emptyState: { alignItems: 'center', paddingVertical: spacing.xxl, gap: 10, marginHorizontal: spacing.xl },
  emptyBody: { fontFamily: fonts.bodyMedium, fontSize: fontSizes.sm, color: colors.inkSoft, textAlign: 'center' },

  card: {
    backgroundColor: colors.surface, borderRadius: radii.md, padding: spacing.lg,
    marginHorizontal: spacing.xl, marginBottom: spacing.md, ...shadow.sm,
  },
  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  typeBadge: { backgroundColor: colors.lavenderSoft, borderRadius: radii.pill, paddingHorizontal: spacing.sm, paddingVertical: 2 },
  typeBadgeText: { fontFamily: fonts.bodyBold, fontSize: 9, color: colors.lavenderDeep, letterSpacing: 0.5 },
  cardDate: { fontFamily: fonts.body, fontSize: fontSizes.xs, color: colors.inkFaint },

  reasonLabel: { fontFamily: fonts.bodyBold, fontSize: fontSizes.xs, color: colors.inkSoft },
  reasonText: { fontFamily: fonts.bodyMedium, fontSize: fontSizes.sm, color: colors.ink, marginTop: 2, marginBottom: spacing.sm },

  previewBox: { backgroundColor: '#F4F2F8', borderRadius: radii.sm, padding: spacing.sm, marginBottom: spacing.md },
  previewText: { fontFamily: fonts.body, fontSize: fontSizes.sm, color: colors.inkSoft, lineHeight: 20 },
  previewMissing: { fontFamily: fonts.body, fontSize: fontSizes.xs, color: colors.inkFaint, fontStyle: 'italic', marginBottom: spacing.md },

  actionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  actionBtn: { flex: 1, minWidth: '45%', paddingVertical: spacing.sm, borderRadius: radii.md, alignItems: 'center', justifyContent: 'center' },
  approveBtn: { borderWidth: 1.5, borderColor: '#27AE60' },
  approveBtnText: { fontFamily: fonts.bodyBold, fontSize: fontSizes.xs, color: '#27AE60' },
  removeBtn: { backgroundColor: '#E67E22' },
  removeBtnText: { fontFamily: fonts.bodyBold, fontSize: fontSizes.xs, color: '#fff' },
  warnBtn: { borderWidth: 1.5, borderColor: '#E67E22' },
  warnBtnText: { fontFamily: fonts.bodyBold, fontSize: fontSizes.xs, color: '#E67E22' },
  banBtn: { backgroundColor: colors.coral },
  banBtnText: { fontFamily: fonts.bodyBold, fontSize: fontSizes.xs, color: '#fff' },
});
