import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Linking } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { usePaymentsStore } from '@/state/usePaymentsStore';
import { useAuthStore } from '@/state/useAuthStore';
import { useToast } from '@/state/useToast';
import { ApiRequestError } from '@/api/client';
import { colors, fonts, fontSizes, radii, spacing } from '@/theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'Pro'>;

const FEATURES = [
  { icon: '✨', text: 'Unlimited AI Coach conversations' },
  { icon: '🧘', text: 'Full meditation & soundscape library' },
  { icon: '📊', text: 'Deep wellness history & analytics' },
  { icon: '🩺', text: 'Priority counsellor booking' },
  { icon: '🎨', text: 'Exclusive tree skins' },
  { icon: '🎮', text: 'Exclusive calming games' },
];

function formatPrice(pesewas: number): string {
  return `₵${Math.round(pesewas / 100)}`;
}

function formatDate(iso: string | null): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function ProScreen({ navigation }: Props) {
  const plans = usePaymentsStore((s) => s.plans);
  const subscription = usePaymentsStore((s) => s.subscription);
  const load = usePaymentsStore((s) => s.load);
  const startTrial = usePaymentsStore((s) => s.startTrial);
  const startCheckout = usePaymentsStore((s) => s.startCheckout);
  const verifyPending = usePaymentsStore((s) => s.verifyPending);
  const token = useAuthStore((s) => s.token);
  const toast = useToast();

  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);

  const refresh = useCallback(() => {
    if (!token) return;
    // Resolve any checkout started before this screen lost focus (Task #26) before loading, so a
    // just-completed subscribe/renew is reflected in the status card shown below.
    (async () => {
      try {
        const outcome = await verifyPending(token);
        if (outcome === 'success') {
          toast('You’re Pro — welcome aboard ✨');
        } else if (outcome === 'failed') {
          toast('That payment didn’t go through — you weren’t charged.');
        }
      } catch {
        // Verification failing shouldn't block the rest of the screen from loading
      }
      load(token).catch((err) => {
        toast(err instanceof ApiRequestError ? err.message : 'Could not load Pro plans.');
      });
    })();
  }, [token, load, verifyPending, toast]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const monthly = plans.find((p) => p.billingInterval === 'MONTH');
  const yearly = plans.find((p) => p.billingInterval === 'YEAR');
  const activeCode = selectedCode ?? yearly?.code ?? monthly?.code ?? null;

  // Computed from the real prices, not hardcoded - only shown when it's actually true.
  const yearlySavingsPct = useMemo(() => {
    if (!monthly || !yearly) return null;
    const annualizedMonthly = monthly.pricePesewas * 12;
    if (annualizedMonthly <= yearly.pricePesewas) return null;
    return Math.round(((annualizedMonthly - yearly.pricePesewas) / annualizedMonthly) * 100);
  }, [monthly, yearly]);

  // The backend allows exactly one FREE TRIAL per account ever (status starts non-null once used),
  // but paid checkout (subscribe / renew) is always available regardless of trial history.
  const neverSubscribed = subscription.status === null;

  const handleStartTrial = async () => {
    if (!token || !activeCode || starting) return;
    setStarting(true);
    try {
      await startTrial(token, activeCode);
      toast('Free trial started — enjoy Pro for 7 days ✨');
      navigation.goBack();
    } catch (err) {
      toast(err instanceof ApiRequestError ? err.message : 'Could not start your trial.');
    } finally {
      setStarting(false);
    }
  };

  // Real Paystack checkout (Task #26) - opens the hosted checkout page in the system browser,
  // then refresh() verifies + activates the subscription once the user returns to this screen.
  const handleSubscribe = async () => {
    if (!token || token === 'guest' || !activeCode || checkingOut) {
      if (token === 'guest') toast('Create an account to subscribe.');
      return;
    }
    setCheckingOut(true);
    try {
      const url = await startCheckout(token, activeCode);
      await Linking.openURL(url);
    } catch (err) {
      toast(err instanceof ApiRequestError ? err.message : 'Could not start checkout.');
    } finally {
      setCheckingOut(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ScreenHeader title="MoodMate Pro" onClose={() => navigation.goBack()} />

      <View style={styles.hero}>
        <Text style={styles.heroEmoji}>⭐</Text>
      </View>
      <Text style={styles.heroTitle}>Go deeper with Pro</Text>
      <Text style={styles.heroSub}>Unlock the full MoodMate experience</Text>

      {subscription.pro && (
        <Card tint="sage" style={styles.statusCard}>
          <Text style={styles.statusText}>
            {subscription.status === 'TRIALING'
              ? `✨ On your free trial — ends ${formatDate(subscription.trialEndsAt)}`
              : `✅ You're a Pro member — renews ${formatDate(subscription.currentPeriodEnd)}`}
          </Text>
        </Card>
      )}

      {!subscription.pro && !neverSubscribed && (
        <Card tint="sun" style={styles.statusCard}>
          <Text style={styles.statusText}>Your subscription has lapsed.</Text>
        </Card>
      )}

      <Card style={styles.featureCard}>
        {FEATURES.map((f, i) => (
          <View key={f.text} style={[styles.featureRow, i < FEATURES.length - 1 && styles.featureDivider]}>
            <View style={styles.featureIconWrap}>
              <Text style={styles.featureIcon}>{f.icon}</Text>
            </View>
            <Text style={styles.featureText}>{f.text}</Text>
          </View>
        ))}
      </Card>

      {!subscription.pro && (monthly || yearly) && (
        <>
          <View style={styles.planRow}>
            {monthly && (
              <Pressable
                style={[styles.planCard, activeCode === monthly.code && styles.planCardSel]}
                onPress={() => setSelectedCode(monthly.code)}
              >
                <Text style={styles.planName}>Monthly</Text>
                <Text style={styles.planPrice}>
                  {formatPrice(monthly.pricePesewas)}
                  <Text style={styles.planUnit}>/mo</Text>
                </Text>
              </Pressable>
            )}
            {yearly && (
              <Pressable
                style={[styles.planCard, activeCode === yearly.code && styles.planCardSel]}
                onPress={() => setSelectedCode(yearly.code)}
              >
                {yearlySavingsPct !== null && (
                  <View style={styles.planBadge}>
                    <Text style={styles.planBadgeText}>Save {yearlySavingsPct}%</Text>
                  </View>
                )}
                <Text style={styles.planName}>Yearly</Text>
                <Text style={styles.planPrice}>
                  {formatPrice(yearly.pricePesewas)}
                  <Text style={styles.planUnit}>/yr</Text>
                </Text>
              </Pressable>
            )}
          </View>

          <Button
            label={checkingOut ? 'Opening…' : neverSubscribed ? 'Subscribe now' : 'Resubscribe'}
            variant="primary"
            fullWidth
            disabled={checkingOut || starting || !activeCode}
            onPress={handleSubscribe}
          />

          {neverSubscribed && (
            <>
              <Button
                label={starting ? 'Starting…' : 'Start 7-day free trial'}
                variant="ghost"
                fullWidth
                disabled={starting || checkingOut || !activeCode}
                onPress={handleStartTrial}
                style={styles.trialButton}
              />
              <Text style={styles.fineprint}>No payment needed for the trial · one trial per account</Text>
            </>
          )}
        </>
      )}
    </ScrollView>
  );
}

const HERO_SIZE = 74;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  hero: {
    width: HERO_SIZE,
    height: HERO_SIZE,
    borderRadius: HERO_SIZE / 2,
    backgroundColor: colors.sunSoft,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginTop: spacing.xs,
  },
  heroEmoji: { fontSize: 32 },
  heroTitle: {
    fontFamily: fonts.display,
    fontSize: fontSizes.xl,
    color: colors.ink,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  heroSub: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.xs,
    color: colors.inkSoft,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: spacing.md,
  },
  statusCard: { marginBottom: spacing.md },
  statusText: { fontFamily: fonts.bodyBold, fontSize: fontSizes.sm, color: colors.ink },
  featureCard: { paddingVertical: 4 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm + 2, paddingVertical: 9 },
  featureDivider: { borderBottomWidth: 1, borderBottomColor: colors.line },
  featureIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: colors.sunSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureIcon: { fontSize: 14 },
  featureText: { fontFamily: fonts.bodyMedium, fontSize: fontSizes.sm, color: colors.ink, flex: 1 },
  planRow: { flexDirection: 'row', gap: spacing.sm, marginVertical: spacing.lg },
  planCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.line,
    borderRadius: radii.md,
    paddingVertical: spacing.md + 2,
    alignItems: 'center',
    position: 'relative',
  },
  planCardSel: { borderColor: colors.coral, backgroundColor: colors.coralSoft },
  planBadge: {
    position: 'absolute',
    top: -9,
    backgroundColor: colors.sun,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radii.pill,
  },
  planBadgeText: { fontFamily: fonts.bodyBold, fontSize: 8.5, color: colors.sunText },
  planName: { fontFamily: fonts.bodyBold, fontSize: fontSizes.xs, color: colors.inkSoft, marginBottom: 4 },
  planPrice: { fontFamily: fonts.bodyBold, fontSize: fontSizes.lg, color: colors.ink },
  planUnit: { fontFamily: fonts.bodyMedium, fontSize: 10, color: colors.inkFaint },
  trialButton: { marginTop: spacing.sm },
  fineprint: {
    fontFamily: fonts.bodyMedium,
    fontSize: 10,
    color: colors.inkFaint,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});
