/**
 * AdminRevenueScreen — Item 8 (Admin Revenue Dashboard).
 *
 * Read-only view of platform revenue: total, split by subscription vs. leaf-pack purchases, plus
 * active/trialing Pro subscriber counts. Live read from wallet-service via moodmate-admin's
 * GET /api/admin/revenue (RevenueServiceClient) - no caching, so pull-to-refresh always reflects
 * the current totals. Deliberately scoped to a dashboard only for this pass - coupons and
 * counsellor payouts were named in the original "revenue analytics/payouts/coupons" item but
 * scoped out (see conversation) as separate, larger features.
 */
import React, { useCallback, useState } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator, ScrollView, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { useAuthStore } from '@/state/useAuthStore';
import { getRevenueSummary, type RevenueSummary } from '@/api/support';
import { ApiRequestError } from '@/api/client';
import { colors, fonts, fontSizes, radii, spacing, shadow } from '@/theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'AdminRevenue'>;

function formatCedis(pesewas: number): string {
  return `₵${(pesewas / 100).toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function AdminRevenueScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const token = useAuthStore((s) => s.token) ?? '';

  const [summary, setSummary] = useState<RevenueSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError(null);
    try {
      const data = await getRevenueSummary(token);
      setSummary(data);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Could not load revenue data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <LinearGradient colors={['#2C1654', '#5B2FA0', '#2980B9']} style={s.header}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <Pressable style={s.backBtn} onPress={() => navigation.goBack()} hitSlop={10}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </Pressable>
        <Text style={s.headerTitle}>Revenue</Text>
        <View style={s.backBtn} />
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.lavender} />}
      >
        {error ? (
          <View style={s.alertBanner}>
            <Ionicons name="warning-outline" size={18} color="#C0392B" />
            <Text style={s.alertText}>{error}</Text>
            <Pressable onPress={() => load()}>
              <Text style={s.retryText}>Retry</Text>
            </Pressable>
          </View>
        ) : loading ? (
          <ActivityIndicator color={colors.lavender} style={{ marginVertical: 40 }} />
        ) : summary ? (
          <>
            <View style={s.totalCard}>
              <Text style={s.totalLabel}>Total revenue</Text>
              <Text style={s.totalValue}>{formatCedis(summary.totalRevenuePesewas)}</Text>
              <Text style={s.totalSub}>
                {summary.successfulTransactionCount} successful transaction{summary.successfulTransactionCount === 1 ? '' : 's'}
              </Text>
            </View>

            <Text style={s.sectionTitle}>By source</Text>
            <View style={s.splitRow}>
              <View style={s.splitCard}>
                <Ionicons name="star" size={20} color={colors.lavender} />
                <Text style={s.splitValue}>{formatCedis(summary.subscriptionRevenuePesewas)}</Text>
                <Text style={s.splitLabel}>Pro subscriptions</Text>
              </View>
              <View style={s.splitCard}>
                <Ionicons name="leaf" size={20} color={colors.sage} />
                <Text style={s.splitValue}>{formatCedis(summary.leafPackRevenuePesewas)}</Text>
                <Text style={s.splitLabel}>Leaf packs</Text>
              </View>
            </View>

            <Text style={s.sectionTitle}>Pro subscribers</Text>
            <View style={s.splitRow}>
              <View style={s.splitCard}>
                <Ionicons name="checkmark-circle" size={20} color={colors.sage} />
                <Text style={s.splitValue}>{summary.activeProCount}</Text>
                <Text style={s.splitLabel}>Active</Text>
              </View>
              <View style={s.splitCard}>
                <Ionicons name="time" size={20} color={colors.sun} />
                <Text style={s.splitValue}>{summary.trialingCount}</Text>
                <Text style={s.splitLabel}>Trialing</Text>
              </View>
            </View>

            <View style={s.infoBox}>
              <Ionicons name="information-circle-outline" size={16} color={colors.inkFaint} />
              <Text style={s.infoText}>
                Live totals from wallet-service, computed from successful Paystack transactions only.{'\n'}
                Coupons and counsellor payouts aren't tracked here yet.
              </Text>
            </View>
          </>
        ) : null}
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

  alertBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: spacing.xl, marginTop: spacing.lg,
    backgroundColor: '#FEF0EE', borderRadius: radii.md, padding: spacing.md,
  },
  alertText: { fontFamily: fonts.bodyMedium, fontSize: fontSizes.sm, color: '#7B1010', flex: 1 },
  retryText: { fontFamily: fonts.bodyBold, fontSize: fontSizes.sm, color: '#C0392B' },

  totalCard: {
    marginHorizontal: spacing.xl, marginTop: spacing.xl,
    backgroundColor: colors.surface, borderRadius: radii.lg, padding: spacing.xl,
    alignItems: 'center', ...shadow.sm,
  },
  totalLabel: { fontFamily: fonts.bodyBold, fontSize: fontSizes.sm, color: colors.inkSoft, textTransform: 'uppercase', letterSpacing: 0.5 },
  totalValue: { fontFamily: fonts.display, fontSize: fontSizes.display + 8, color: colors.ink, marginTop: 6 },
  totalSub: { fontFamily: fonts.bodyMedium, fontSize: fontSizes.sm, color: colors.inkFaint, marginTop: 4 },

  sectionTitle: {
    fontFamily: fonts.displaySemibold, fontSize: fontSizes.lg, color: colors.ink,
    marginHorizontal: spacing.xl, marginTop: spacing.xl, marginBottom: spacing.md,
  },
  splitRow: { flexDirection: 'row', gap: spacing.sm, marginHorizontal: spacing.xl },
  splitCard: {
    flex: 1, backgroundColor: colors.surface, borderRadius: radii.md, padding: spacing.lg,
    alignItems: 'center', gap: 6, ...shadow.sm,
  },
  splitValue: { fontFamily: fonts.display, fontSize: fontSizes.xl, color: colors.ink },
  splitLabel: { fontFamily: fonts.bodyMedium, fontSize: fontSizes.xs, color: colors.inkSoft },

  infoBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    marginHorizontal: spacing.xl, marginTop: spacing.xl,
    backgroundColor: '#F8F7FA', borderRadius: radii.md, padding: spacing.md,
  },
  infoText: { fontFamily: fonts.body, fontSize: fontSizes.xs, color: colors.inkFaint, lineHeight: 18, flex: 1 },
});
