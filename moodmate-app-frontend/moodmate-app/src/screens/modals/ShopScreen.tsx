import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Animated, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Card } from '@/components/Card';
import { ConfettiBurst, ConfettiHandle } from '@/components/Confetti';
import { useWalletStore } from '@/state/useWalletStore';
import { useWellnessStore } from '@/state/useWellnessStore';
import { useAuthStore } from '@/state/useAuthStore';
import { usePaymentsStore } from '@/state/usePaymentsStore';
import { useToast } from '@/state/useToast';
import { openProUpgrade } from '@/utils/openProUpgrade';
import { ApiRequestError } from '@/api/client';
import type { SkinView } from '@/api/types';
import { colors, fonts, fontSizes, radii, spacing } from '@/theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'Shop'>;

const BOOSTS = [
  {
    key: 'streakFreeze' as const,
    icon: 'snow-outline' as const,
    tint: '#E0F2FE',
    iconColor: '#0284C7',
    name: 'Streak Freeze',
    sub: 'Protects your streak for one missed day',
    cost: 50,
  },
  {
    key: 'doubleXp' as const,
    icon: 'flash' as const,
    tint: '#FEF3C7',
    iconColor: '#D97706',
    name: 'Double XP (24h)',
    sub: 'Earn 2× tree XP from every habit today',
    cost: 40,
  },
];

function formatPesewas(pesewas: number): string {
  return `₵${Math.round(pesewas / 100)}`;
}

function LeafCost({ cost, tone }: { cost: number; tone?: 'active' }) {
  return (
    <View style={styles.leafCostRow}>
      <Ionicons name="leaf" size={12} color={tone === 'active' ? colors.sage : colors.inkFaint} />
      <Text style={[styles.leafCostText, tone === 'active' && styles.leafCostTextActive]}>{cost}</Text>
    </View>
  );
}

function SkinTile({
  skin,
  locked,
  onPress,
  onLockedPress,
}: {
  skin: SkinView;
  // Premium gating breadth (Milestone item 7) - true when this skin is proOnly and the user isn't
  // Pro right now. Distinct from skin.owned: a lapsed Pro user can still "own" (have previously
  // purchased) a proOnly skin but be locked out of equipping it - see WalletService.equipSkin.
  locked: boolean;
  onPress: () => Promise<boolean>; // resolves true if purchase/equip succeeded
  onLockedPress: () => void;
}) {
  const shake = useRef(new Animated.Value(0)).current;

  const handlePress = async () => {
    if (locked) {
      onLockedPress();
      return;
    }
    const success = await onPress();
    if (!success) {
      Animated.sequence([
        Animated.timing(shake, { toValue: 1, duration: 60, useNativeDriver: true }),
        Animated.timing(shake, { toValue: -1, duration: 60, useNativeDriver: true }),
        Animated.timing(shake, { toValue: 1, duration: 60, useNativeDriver: true }),
        Animated.timing(shake, { toValue: 0, duration: 60, useNativeDriver: true }),
      ]).start();
    }
  };

  return (
    // Layout note: the percentage width lives on THIS wrapper, not on the Pressable inside it -
    // combining `flex: 1` with a child `width: '31%'` (the previous version's bug) made Yoga
    // compute that percentage against a flex-shrunk, content-sized box instead of the grid's real
    // column width, which is what produced the illegibly narrow, letter-wrapped tiles.
    <View style={styles.skinTileWrap}>
      <Animated.View style={{ transform: [{ translateX: shake.interpolate({ inputRange: [-1, 1], outputRange: [-4, 4] }) }] }}>
        <Pressable
          onPress={handlePress}
          style={[styles.skinTile, skin.equipped && styles.skinTileActive, locked && styles.skinTileLocked]}
        >
          {locked && (
            <View style={styles.skinLockBadge}>
              <Ionicons name="lock-closed" size={9} color={colors.surface} />
              <Text style={styles.skinLockBadgeTxt}>PRO</Text>
            </View>
          )}
          {skin.equipped && (
            <View style={styles.skinEquippedBadge}>
              <Ionicons name="checkmark" size={11} color={colors.surface} />
            </View>
          )}
          <View style={[styles.skinPreview, skin.equipped && styles.skinPreviewActive, locked && styles.skinPreviewLocked]}>
            <Text style={styles.skinEmoji}>{skin.emoji}</Text>
          </View>
          <Text style={styles.skinName} numberOfLines={2}>{skin.name}</Text>
          {locked ? (
            <Text style={styles.skinStatusLocked}>Pro only</Text>
          ) : skin.equipped ? (
            <Text style={styles.skinStatusActive}>Equipped</Text>
          ) : skin.cost > 0 ? (
            skin.owned ? (
              <Text style={styles.skinStatusOwned}>Owned</Text>
            ) : (
              <LeafCost cost={skin.cost} />
            )
          ) : (
            <Text style={styles.skinStatusOwned}>Free</Text>
          )}
        </Pressable>
      </Animated.View>
    </View>
  );
}

export function ShopScreen({ navigation }: Props) {
  const leafBalance = useWalletStore((s) => s.leafBalance);
  const skins = useWalletStore((s) => s.skins);
  const leafPacks = useWalletStore((s) => s.leafPacks);
  const load = useWalletStore((s) => s.load);
  const equip = useWalletStore((s) => s.equip);
  const startLeafCheckout = useWalletStore((s) => s.startLeafCheckout);
  const verifyPending = useWalletStore((s) => s.verifyPending);
  const hasStreakShield = useWellnessStore((s) => s.hasStreakShield);
  const doubleXpActiveUntil = useWellnessStore((s) => s.doubleXpActiveUntil);
  const buyStreakShield = useWellnessStore((s) => s.buyStreakShield);
  const buyDoubleXpBoost = useWellnessStore((s) => s.buyDoubleXpBoost);
  const token = useAuthStore((s) => s.token);
  // Premium gating breadth (Milestone item 7) - "Exclusive tree skins" is one of the 5 gated
  // features. proOnly skins (PALM, GOLDEN - see WalletService.equipSkin) show a lock badge and
  // route to ProScreen on tap instead of attempting to equip, mirroring the pattern used in
  // ExploreScreen.handleMusicPress / BubblePopScreen for the other gated features.
  const isPro = usePaymentsStore((s) => s.subscription.pro);
  const loadPayments = usePaymentsStore((s) => s.load);
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const confettiRef = useRef<ConfettiHandle>(null);
  const [buyingPack, setBuyingPack] = useState<string | null>(null);
  const [buyingBoost, setBuyingBoost] = useState<string | null>(null);

  useEffect(() => {
    if (token && token !== 'guest') {
      loadPayments(token).catch(() => {});
    }
  }, [token, loadPayments]);

  const doubleXpActive = doubleXpActiveUntil ? new Date(doubleXpActiveUntil) > new Date() : false;

  const refresh = useCallback(() => {
    if (!token) return;
    // Resolve any checkout started before this screen lost focus (Task #26) before loading, so
    // a just-completed purchase is reflected in the balance shown below.
    (async () => {
      try {
        const outcome = await verifyPending(token);
        if (outcome === 'success') {
          confettiRef.current?.fire();
          toast('Leaves added');
        } else if (outcome === 'failed') {
          toast('That payment didn’t go through — no leaves were charged.');
        }
      } catch (err) {
        // Verification failing shouldn't block the rest of the screen from loading
      }
      load(token).catch((err) => {
        toast(err instanceof ApiRequestError ? err.message : 'Could not load the shop.');
      });
    })();
  }, [token, load, verifyPending, toast]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const handleEquip = async (code: string): Promise<boolean> => {
    if (!token) return false;
    try {
      await equip(token, code);
      confettiRef.current?.fire();
      toast('Tree skin updated');
      return true;
    } catch (err) {
      toast(err instanceof ApiRequestError ? err.message : 'Could not equip that skin.');
      return false;
    }
  };

  // Feature 14 (Shop Improvements): Streak Freeze reuses the existing streak-shield endpoint
  // (same mechanic, different shop label - see moodmate-wellness's WellnessService doc
  // comment). Double XP is backed by the new POST /api/wellness/boosts/double-xp endpoint.
  // Both debit leaves wallet-side, so load() re-syncs the balance shown at the top of
  // this screen after a successful purchase (useWellnessStore's own leafBalance also updates,
  // but this screen's displayed balance comes from useWalletStore - see the balance row below).
  const handleBuyBoost = async (key: 'streakFreeze' | 'doubleXp') => {
    if (!token || token === 'guest' || buyingBoost) {
      if (token === 'guest') toast('Create an account to buy boosts.');
      return;
    }
    if (key === 'streakFreeze' && hasStreakShield) {
      toast('You already have an active streak shield.');
      return;
    }
    setBuyingBoost(key);
    try {
      if (key === 'streakFreeze') {
        await buyStreakShield(token);
        toast('Streak Freeze activated');
      } else {
        await buyDoubleXpBoost(token);
        toast('Double XP activated for 24h');
      }
      confettiRef.current?.fire();
      await load(token);
    } catch (err) {
      toast(err instanceof ApiRequestError ? err.message : 'Could not activate that boost.');
    } finally {
      setBuyingBoost(null);
    }
  };

  const handleLockedSkin = () => {
    toast('That skin is Pro-exclusive. Upgrade to unlock it.');
    openProUpgrade(navigation, 'shop-skin');
  };

  // Real Paystack checkout (Task #26): opens the hosted checkout page in the system browser,
  // then refresh() verifies + credits leaves once the user returns to this screen.
  const handleBuyLeaves = async (packCode: string) => {
    if (!token || token === 'guest' || buyingPack) {
      if (token === 'guest') toast('Create an account to buy leaves.');
      return;
    }
    setBuyingPack(packCode);
    try {
      const url = await startLeafCheckout(token, packCode);
      await Linking.openURL(url);
    } catch (err) {
      toast(err instanceof ApiRequestError ? err.message : 'Could not start checkout.');
    } finally {
      setBuyingPack(null);
    }
  };

  return (
    <View style={styles.flex}>
      <ScrollView style={styles.container} contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xxxl }]}>
        <View style={styles.header}>
          <ScreenHeader
            title="Tree Shop"
            onClose={() => navigation.goBack()}
            rightSlot={
              <Pressable
                onPress={() => navigation.navigate('PurchaseHistory')}
                style={styles.historyBtn}
                accessibilityRole="button"
                accessibilityLabel="Purchase history"
                hitSlop={8}
              >
                <Ionicons name="receipt-outline" size={18} color={colors.ink} />
              </Pressable>
            }
          />
        </View>

        <View style={styles.balanceRow}>
          <View style={styles.leafBalance}>
            <Ionicons name="leaf" size={15} color={colors.sage} />
            <Text style={styles.leafBalanceText}>{leafBalance} leaves</Text>
          </View>
        </View>

        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>Tree skins</Text>
          <Text style={styles.sectionSub}>Change how your wellness tree looks</Text>
        </View>
        <View style={styles.skinGrid}>
          {skins.map((skin) => (
            <SkinTile
              key={skin.code}
              skin={skin}
              locked={skin.proOnly && !isPro}
              onPress={() => handleEquip(skin.code)}
              onLockedPress={handleLockedSkin}
            />
          ))}
          {skins.length === 0 && <Text style={styles.emptyText}>No skins available yet.</Text>}
        </View>

        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>Boosts</Text>
          <Text style={styles.sectionSub}>Temporary power-ups for your streak and XP</Text>
        </View>
        {BOOSTS.map((boost) => {
          const isActive = boost.key === 'streakFreeze' ? hasStreakShield : doubleXpActive;
          const isBuying = buyingBoost === boost.key;
          return (
            <Card key={boost.key} style={styles.boostCard}>
              <View style={[styles.boostIconWrap, { backgroundColor: boost.tint }]}>
                <Ionicons name={boost.icon} size={20} color={boost.iconColor} />
              </View>
              <View style={styles.flex}>
                <Text style={styles.boostName}>{boost.name}</Text>
                <Text style={styles.boostSub}>{boost.sub}</Text>
              </View>
              {isActive ? (
                <View style={styles.boostActivePill}>
                  <Ionicons name="checkmark-circle" size={14} color={colors.sage} />
                  <Text style={styles.boostActiveTxt}>Active</Text>
                </View>
              ) : (
                <Pressable
                  style={[styles.boostBuyBtn, buyingBoost !== null && styles.boostBuyBtnDisabled]}
                  disabled={buyingBoost !== null}
                  onPress={() => handleBuyBoost(boost.key)}
                >
                  {isBuying ? (
                    <Text style={styles.boostBuyBtnTxt}>Activating…</Text>
                  ) : (
                    <>
                      <Ionicons name="leaf" size={13} color="#FFFFFF" />
                      <Text style={styles.boostBuyBtnTxt}>{boost.cost}</Text>
                    </>
                  )}
                </Pressable>
              )}
            </Card>
          );
        })}

        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>Get more leaves</Text>
          <Text style={styles.sectionSub}>Top up your leaf balance</Text>
        </View>
        <View style={styles.leafGrid}>
          {leafPacks.map((pack) => (
            <Pressable
              key={pack.code}
              style={styles.leafPack}
              onPress={() => handleBuyLeaves(pack.code)}
              disabled={buyingPack !== null}
            >
              <Ionicons name="leaf" size={22} color={colors.sage} style={styles.leafPackIcon} />
              <Text style={styles.leafAmt}>{pack.leaves}</Text>
              <Text style={styles.leafCost}>
                {buyingPack === pack.code ? 'Opening…' : formatPesewas(pack.pricePesewas)}
              </Text>
            </Pressable>
          ))}
          {leafPacks.length === 0 && <Text style={styles.emptyText}>No leaf packs available yet.</Text>}
        </View>
      </ScrollView>
      <ConfettiBurst ref={confettiRef} />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  header: { marginBottom: -spacing.md },
  balanceRow: { alignItems: 'flex-end', marginBottom: spacing.sm },
  historyBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  leafBalance: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.sageSoft,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.pill,
  },
  leafBalanceText: { fontFamily: fonts.bodyBold, fontSize: fontSizes.sm, color: colors.sage },
  sectionHead: { marginTop: spacing.lg, marginBottom: spacing.sm },
  sectionTitle: { fontFamily: fonts.bodyBold, fontSize: fontSizes.md, color: colors.ink },
  sectionSub: { fontFamily: fonts.bodyMedium, fontSize: fontSizes.xs, color: colors.inkFaint, marginTop: 2 },

  // Skin grid - two columns, generous card size (see SkinTile's comment for the layout bug this
  // wrapper structure fixes).
  skinGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  skinTileWrap: { width: '48%' },
  skinTile: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.line,
    borderRadius: radii.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    position: 'relative',
  },
  skinTileActive: { borderColor: colors.sage, backgroundColor: colors.sageSoft },
  skinTileLocked: { backgroundColor: colors.sunSoft, borderColor: colors.sunSoft },
  skinLockBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: colors.sun,
    borderRadius: radii.pill,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  skinLockBadgeTxt: { fontFamily: fonts.bodyBold, fontSize: 8, color: colors.surface },
  skinEquippedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.sage,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skinPreview: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  skinPreviewActive: { backgroundColor: colors.surface },
  skinPreviewLocked: { opacity: 0.6 },
  skinEmoji: { fontSize: 32 },
  skinName: { fontFamily: fonts.bodyBold, fontSize: fontSizes.sm, color: colors.ink, textAlign: 'center' },
  skinStatusActive: { fontFamily: fonts.bodyBold, fontSize: fontSizes.xs, color: colors.sage, marginTop: 5 },
  skinStatusLocked: { fontFamily: fonts.bodyBold, fontSize: fontSizes.xs, color: colors.sunText, marginTop: 5 },
  skinStatusOwned: { fontFamily: fonts.bodyMedium, fontSize: fontSizes.xs, color: colors.inkFaint, marginTop: 5 },
  leafCostRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 5 },
  leafCostText: { fontFamily: fonts.bodyBold, fontSize: fontSizes.xs, color: colors.inkFaint },
  leafCostTextActive: { color: colors.sage },

  emptyText: { fontFamily: fonts.bodyMedium, fontSize: fontSizes.sm, color: colors.inkSoft },

  boostCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  boostIconWrap: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  boostName: { fontFamily: fonts.bodyBold, fontSize: fontSizes.sm, color: colors.ink },
  boostSub: { fontFamily: fonts.bodyMedium, fontSize: 10.5, color: colors.inkSoft, marginTop: 2 },
  boostActivePill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.sageSoft, borderRadius: radii.pill,
    paddingHorizontal: 12, paddingVertical: 7,
  },
  boostActiveTxt: { fontFamily: fonts.bodyBold, fontSize: fontSizes.xs, color: colors.sage },
  boostBuyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: colors.coral, borderRadius: radii.pill,
    paddingHorizontal: 16, paddingVertical: 11,
  },
  boostBuyBtnDisabled: { opacity: 0.45 },
  boostBuyBtnTxt: { fontFamily: fonts.bodyBold, fontSize: fontSizes.sm, color: '#FFFFFF' },

  leafGrid: { flexDirection: 'row', gap: spacing.sm },
  leafPack: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.line,
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  leafPackIcon: { marginBottom: 4 },
  leafAmt: { fontFamily: fonts.bodyBold, fontSize: fontSizes.sm, color: colors.sage },
  leafCost: { fontFamily: fonts.bodyBold, fontSize: 10.5, color: colors.inkSoft, marginTop: 3 },
});
