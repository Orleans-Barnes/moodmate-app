import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps, NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { ProfileSetupStackParamList, RootStackParamList } from '@/navigation/types';
import { colors, spacing, fonts, fontSizes } from '@/theme/tokens';
import { useAuthStore } from '@/state/useAuthStore';
import { completeWellnessOnboarding } from '@/api/profileSetup';

type Props = NativeStackScreenProps<ProfileSetupStackParamList, 'Preparing'>;

const STEPS = ['Saving your goals', 'Tuning your check-ins', 'Setting up your wellness space'];

/**
 * Final screen: calls POST .../complete (requires >=1 goal already saved — guaranteed since
 * WellnessGoalsScreen won't let you continue with zero selected), plays a short multi-checkmark
 * "preparing" beat per the Phase 1C-iii UX direction, then lands on the dashboard. Uses `replace`
 * (not `navigate`) so onboarding never sits in the back stack.
 */
export function PreparingScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const token = useAuthStore((s) => s.token);
  const [doneStep, setDoneStep] = useState(-1);
  const [error, setError] = useState<string | null>(null);
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fade, { toValue: 1, duration: 400, useNativeDriver: true }).start();

    let cancelled = false;

    const run = async () => {
      if (!token) return;
      try {
        await completeWellnessOnboarding(token);
        for (let i = 0; i < STEPS.length; i++) {
          if (cancelled) return;
          await new Promise((r) => setTimeout(r, 550));
          if (cancelled) return;
          setDoneStep(i);
        }
        await new Promise((r) => setTimeout(r, 450));
        if (!cancelled) {
          // 'Main' lives on the root stack, not this nested ProfileSetup stack — go through the
          // parent navigator so the type-checked route name resolves correctly.
          navigation.getParent<NativeStackNavigationProp<RootStackParamList>>()?.replace('Main');
        }
      } catch {
        if (!cancelled) setError("Couldn't finish setup — check your connection and try again.");
      }
    };

    run();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const retry = () => {
    setError(null);
    setDoneStep(-1);
    navigation.replace('Preparing');
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top + spacing.xxxl, paddingBottom: insets.bottom + spacing.xl }]}>
      <Animated.View style={[styles.content, { opacity: fade }]}>
        <View style={styles.iconWrap}>
          <Ionicons name="sparkles" size={30} color={colors.sage} />
        </View>
        <Text style={styles.title}>Your wellness space is ready</Text>
        <View style={styles.stepsWrap}>
          {STEPS.map((label, i) => (
            <View key={label} style={styles.stepRow}>
              <View style={[styles.checkDot, i <= doneStep && styles.checkDotDone]}>
                {i <= doneStep && <Ionicons name="checkmark" size={13} color="#FFFFFF" />}
              </View>
              <Text style={[styles.stepLabel, i <= doneStep && styles.stepLabelDone]}>{label}</Text>
            </View>
          ))}
        </View>
        {error ? (
          <View style={styles.errorWrap}>
            <Text style={styles.error}>{error}</Text>
            <Text style={styles.retry} onPress={retry}>Tap to retry</Text>
          </View>
        ) : null}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: spacing.xl,
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
  },
  iconWrap: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: colors.sageSoft,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: fontSizes.xxl,
    color: colors.ink,
    textAlign: 'center',
    marginBottom: spacing.xxl,
  },
  stepsWrap: {
    alignSelf: 'stretch',
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  checkDot: {
    width: 20, height: 20, borderRadius: 10, marginRight: 4,
    borderWidth: 1.5, borderColor: colors.line,
    alignItems: 'center', justifyContent: 'center',
  },
  checkDotDone: {
    backgroundColor: colors.sage,
    borderColor: colors.sage,
  },
  stepLabel: {
    fontFamily: fonts.body,
    fontSize: fontSizes.md,
    color: colors.inkFaint,
  },
  stepLabelDone: {
    fontFamily: fonts.bodyMedium,
    color: colors.ink,
  },
  errorWrap: {
    marginTop: spacing.xxl,
    alignItems: 'center',
  },
  error: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.sm,
    color: colors.coralDeep,
    textAlign: 'center',
  },
  retry: {
    marginTop: spacing.sm,
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.sm,
    color: colors.coral,
  },
});
