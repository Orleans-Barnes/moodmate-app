import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { CurvedForestHeader } from '@/components/CurvedForestHeader';
import { PressScale } from '@/components/PressScale';
import { FadeInItem } from '@/components/FadeInItem';
import { useAuthStore } from '@/state/useAuthStore';
import { useWalletStore } from '@/state/useWalletStore';
import { useToast } from '@/state/useToast';
import { listMyTransactions } from '@/api/payments';
import { ApiRequestError } from '@/api/client';
import type { PaymentTransactionView } from '@/api/types';
import { calm, fonts, fontSizes, radii, spacing, shadow } from '@/theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'PurchaseHistory'>;

function formatPesewas(pesewas: number, currency: string): string {
  const symbol = currency === 'GHS' ? 'GHS ' : currency + ' ';
  return `${symbol}${(pesewas / 100).toFixed(2)}`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const day = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  const time = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
  return `${day} · ${time}`;
}

export function PurchaseHistoryScreen({ navigation }: Props) {
  const token = useAuthStore((s) => s.token);
  const leafBalance = useWalletStore((s) => s.leafBalance);
  const loadWallet = useWalletStore((s) => s.load);
  const toast = useToast();
  const insets = useSafeAreaInsets();

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
      const [page] = await Promise.all([
        listMyTransactions(token),
        loadWallet(token),
      ]);
      setTransactions(page.content);
    } catch (err) {
      toast(err instanceof ApiRequestError ? err.message : 'Could not load purchase history.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, toast, loadWallet]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  // Calculate net balance in pesewas from transaction history
  const netBalancePesewas = transactions
    .filter((t) => t.status === 'SUCCESS')
    .reduce((sum, t) => {
      const isCredit = t.purpose === 'LEAF_PACK';
      return sum + (isCredit ? t.amountPesewas : -t.amountPesewas);
    }, 0);

  return (
    <View style={s.root}>
      <CurvedForestHeader
        title="Wallet"
        onBack={() => navigation.goBack()}
        bottomPadding={spacing.lg}
      >
        <View style={s.balanceBlock}>
          <Text style={s.balanceLabel}>Available Balance</Text>
          <Text style={s.balanceAmount}>
            {formatPesewas(netBalancePesewas, 'GHS')}
          </Text>

          <PressScale style={s.topUpWrap} onPress={() => navigation.navigate('Shop')}>
            <View style={s.topUpBtn}>
              <Ionicons name="add" size={16} color={calm.forest} style={{ marginRight: 2 }} />
              <Text style={s.topUpText}>Top Up</Text>
            </View>
          </PressScale>
        </View>
      </CurvedForestHeader>

      <View style={s.body}>
        <Text style={s.sectionTitle}>Transaction History</Text>

        {loading ? (
          <View style={s.center}><ActivityIndicator color={calm.primary} /></View>
        ) : transactions.length === 0 ? (
          <View style={s.center}>
            <View style={s.emptyIcon}>
              <Ionicons name="receipt-outline" size={32} color={calm.muted} />
            </View>
            <Text style={s.emptyTitle}>No transactions yet</Text>
            <Text style={s.emptySub}>Leaf pack purchases and Pro subscriptions will appear here.</Text>
          </View>
        ) : (
          <FlatList
            data={transactions}
            keyExtractor={(item) => item.reference}
            contentContainerStyle={[s.list, { paddingBottom: insets.bottom + spacing.xl }]}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={calm.primary} />
            }
            renderItem={({ item, index }) => {
              const isCredit = item.purpose === 'LEAF_PACK' && item.status === 'SUCCESS';
              const amountColor = item.status === 'FAILED' ? calm.muted : isCredit ? '#1DA851' : '#D64545';
              const amountPrefix = isCredit ? '+' : item.status === 'SUCCESS' ? '-' : '';

              // Icon colors and names matching the mockup exactly
              const iconName = isCredit ? 'arrow-down' : 'arrow-up';
              const iconBg = isCredit ? '#E7F8EE' : '#FDEAEA';
              const iconColor = isCredit ? '#1DA851' : '#D64545';

              return (
                <FadeInItem index={index} style={s.row}>
                  <View style={[s.txIcon, { backgroundColor: iconBg }]}>
                    <Ionicons name={iconName} size={18} color={iconColor} />
                  </View>
                  <View style={s.rowMain}>
                    <Text style={s.rowTitle}>
                      {item.purpose === 'LEAF_PACK' ? 'Wallet top-up' : `Paid for job #${item.reference.substring(0, 3)}`}
                    </Text>
                    <Text style={s.rowSub}>{formatDate(item.createdAt)}</Text>
                  </View>
                  <View style={s.rowEnd}>
                    <Text style={[s.rowAmount, { color: amountColor }]}>
                      {amountPrefix}{formatPesewas(item.amountPesewas, item.currency)}
                    </Text>
                    {item.status !== 'SUCCESS' && (
                      <Text style={[s.statusTag, item.status === 'PENDING' && s.statusPending]}>
                        {item.status.toLowerCase()}
                      </Text>
                    )}
                  </View>
                </FadeInItem>
              );
            }}
          />
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: calm.bg },

  balanceBlock: { alignItems: 'center', paddingBottom: spacing.sm },
  balanceLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.sm,
    color: calm.mutedOnDark,
    letterSpacing: 0.3,
  },
  balanceAmount: {
    fontFamily: fonts.displayExtraBold,
    fontSize: 40,
    color: '#FFFFFF',
    letterSpacing: -1,
    marginTop: spacing.xs,
  },
  balanceSub: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: calm.mutedOnDark,
    marginTop: 4,
  },
  topUpWrap: { marginTop: spacing.lg },
  topUpBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radii.pill,
    ...shadow.sm,
  },
  topUpText: { fontFamily: fonts.bodyBold, fontSize: fontSizes.base, color: calm.forest },

  body: { flex: 1, paddingHorizontal: spacing.lg, marginTop: spacing.md },
  sectionTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.lg,
    color: calm.forest,
    marginBottom: spacing.md,
  },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm, paddingTop: spacing.xxxl },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: calm.mintBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  emptyTitle: { fontFamily: fonts.bodyBold, fontSize: fontSizes.md, color: calm.forest },
  emptySub: { fontFamily: fonts.body, fontSize: fontSizes.sm, color: calm.muted, textAlign: 'center', paddingHorizontal: spacing.xl },

  list: { gap: spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: radii.lg,
    padding: spacing.md,
    gap: spacing.md,
    ...shadow.sm,
  },
  txIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowMain: { flex: 1, gap: 3 },
  rowTitle: { fontFamily: fonts.bodyBold, fontSize: fontSizes.base - 1, color: calm.ink },
  rowSub: { fontFamily: fonts.body, fontSize: fontSizes.sm, color: calm.muted },
  rowEnd: { alignItems: 'flex-end', gap: 4 },
  rowAmount: { fontFamily: fonts.bodyBold, fontSize: fontSizes.base - 1 },
  statusTag: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.xs,
    color: calm.rust,
    textTransform: 'capitalize',
  },
  statusPending: { color: calm.amber },
});
