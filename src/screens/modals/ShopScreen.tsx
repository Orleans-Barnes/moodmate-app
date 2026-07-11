import React, { useCallback, useRef } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Animated } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { ConfettiBurst, ConfettiHandle } from '@/components/Confetti';
import { useWalletStore } from '@/state/useWalletStore';
import { useAuthStore } from '@/state/useAuthStore';
import { useToast } from '@/state/useToast';
import { ApiRequestError } from '@/api/client';
import type { SkinView } from '@/api/types';
import { colors, fonts, fontSizes, radii, spacing } from '@/theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'Shop'>;

const BOOSTS = [
  { icon: '🧊', name: 'Streak Freeze', sub: 'Protects your streak for one missed day', cost: 50 },
  { icon: '⚡', name: 'Double XP (24h)', sub: 'Earn 2× tree XP from every habit today', cost: 40 },
];

const LEAF_PACKS: { amount: number; price: string }[] = [
  { amount: 100, price: '₵5' },
  { amount: 300, price: '₵12' },
  { amount: 700, price: '₵25' },
];

function SkinTile({
  skin,
  onPress,
}: {
  skin: SkinView;
  onPress: () => Promise<boolean>; // resolves true if purchase/equip succeeded
}) {
  const shake = useRef(new Animated.Value(0)).current;

  const handlePress = async () => {
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
        style={[styles.skinTile, skin.equipped && styles.skinTileActive]}
      >
        <Text style={styles.skinEmoji}>{skin.emoji}</Text>
        <Text style={styles.skinName}>{skin.name}</Text>
        <Text style={[styles.skinPrice, skin.equipped && styles.skinPriceActive]}>
          {skin.equipped ? 'Equipped' : skin.cost > 0 ? (skin.owned ? 'Owned' : `🌱 ${skin.cost}`) : 'Free'}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

export function ShopScreen({ navigation }: Props) {
  const leafBalance = useWalletStore((s) => s.leafBalance);
  const skins = useWalletStore((s) => s.skins);
  const load = useWalletStore((s) => s.load);
  const equip = useWalletStore((s) => s.equip);
  const token = useAuthStore((s) => s.token);
  const toast = useToast();
  const confettiRef = useRef<ConfettiHandle>(null);

  const refresh = useCallback(() => {
    if (!token) return;
    load(token).catch((err) => {
      toast(err instanceof ApiRequestError ? err.message : 'Could not load the shop.');
    });
  }, [token, load, toast]);

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

  // Boosts have no backend support yet (com.moodmate.backend.wallet has no boost/streak-freeze
  // modeling) - kept visible as a preview but disabled rather than faking a leaf spend against
  // the now-real balance above.
  const handleBuyBoost = () => {
    toast('Boosts aren’t available yet — coming soon 🌱');
  };

  // Leaf packs are real purchases (com.moodmate.backend.payments) but checkout isn't wired yet -
  // that's the Payments/Pro task. No local balance mutation here; the real flow will refresh
  // leafBalance from the server once checkout exists.
  const handleBuyLeaves = () => {
    toast('Leaf pack purchases are coming soon 🌱');
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
            <SkinTile key={skin.code} skin={skin} onPress={() => handleEquip(skin.code)} />
          ))}
          {skins.length === 0 && <Text style={styles.emptyText}>No skins available yet.</Text>}
        </View>

        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>Boosts</Text>
        </View>
        {BOOSTS.map((boost) => (
          <Card key={boost.name} style={styles.boostCard}>
            <Text style={styles.boostIcon}>{boost.icon}</Text>
            <View style={styles.flex}>
              <Text style={styles.boostName}>{boost.name}</Text>
              <Text style={styles.boostSub}>{boost.sub}</Text>
            </View>
            <Button label={`🌱 ${boost.cost}`} variant="primary" onPress={handleBuyBoost} />
          </Card>
        ))}

        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>Get more leaves</Text>
        </View>
        <View style={styles.leafGrid}>
          {LEAF_PACKS.map((pack) => (
            <Pressable key={pack.amount} style={styles.leafPack} onPress={handleBuyLeaves}>
              <Text style={styles.leafAmt}>🌱 {pack.amount}</Text>
              <Text style={styles.leafCost}>{pack.price}</Text>
            </Pressable>
          ))}
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
  },
  skinTileActive: { borderColor: colors.sage, backgroundColor: colors.sageSoft },
  skinEmoji: { fontSize: 24, marginBottom: 5 },
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
