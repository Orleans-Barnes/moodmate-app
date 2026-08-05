import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Button } from '@/components/Button';
import { ConfettiBurst, ConfettiHandle } from '@/components/Confetti';
import { useGamificationStore, XP_VALUES } from '@/state/useGamificationStore';
import { useAuthStore } from '@/state/useAuthStore';
import { useWellnessStore } from '@/state/useWellnessStore';
import { hapticLight, hapticSuccess } from '@/utils/haptics';
import { GROUNDING_SENSE_ICONS } from '@/theme/iconMap';
import { colors, fonts, fontSizes, radii, spacing, shadow, calm } from '@/theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'Grounding'>;

const STEPS = [
  {
    sense: 'See',
    ionIcon: GROUNDING_SENSE_ICONS.See,
    count: 5,
    color: colors.blueSoft,
    border: colors.blue,
    prompt: 'Look around. Name 5 things you can see right now.',
    placeholders: ['A door', 'A window', 'Your hands', 'A light', 'Something blue'],
  },
  {
    sense: 'Touch',
    ionIcon: GROUNDING_SENSE_ICONS.Touch,
    count: 4,
    color: colors.sageSoft,
    border: colors.sage,
    prompt: 'Notice 4 things you can physically feel or touch.',
    placeholders: ['Your chair', 'Your clothes', 'The floor', 'Your phone'],
  },
  {
    sense: 'Hear',
    ionIcon: GROUNDING_SENSE_ICONS.Hear,
    count: 3,
    color: colors.lavenderSoft,
    border: colors.lavender,
    prompt: 'Listen carefully. Name 3 sounds you can hear.',
    placeholders: ['Traffic outside', 'Your breathing', 'A fan'],
  },
  {
    sense: 'Smell',
    ionIcon: GROUNDING_SENSE_ICONS.Smell,
    count: 2,
    color: colors.sunSoft,
    border: colors.sun,
    prompt: 'Notice 2 things you can smell (or like the smell of).',
    placeholders: ['Fresh air', 'Coffee'],
  },
  {
    sense: 'Taste',
    ionIcon: GROUNDING_SENSE_ICONS.Taste,
    count: 1,
    color: colors.coralSoft,
    border: colors.coral,
    prompt: 'Name 1 thing you can taste right now.',
    placeholders: ['Water', 'Mint'],
  },
] as const;

const GROUNDING_XP = XP_VALUES.breathing; // same XP as a session activity

export function GroundingScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [stepIndex, setStepIndex] = useState(0);
  const [checked, setChecked]     = useState<boolean[]>([]);
  const [done, setDone]           = useState(false);
  const confettiRef = useRef<ConfettiHandle>(null);

  const isGuest      = useAuthStore((s) => s.user?.guest ?? false);
  const awardXp      = useGamificationStore((s) => s.awardXp);
  const recordAction = useGamificationStore((s) => s.recordAction);
  const streakCount  = useWellnessStore((s) => s.streakCount);

  // Fire confetti when done
  useEffect(() => {
    if (done) {
      confettiRef.current?.fire();
      if (!isGuest) {
        awardXp(GROUNDING_XP, streakCount);
        recordAction('breathing', streakCount); // grounding counts as a breathing-type activity
      }
    }
  }, [done]);

  const step = STEPS[stepIndex];

  const toggle = (i: number) => {
    hapticLight();
    setChecked((prev) => {
      const next = [...prev];
      next[i] = !next[i];
      return next;
    });
  };

  const checkedCount = checked.filter(Boolean).length;
  const canAdvance   = checkedCount >= step.count;

  const advance = () => {
    hapticSuccess();
    if (stepIndex < STEPS.length - 1) {
      setStepIndex((s) => s + 1);
      setChecked([]);
    } else {
      setDone(true);
    }
  };

  // ── Done / celebration screen ─────────────────────────────────────────
  if (done) {
    return (
      <View style={[styles.container, { paddingBottom: insets.bottom + spacing.lg }]}>
        <ScreenHeader title="Grounding" onClose={() => navigation.goBack()} />
        <ConfettiBurst ref={confettiRef} />
        <View style={styles.doneCenter}>
          <View style={styles.doneEmojiWrap}>
            <Ionicons name="leaf" size={40} color={colors.coral} />
          </View>
          <Text style={styles.doneTitle}>You're grounded.</Text>
          <Text style={styles.doneSub}>
            Taking a moment to notice your surroundings calms the nervous system. You did that.
          </Text>

          {/* 5 senses recap */}
          <View style={styles.recapRow}>
            {STEPS.map((s) => (
              <View key={s.sense} style={[styles.recapPill, { backgroundColor: s.color }]}>
                <Ionicons name={s.ionIcon} size={18} color={s.border} />
                <Text style={[styles.recapLabel, { color: s.border }]}>{s.sense}</Text>
              </View>
            ))}
          </View>

          {!isGuest && (
            <View style={styles.xpPill}>
              <Text style={styles.xpText}>+{GROUNDING_XP} XP earned</Text>
            </View>
          )}

          <Button
            label="Done"
            variant="primary"
            fullWidth
            onPress={() => navigation.goBack()}
            style={{ marginTop: spacing.md }}
          />
        </View>
      </View>
    );
  }

  // ── Exercise screen ───────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <ScreenHeader title="5-4-3-2-1 Grounding" onClose={() => navigation.goBack()} />

      {/* Progress dots */}
      <View style={styles.progressRow}>
        {STEPS.map((s, i) => (
          <View
            key={s.sense}
            style={[
              styles.dot,
              i < stepIndex && styles.dotDone,
              i === stepIndex && { backgroundColor: step.border, width: 24 },
            ]}
          />
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Step header */}
        <View style={[styles.senseCard, { backgroundColor: step.color, borderColor: step.border }]}>
          <Ionicons name={step.ionIcon} size={32} color={step.border} />
          <View style={styles.senseTextWrap}>
            <Text style={styles.senseCount}>{step.count} things you can</Text>
            <Text style={[styles.senseName, { color: step.border }]}>{step.sense}</Text>
          </View>
        </View>

        <Text style={styles.prompt}>{step.prompt}</Text>
        <Text style={styles.promptSub}>Tap each one once you've noticed it.</Text>

        <View style={styles.itemsGrid}>
          {Array.from({ length: step.count }).map((_, i) => (
            <Pressable
              key={i}
              style={[
                styles.itemTile,
                checked[i] && { backgroundColor: step.color, borderColor: step.border },
              ]}
              onPress={() => toggle(i)}
              accessibilityRole="checkbox"
              accessibilityLabel={`Item ${i + 1}: ${step.placeholders[i]}`}
              accessibilityState={{ checked: !!checked[i] }}
            >
              {checked[i]
                ? <Ionicons name="checkmark-circle" size={22} color={colors.coral} />
                : <Text style={styles.itemNum}>{i + 1}</Text>
              }
              <Text style={styles.itemHint}>{step.placeholders[i]}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.tally}>
          {checkedCount} / {step.count} noticed
        </Text>

        <Button
          label={stepIndex < STEPS.length - 1 ? `Next → ${STEPS[stepIndex + 1].count} things to ${STEPS[stepIndex + 1].sense}` : 'Finish'}
          variant="primary"
          fullWidth
          disabled={!canAdvance}
          onPress={advance}
          style={styles.nextBtn}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: colors.bg, padding: spacing.lg },
  progressRow: { flexDirection: 'row', gap: 6, marginBottom: spacing.md, alignItems: 'center' },
  dot:         { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.line },
  dotDone:     { backgroundColor: colors.sage },
  content:     { paddingBottom: spacing.xxxl },

  senseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1.5,
    borderRadius: radii.lg,
    padding: spacing.md + 2,
    marginBottom: spacing.md,
    ...shadow.sm,
  },
  senseEmoji:    { fontSize: 32 },
  senseTextWrap: {},
  senseCount:    { fontFamily: fonts.bodyMedium, fontSize: fontSizes.sm, color: colors.inkSoft },
  senseName:     { fontFamily: fonts.display, fontSize: fontSizes.xl },
  prompt:        { fontFamily: fonts.bodyBold, fontSize: fontSizes.base, color: colors.ink, marginBottom: 4 },
  promptSub:     { fontFamily: fonts.bodyMedium, fontSize: fontSizes.sm, color: colors.inkSoft, marginBottom: spacing.md },
  itemsGrid:     { gap: spacing.sm },
  itemTile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.line,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    minHeight: 44,
    ...shadow.sm,
  },
  itemNum:  { fontFamily: fonts.bodyBold, fontSize: fontSizes.base, color: colors.inkSoft, width: 22 },
  itemHint: { fontFamily: fonts.bodyMedium, fontSize: fontSizes.sm, color: colors.inkFaint },
  tally: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.sm,
    color: colors.inkFaint,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  nextBtn: { marginTop: spacing.md },

  // ── Done screen ──
  doneCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  doneEmojiWrap: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.sageSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneEmoji: { fontSize: 52 },
  doneTitle: {
    fontFamily: fonts.display,
    fontSize: fontSizes.xl,
    color: colors.ink,
    textAlign: 'center',
  },
  doneSub: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.sm,
    color: colors.inkSoft,
    textAlign: 'center',
    lineHeight: 22,
  },
  recapRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: spacing.xs,
  },
  recapPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 5,
    borderRadius: radii.pill,
  },
  recapEmoji: { fontSize: 14 },
  recapLabel: { fontFamily: fonts.bodyBold, fontSize: fontSizes.sm },
  xpPill: {
    backgroundColor: colors.sageSoft,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
  },
  xpText: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.sm,
    color: colors.sage,
  },
});
