import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useAuthStore } from '@/state/useAuthStore';
import { useToast } from '@/state/useToast';
import { listMyTransactions } from '@/api/payments';
import { ApiRequestError } from '@/api/client';
import type { PaymentTransactionView } from '@/api/types';
import { FadeInItem } from '@/components/FadeInItem';
import { colors, fonts, fontSizes, radii, spacing } from '@/theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'PurchaseHistory'>;

function formatPesewas(pesewas: number, currency: string): string {
  const symbol = currency === 'GHS' ? '₵' : currency + ' ';
  return `${symbol}${(pesewas / 100).toFixed(2)}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const PURPOSE_LABELS: Record<string, string> = {
  SUBSCRIPTION: 'Pro subscription',
  LEAF_PACK: 'Leaf pack',
};

const STATUS_STYLES: Record<string, { color: string; bg: string }> = {
  SUCCESS: { color: '#27AE60', bg: '#E8F8EF' },
  PENDING: { color: '#E67E22', bg: '#FEF3E2' },
  FAILED: { color: '#E74C3C', bg: '#FDEDEC' },
};

/** Wellness Marketplace (Milestone 7) - purchase history. Pure frontend wiring against the
 * backend's already-existing GET /api/payments/transactions endpoint (listMyTransactions), which
 * had no caller anywhere in the app before this screen. */
export function PurchaseHistoryScreen({ navigation }: Props) {
  const token = useAuthStore((s) => s.token);
  const toast = useToast();

  const [transactions, setTransactions] = useState<PaymentTransactionView[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!token || token === 'guest') {
      setLoading(false);
      return;
    }
    if (silent) setRefreshing(true); else setLoading(true);
    try {
      const page = await listMyTransactions(token);
      setTransactions(page.content);
    } catch (err) {
      toast(err instanceof ApiRequestError ? err.message : 'Could not load purchase history.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, toast]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  return (
    <View style={s.flex}>
      <View style={s.header}>
        <ScreenHeader title="Purchase History" onClose={() => navigation.goBack()} />
      </View>
      {loading ? (
        <View style={s.center}><ActivityIndicator color={colors.sage} /></View>
      ) : transactions.length === 0 ? (
        <View style={s.center}>
          <Text style={s.emptyEmoji}>🧾</Text>
          <Text style={s.emptyText}>No purchases yet</Text>
        </View>
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={(item) => item.reference}
          contentContainerStyle={s.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.sage} />}
          renderItem={({ item, index }) => {
            const statusStyle = STATUS_STYLES[item.status] ?? STATUS_STYLES.PENDING;
            return (
              <FadeInItem index={index} style={s.row}>
                <View style={s.rowMain}>
                  <Text style={s.rowTitle}>{PURPOSE_LABELS[item.purpose] ?? item.purpose}</Text>
                  <Text style={s.rowSub}>{item.itemCode} · {formatDate(item.createdAt)}</Text>
                </View>
                <View style={s.rowEnd}>
                  <Text style={s.rowAmount}>{formatPesewas(item.amountPesewas, item.currency)}</Text>
                  <View style={[s.statusPill, { backgroundColor: statusStyle.bg }]}>
                    <Text style={[s.statusText, { color: statusStyle.color }]}>{item.status}</Text>
                  </View>
                </View>
              </FadeInItem>
            );
          }}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: spacing.lg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  emptyEmoji: { fontSize: 40 },
  emptyText: { fontFamily: fonts.body, fontSize: fontSizes.base, color: colors.inkFaint },
  list: { padding: spacing.lg, paddingTop: spacing.sm, gap: spacing.sm },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.line,
    borderRadius: radii.md,
    padding: spacing.md,
  },
  rowMain: { flex: 1, gap: 2 },
  rowTitle: { fontFamily: fonts.bodyBold, fontSize: fontSizes.sm, color: colors.ink },
  rowSub: { fontFamily: fonts.body, fontSize: fontSizes.xs, color: colors.inkFaint },
  rowEnd: { alignItems: 'flex-end', gap: 4 },
  rowAmount: { fontFamily: fonts.bodyBold, fontSize: fontSizes.sm, color: colors.ink },
  statusPill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: radii.pill },
  statusText: { fontFamily: fonts.bodyBold, fontSize: 10 },
});
