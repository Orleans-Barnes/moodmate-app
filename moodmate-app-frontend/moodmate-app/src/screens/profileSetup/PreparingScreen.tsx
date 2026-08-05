import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps, NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { ProfileSetupStackParamList, RootStackParamList } from '@/navigation/types';
import { spacing, fonts, fontSizes, calm } from '@/theme/tokens';
import { useAuthStore } from '@/state/useAuthStore';
import { completeWellnessOnboarding } from '@/api/profileSetup';
import { TreeBlob } from '@/components/illustrations/TreeBlob';

type Props = NativeStackScreenProps<ProfileSetupStackParamList, 'Preparing'>;

const STEPS = ['Saving your goals', 'Tuning your check-ins', 'Setting up your wellness space'];

/**
 * Final screen — Calm Forest "12 You're All Set". Calls POST .../complete (requires >=1 goal
 * already saved — guaranteed since WellnessGoalsScreen won't let you continue with zero
 * selected), plays the checklist beat, then lands on the dashboard via `replace` (not
 * `navigate`) so onboarding never sits in the back stack.
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
          navigation.getParent<NativeStackNavigationProp<RootStackParamList>>()?.replace('Main');
        }
      } catch {
        if (!cancelled) setError("Couldn't finish setup — check your connection and try again.");
      }
    };

    run();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const retry = () => {
    setError(null);
    setDoneStep(-1);
    navigation.replace('Preparing');
  };

  return (
    <View style={[s.root, { paddingTop: insets.top + spacing.xxxl, paddingBottom: insets.bottom + spacing.xl }]}>
      <Animated.View style={[s.content, { opacity: fade }]}>
        <View style={s.treeWrap}>
          <TreeBlob size={200} />
        </View>
        <Text style={s.title}>Your tree is planted</Text>
        <Text style={s.sub}>Check in daily and watch it grow.</Text>

        <View style={s.stepsWrap}>
          {STEPS.map((label, i) => (
            <View key={label} style={s.stepRow}>
              <View style={[s.checkDot, i <= doneStep && s.checkDotDone]}>
                {i <= doneStep && <Ionicons name="checkmark" size={13} color="#FFFFFF" />}
              </View>
              <Text style={[s.stepLabel, i <= doneStep && s.stepLabelDone]}>{label}</Text>
            </View>
          ))}
        </View>

        {error ? (
          <View style={s.errorWrap}>
            <Text style={s.error}>{error}</Text>
            <Text style={s.retry} onPress={retry}>Tap to retry</Text>
          </View>
        ) : null}
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: calm.forest,
    paddingHorizontal: spacing.xl,
    justifyContent: 'center',
  },
  content: { alignItems: 'center' },
  treeWrap: {
    width: 220, height: 220, borderRadius: 110,
    backgroundColor: calm.forestPanel,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.xxl,
  },
  title: {
    fontFamily: fonts.displayExtraBold,
    fontSize: fontSizes.xxl + 6,
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: -0.45,
  },
  sub: {
    fontFamily: fonts.body,
    fontSize: fontSizes.md - 1,
    color: calm.mutedOnDark,
    textAlign: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.xxl,
  },
  stepsWrap: { alignSelf: 'stretch' },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  checkDot: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.24)',
    alignItems: 'center', justifyContent: 'center',
  },
  checkDotDone: { backgroundColor: calm.primary, borderColor: calm.primary },
  stepLabel: { fontFamily: fonts.body, fontSize: fontSizes.md - 1, color: calm.mutedOnDark },
  stepLabelDone: { fontFamily: fonts.bodyMedium, color: '#FFFFFF' },
  errorWrap: { marginTop: spacing.xxl, alignItems: 'center' },
  error: { fontFamily: fonts.bodyMedium, fontSize: fontSizes.sm, color: '#FFD4C7', textAlign: 'center' },
  retry: { marginTop: spacing.sm, fontFamily: fonts.bodyBold, fontSize: fontSizes.sm, color: '#FFFFFF' },
});
