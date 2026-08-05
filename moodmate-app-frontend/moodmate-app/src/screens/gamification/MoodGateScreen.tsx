/**
 * MoodGateScreen — Calm Forest daily check-in gate.
 *
 * Flow:
 *   Step 1 — 5-tier mood selector (color + label, no emoji)
 *   Step 2 — Word chip labels ("How would you describe it?")
 *   Step 3 — Trigger tags, then submit
 *   Submit  — Calls existing /api/checkins, awards XP, marks gate shown
 *   Then    — navigates to MoodSuggestScreen
 */
import React, { useCallback, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Animated, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { useAuthStore } from '@/state/useAuthStore';
import { useGamificationStore, XP_VALUES } from '@/state/useGamificationStore';
import { useGuestStore } from '@/state/useGuestStore';
import { useWellnessStore } from '@/state/useWellnessStore';
import { recordCheckIn } from '@/api/checkin';
import type { EmotionKey } from '@/api/types';
import { hapticLight } from '@/utils/haptics';
import { fonts, fontSizes, radii, spacing, calm } from '@/theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'MoodGate'>;

const MOODS = [
  { score: 1, label: 'Struggling', color: calm.rust },
  { score: 2, label: 'Low', color: calm.terracotta },
  { score: 3, label: 'Okay', color: calm.amber },
  { score: 4, label: 'Good', color: calm.mint },
  { score: 5, label: 'Great', color: calm.primary },
] as const;

type MoodScore = 1 | 2 | 3 | 4 | 5;

const MOOD_TO_EMOTION: Record<MoodScore, EmotionKey> = {
  1: 'OVERWHELMED',
  2: 'ANXIOUS',
  3: 'CALM',
  4: 'HOPEFUL',
  5: 'HAPPY',
};

const CHIPS_BY_TIER: Record<'low' | 'mid' | 'high', string[]> = {
  low: ['Anxious', 'Drained', 'Lonely', 'Overwhelmed', 'Sad', 'Tired', 'Restless', 'Numb'],
  mid: ['Neutral', 'Uncertain', 'Calm', 'Restless', 'Okay', 'Distracted', 'Mixed'],
  high: ['Happy', 'Energised', 'Hopeful', 'Grateful', 'Excited', 'Motivated', 'Peaceful', 'Proud'],
};

const TRIGGERS: { key: string; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'study', label: 'Study / Work', icon: 'book-outline' },
  { key: 'sleep', label: 'Sleep', icon: 'moon-outline' },
  { key: 'social', label: 'Social', icon: 'people-outline' },
  { key: 'exercise', label: 'Exercise', icon: 'walk-outline' },
  { key: 'food', label: 'Food / Eating', icon: 'restaurant-outline' },
  { key: 'relationship', label: 'Relationship', icon: 'heart-outline' },
  { key: 'health', label: 'Health', icon: 'medkit-outline' },
  { key: 'finances', label: 'Finances', icon: 'cash-outline' },
  { key: 'weather', label: 'Weather / Environment', icon: 'partly-sunny-outline' },
  { key: 'self_care', label: 'Self-care', icon: 'flower-outline' },
];

function chipTier(score: MoodScore): 'low' | 'mid' | 'high' {
  if (score <= 2) return 'low';
  if (score === 3) return 'mid';
  return 'high';
}

export function MoodGateScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const token = useAuthStore((s) => s.token);
  const isGuest = useAuthStore((s) => s.user?.guest ?? false);
  const streak = useWellnessStore((s) => s.streakCount);
  const { awardXp, recordAction, markMoodGateShown } = useGamificationStore();
  const showProgressModal = useGuestStore((s) => s.showProgressModal);

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [triggers, setTriggers] = useState<string[]>([]);
  const [selected, setSelected] = useState<MoodScore>(3);
  const [chips, setChips] = useState<string[]>([]);
  const [submitting, setSub] = useState(false);

  const scaleAnim = useRef(new Animated.Value(1)).current;

  const selectMood = (score: MoodScore) => {
    hapticLight();
    setSelected(score);
    setChips([]);
    Animated.sequence([
      Animated.spring(scaleAnim, { toValue: 1.06, useNativeDriver: true, speed: 40, bounciness: 8 }),
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 30 }),
    ]).start();
  };

  const goStep2 = () => { hapticLight(); setStep(2); };
  const toggleChip = (chip: string) => { hapticLight(); setChips((prev) => prev.includes(chip) ? prev.filter((c) => c !== chip) : [...prev, chip]); };
  const goStep3 = () => { hapticLight(); setStep(3); };
  const toggleTrigger = (key: string) => { hapticLight(); setTriggers((prev) => prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]); };

  const submit = useCallback(async () => {
    if (submitting) return;
    if (isGuest) {
      showProgressModal('Mood check-in completed', XP_VALUES.moodGate);
      navigation.replace('MoodSuggest', { moodScore: selected });
      return;
    }
    if (!token) return;
    setSub(true);
    try {
      await recordCheckIn(token, {
        emotionKey: MOOD_TO_EMOTION[selected],
        stressLevel: Math.max(1, 6 - selected),
        energyLevel: selected,
        note: [chips.join(', '), triggers.length > 0 ? `Triggers: ${triggers.join(', ')}` : ''].filter(Boolean).join(' | ') || undefined,
      });
      awardXp(XP_VALUES.moodGate, streak);
      recordAction('checkins', streak);
      markMoodGateShown();
      navigation.replace('MoodSuggest', { moodScore: selected });
    } catch {
      markMoodGateShown();
      navigation.replace('MoodSuggest', { moodScore: selected });
    } finally {
      setSub(false);
    }
  }, [token, isGuest, selected, chips, triggers, streak, submitting, awardXp, recordAction, markMoodGateShown, showProgressModal, navigation]);

  const mood = MOODS[selected - 1];
  const availableChips = CHIPS_BY_TIER[chipTier(selected)];

  return (
    <View style={[s.root, { paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + spacing.lg }]}>
      <Pressable
        style={[s.skipBtn, { top: insets.top + spacing.sm }]}
        onPress={() => { if (!isGuest) markMoodGateShown(); navigation.replace('Main'); }}
      >
        <Text style={s.skipTxt}>Skip</Text>
      </Pressable>

      {isGuest && (
        <View style={[s.guestBanner, { top: insets.top + spacing.sm }]}>
          <Ionicons name="eye-outline" size={13} color={calm.forest} />
          <Text style={s.guestBannerTxt}>Preview mode — results won't be saved</Text>
        </View>
      )}

      {step === 1 ? (
        <View style={s.center}>
          <Text style={s.title}>How are you feeling{'\n'}right now?</Text>
          <Text style={s.sub}>Tap your mood to get started</Text>

          <Animated.View style={[s.circleOuter, { backgroundColor: mood.color + '1F', transform: [{ scale: scaleAnim }] }]}>
            <View style={[s.circleInner, { backgroundColor: mood.color }]}>
              <Text style={s.circleLabel}>{mood.label}</Text>
            </View>
          </Animated.View>

          <View style={s.moodRow}>
            {MOODS.map((m) => (
              <Pressable
                key={m.score}
                style={[s.moodBtn, selected === m.score && { borderColor: m.color, backgroundColor: m.color + '1A' }]}
                onPress={() => selectMood(m.score as MoodScore)}
              >
                <View style={[s.moodDot, { backgroundColor: m.color }]} />
                {selected === m.score && <Text style={[s.moodBtnLabel, { color: m.color }]}>{m.label}</Text>}
              </Pressable>
            ))}
          </View>

          <Pressable style={[s.ctaBtn, { backgroundColor: mood.color }]} onPress={goStep2}>
            <Text style={s.ctaTxt}>Continue</Text>
          </Pressable>
        </View>
      ) : step === 2 ? (
        <ScrollView contentContainerStyle={s.step2} showsVerticalScrollIndicator={false}>
          <Text style={s.title}>How would you{'\n'}describe it?</Text>
          <Text style={s.sub}>Choose all that apply (or skip)</Text>

          <View style={s.recapRow}>
            <View style={[s.recapDot, { backgroundColor: mood.color }]} />
            <Text style={s.recapLabel}>{mood.label}</Text>
          </View>

          <View style={s.chipGrid}>
            {availableChips.map((chip) => {
              const active = chips.includes(chip);
              return (
                <Pressable
                  key={chip}
                  style={[s.chip, active && { backgroundColor: mood.color, borderColor: mood.color }]}
                  onPress={() => toggleChip(chip)}
                >
                  <Text style={[s.chipTxt, active && s.chipTxtActive]}>{chip}</Text>
                </Pressable>
              );
            })}
          </View>

          <Pressable style={[s.ctaBtn, { backgroundColor: mood.color, marginTop: spacing.xxl }]} onPress={goStep3}>
            <Text style={s.ctaTxt}>Next</Text>
          </Pressable>
          <Pressable style={s.skipChips} onPress={goStep3}>
            <Text style={s.skipChipsTxt}>Skip</Text>
          </Pressable>
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={s.step2} showsVerticalScrollIndicator={false}>
          <Text style={s.title}>What's been affecting you?</Text>
          <Text style={s.sub}>Tag your triggers (optional)</Text>

          <View style={s.chipGrid}>
            {TRIGGERS.map((t) => {
              const active = triggers.includes(t.key);
              return (
                <Pressable
                  key={t.key}
                  style={[s.chip, s.chipWithIcon, active && { backgroundColor: mood.color, borderColor: mood.color }]}
                  onPress={() => toggleTrigger(t.key)}
                >
                  <Ionicons name={t.icon} size={14} color={active ? '#FFFFFF' : calm.muted} />
                  <Text style={[s.chipTxt, active && s.chipTxtActive]}>{t.label}</Text>
                </Pressable>
              );
            })}
          </View>

          <Pressable
            style={[s.ctaBtn, { backgroundColor: mood.color, opacity: submitting ? 0.6 : 1, marginTop: spacing.xxl }]}
            onPress={submit}
            disabled={submitting}
          >
            <Text style={s.ctaTxt}>{submitting ? 'Saving…' : `Log my mood · +${XP_VALUES.moodGate} XP`}</Text>
          </Pressable>
          <Pressable style={s.skipChips} onPress={submit}>
            <Text style={s.skipChipsTxt}>Skip & log</Text>
          </Pressable>
        </ScrollView>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: calm.bg, paddingHorizontal: spacing.xl },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  skipBtn: { position: 'absolute', right: spacing.xl, zIndex: 10, padding: 8 },
  skipTxt: { fontFamily: fonts.bodyMedium, fontSize: fontSizes.sm, color: calm.muted },

  title: { fontFamily: fonts.displayExtraBold, fontSize: fontSizes.xxl, color: calm.forest, textAlign: 'center', lineHeight: 34, letterSpacing: -0.3, marginBottom: 8 },
  sub: { fontFamily: fonts.body, fontSize: fontSizes.sm, color: calm.muted, textAlign: 'center', marginBottom: spacing.xxl },

  circleOuter: { width: 220, height: 220, borderRadius: 110, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xxl },
  circleInner: { width: 150, height: 150, borderRadius: 75, alignItems: 'center', justifyContent: 'center' },
  circleLabel: { fontFamily: fonts.bodyBold, fontSize: fontSizes.md, color: '#FFFFFF' },

  moodRow: { flexDirection: 'row', gap: 10, marginBottom: spacing.xxl },
  moodBtn: {
    alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10,
    borderRadius: radii.lg, borderWidth: 1.5, borderColor: calm.border,
    backgroundColor: '#FFFFFF', minWidth: 52, gap: 6,
  },
  moodDot: { width: 14, height: 14, borderRadius: 7 },
  moodBtnLabel: { fontFamily: fonts.bodyBold, fontSize: 9 },

  ctaBtn: { borderRadius: radii.pill, paddingVertical: 18, paddingHorizontal: 48, alignItems: 'center', width: '100%' },
  ctaTxt: { fontFamily: fonts.bodyBold, fontSize: fontSizes.base, color: '#FFFFFF' },

  step2: { paddingHorizontal: spacing.md, alignItems: 'center', paddingTop: spacing.xxxl },
  recapRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: spacing.xl, alignSelf: 'flex-start' },
  recapDot: { width: 16, height: 16, borderRadius: 8 },
  recapLabel: { fontFamily: fonts.bodyBold, fontSize: fontSizes.md, color: calm.forest },

  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' },
  chip: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: radii.pill, borderWidth: 1.5, borderColor: calm.border, backgroundColor: '#FFFFFF' },
  chipWithIcon: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  chipTxt: { fontFamily: fonts.bodyMedium, fontSize: fontSizes.sm, color: calm.muted },
  chipTxtActive: { color: '#FFFFFF', fontFamily: fonts.bodyBold },

  skipChips: { marginTop: spacing.lg, padding: 8 },
  skipChipsTxt: { fontFamily: fonts.bodyMedium, fontSize: fontSizes.xs, color: calm.faint },

  guestBanner: {
    position: 'absolute', top: 0, alignSelf: 'center',
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: calm.mintBg, borderRadius: radii.pill,
    paddingHorizontal: 14, paddingVertical: 6, zIndex: 10,
  },
  guestBannerTxt: { fontFamily: fonts.bodyMedium, fontSize: 11, color: calm.forest, textAlign: 'center' },
});
