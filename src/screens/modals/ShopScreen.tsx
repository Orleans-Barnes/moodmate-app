import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Animated, Linking } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { ConfettiBurst, ConfettiHandle } from '@/components/Confetti';
import { useWalletStore } from '@/state/useWalletStore';
import { useWellnessStore } from '@/state/useWellnessStore';
import { useAuthStore } from '@/state/useAuthStore';
import { usePaymentsStore } from '@/state/usePaymentsStore';
import { useToast } from '@/state/useToast';
import { ApiRequestError } from '@/api/client';
import type { SkinView } from '@/api/types';
import { colors, fonts, fontSizes, radii, spacing } from '@/theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'Shop'>;

const BOOSTS = [
  { key: 'streakFreeze' as const, icon: '🧊', name: 'Streak Freeze', sub: 'Protects your streak for one missed day', cost: 50 },
  { key: 'doubleXp' as const, icon: '⚡', name: 'Double XP (24h)', sub: 'Earn 2× tree XP from every habit today', cost: 40 },
];

function formatPesewas(pesewas: number): string {
  return `₵${Math.round(pesewas / 100)}`;
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
    <Animated.View
      style={{
        flex: 1,
        transform: [{ translateX: shake.interpolate({ inputRange: [-1, 1], outputRange: [-4, 4] }) }],
      }}
    >
      <Pressable
        onPress={handlePress}
        style={[styles.skinTile, skin.equipped && styles.skinTileActive, locked && styles.skinTileLocked]}
      >
        {locked && (
          <View style={styles.skinLockBadge}>
            <Text style={styles.skinLockBadgeTxt}>PRO</Text>
          </View>
        )}
        <Text style={[styles.skinEmoji, locked && styles.skinEmojiLocked]}>{skin.emoji}</Text>
        <Text style={styles.skinName}>{skin.name}</Text>
        <Text style={[styles.skinPrice, skin.equipped && styles.skinPriceActive]}>
          {locked ? 'Pro only' : skin.equipped ? 'Equipped' : skin.cost > 0 ? (skin.owned ? 'Owned' : `🌱 ${skin.cost}`) : 'Free'}
        </Text>
      </Pressable>
    </Animated.View>
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
          toast('Leaves added 🌱');
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
      toast('Tree skin updated 🌿');
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
        toast('Streak Freeze activated 🥶');
      } else {
        await buyDoubleXpBoost(token);
        toast('Double XP activated for 24h ⚡');
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
    navigation.navigate('Pro');
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
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <ScreenHeader title="Tree Shop" onClose={() => navigation.goBack()} />
        </View>
        <View style={styles.balanceRow}>
          <View style={styles.leafBalance}>
            <Text style={styles.leafBalanceText}>🌱 {leafBalance}</Text>
          </View>
        </View>

        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>Tree skins</Text>
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
        </View>
        {BOOSTS.map((boost) => {
          const isActive = boost.key === 'streakFreeze' ? hasStreakShield : doubleXpActive;
          const isBuying = buyingBoost === boost.key;
          return (
            <Card key={boost.key} style={styles.boostCard}>
              <Text style={styles.boostIcon}>{boost.icon}</Text>
              <View style={styles.flex}>
                <Text style={styles.boostName}>{boost.name}</Text>
                <Text style={styles.boostSub}>{boost.sub}</Text>
              </View>
              <Button
                label={isActive ? 'Active' : isBuying ? 'Activating…' : `🌱 ${boost.cost}`}
                variant="primary"
                disabled={isActive || buyingBoost !== null}
                onPress={() => handleBuyBoost(boost.key)}
              />
            </Card>
          );
        })}

        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>Get more leaves</Text>
        </View>
        <View style={styles.leafGrid}>
          {leafPacks.map((pack) => (
            <Pressable
              key={pack.code}
              style={styles.leafPack}
              onPress={() => handleBuyLeaves(pack.code)}
              disabled={buyingPack !== null}
            >
              <Text style={styles.leafAmt}>🌱 {pack.leaves}</Text>
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
  leafBalance: { backgroundColor: colors.sageSoft, paddingHorizontal: 12, paddingVertical: 5, borderRadius: radii.pill },
  leafBalanceText: { fontFamily: fonts.bodyBold, fontSize: fontSizes.sm, color: colors.sage },
  sectionHead: { marginTop: spacing.md, marginBottom: spacing.sm },
  sectionTitle: { fontFamily: fonts.bodyBold, fontSize: fontSizes.base + 2, color: colors.ink },
  skinGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  skinTile: {
    width: '31%',
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.line,
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    position: 'relative',
  },
  skinTileActive: { borderColor: colors.sage, backgroundColor: colors.sageSoft },
  skinTileLocked: { backgroundColor: colors.sunSoft, borderColor: colors.sunSoft },
  skinLockBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: colors.sun,
    borderRadius: radii.pill,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  skinLockBadgeTxt: { fontFamily: fonts.bodyBold, fontSize: 8, color: colors.surface },
  skinEmoji: { fontSize: 24, marginBottom: 5 },
  skinEmojiLocked: { opacity: 0.5 },
  skinName: { fontFamily: fonts.bodyBold, fontSize: 10.5, color: colors.ink },
  skinPrice: { fontFamily: fonts.bodyBold, fontSize: 9, color: colors.inkFaint, marginTop: 3 },
  skinPriceActive: { color: colors.sage },
  emptyText: { fontFamily: fonts.bodyMedium, fontSize: fontSizes.sm, color: colors.inkSoft },
  boostCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  boostIcon: { fontSize: 22 },
  boostName: { fontFamily: fonts.bodyBold, fontSize: fontSizes.sm, color: colors.ink },
  boostSub: { fontFamily: fonts.bodyMedium, fontSize: 10.5, color: colors.inkSoft, marginTop: 2 },
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
  leafAmt: { fontFamily: fonts.bodyBold, fontSize: fontSizes.sm, color: colors.sage },
  leafCost: { fontFamily: fonts.bodyBold, fontSize: 10.5, color: colors.inkSoft, marginTop: 3 },
});
