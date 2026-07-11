/**
 * MoodGateScreen — Apple Health "State of Mind"-style daily check-in gate.
 *
 * Flow:
 *   Step 1 — Animated orb + 5-emoji mood selector (color shifts with mood)
 *   Step 2 — Word chip labels ("How would you describe it?")
 *   Submit  — Calls existing /api/checkins, awards XP, marks gate shown
 *   Then    — navigates to MoodSuggestScreen
 */
import React, { useCallback, useRef, useState } from 'react';
import {
  View, Text, Pressable, StyleSheet, Animated, Dimensions, ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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
import { fonts, fontSizes, spacing } from '@/theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'MoodGate'>;

const { width: SW, height: SH } = Dimensions.get('window');
const ORB_MAX = Math.min(SW, SH) * 0.55;

// ── Mood levels ──────────────────────────────────────────────────────────────
const MOODS = [
  { score: 1, emoji: '😔', label: 'Struggling', gradStart: '#4A1C96', gradEnd: '#7B2D8B', ripple: '#6A0DAD' },
  { score: 2, emoji: '😟', label: 'Low',         gradStart: '#1A3A6B', gradEnd: '#2C6FA0', ripple: '#2563EB' },
  { score: 3, emoji: '😐', label: 'Okay',        gradStart: '#065F46', gradEnd: '#059669', ripple: '#10B981' },
  { score: 4, emoji: '🙂', label: 'Good',        gradStart: '#166534', gradEnd: '#22C55E', ripple: '#4ADE80' },
  { score: 5, emoji: '😊', label: 'Great',       gradStart: '#92400E', gradEnd: '#F59E0B', ripple: '#FCD34D' },
] as const;

type MoodScore = 1 | 2 | 3 | 4 | 5;

// Mood → CheckIn emotion mapping
const MOOD_TO_EMOTION: Record<MoodScore, EmotionKey> = {
  1: 'OVERWHELMED',
  2: 'ANXIOUS',
  3: 'CALM',
  4: 'HOPEFUL',
  5: 'HAPPY',
};

// ── Word chips per mood tier ─────────────────────────────────────────────────
const CHIPS_BY_TIER: Record<'low' | 'mid' | 'high', string[]> = {
  low:  ['Anxious', 'Drained', 'Lonely', 'Overwhelmed', 'Sad', 'Tired', 'Restless', 'Numb'],
  mid:  ['Neutral', 'Uncertain', 'Calm', 'Restless', 'Okay', 'Distracted', 'Mixed'],
  high: ['Happy', 'Energised', 'Hopeful', 'Grateful', 'Excited', 'Motivated', 'Peaceful', 'Proud'],
};


// ── Trigger tags (Step 3) ─────────────────────────────────────────────────────
const TRIGGERS = [
  { key: 'study',        label: '📚 Study / Work',     },
  { key: 'sleep',        label: '😴 Sleep',             },
  { key: 'social',       label: '👥 Social',            },
  { key: 'exercise',     label: '🏃 Exercise',          },
  { key: 'food',         label: '🍎 Food / Eating',     },
  { key: 'relationship', label: '❤️ Relationship',      },
  { key: 'health',       label: '💊 Health',             },
  { key: 'finances',     label: '💰 Finances',           },
  { key: 'weather',      label: '☁️ Weather / Environment'},
  { key: 'self_care',    label: '🛁 Self-care',          },
];

function chipTier(score: MoodScore): 'low' | 'mid' | 'high' {
  if (score <= 2) return 'low';
  if (score === 3) return 'mid';
  return 'high';
}

export function MoodGateScreen({ navigation }: Props) {
  const insets  = useSafeAreaInsets();
  const token   = useAuthStore((s) => s.token);
  const isGuest = useAuthStore((s) => s.user?.guest ?? false);
  const streak  = useWellnessStore((s) => s.streakCount);
  const { awardXp, recordAction, markMoodGateShown } = useGamificationStore();
  const showProgressModal = useGuestStore((s) => s.showProgressModal);

  const [step, setStep]         = useState<1 | 2 | 3>(1);
  const [triggers, setTriggers] = useState<string[]>([]);
  const [selected, setSelected] = useState<MoodScore>(3);
  const [chips, setChips]       = useState<string[]>([]);
  const [submitting, setSub]    = useState(false);

  // Animated values
  const orbScale   = useRef(new Animated.Value(1)).current;
  const ripple1    = useRef(new Animated.Value(1)).current;
  const ripple2    = useRef(new Animated.Value(1)).current;
  const ripple1Op  = useRef(new Animated.Value(0.35)).current;
  const ripple2Op  = useRef(new Animated.Value(0.2)).current;
  const stepAnim   = useRef(new Animated.Value(0)).current;

  // Start ambient ripple loop
  React.useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(ripple1, { toValue: 1.35, duration: 1800, useNativeDriver: true }),
          Animated.timing(ripple1Op, { toValue: 0, duration: 1800, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(ripple1, { toValue: 1, duration: 0, useNativeDriver: true }),
          Animated.timing(ripple1Op, { toValue: 0.35, duration: 0, useNativeDriver: true }),
        ]),
      ]),
    );
    const loop2 = Animated.loop(
      Animated.sequence([
        Animated.delay(900),
        Animated.parallel([
          Animated.timing(ripple2, { toValue: 1.5, duration: 1800, useNativeDriver: true }),
          Animated.timing(ripple2Op, { toValue: 0, duration: 1800, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(ripple2, { toValue: 1, duration: 0, useNativeDriver: true }),
          Animated.timing(ripple2Op, { toValue: 0.2, duration: 0, useNativeDriver: true }),
        ]),
      ]),
    );
    loop.start(); loop2.start();
    return () => { loop.stop(); loop2.stop(); };
  }, []);

  const selectMood = (score: MoodScore) => {
    hapticLight();
    setSelected(score);
    setChips([]); // reset chips when mood changes
    // Bounce the orb
    Animated.sequence([
      Animated.spring(orbScale, { toValue: 1.08, useNativeDriver: true, speed: 40, bounciness: 8 }),
      Animated.spring(orbScale, { toValue: 1,    useNativeDriver: true, speed: 30 }),
    ]).start();
  };

  const goStep2 = () => {
    hapticLight();
    Animated.timing(stepAnim, { toValue: 1, duration: 280, useNativeDriver: true }).start(() => {
      setStep(2);
      Animated.timing(stepAnim, { toValue: 0, duration: 0, useNativeDriver: true }).start();
    });
  };

  const toggleChip = (chip: string) => {
    hapticLight();
    setChips((prev) => prev.includes(chip) ? prev.filter((c) => c !== chip) : [...prev, chip]);
  };

  const goStep3 = () => {
    hapticLight();
    setStep(3);
  };

  const toggleTrigger = (key: string) => {
    hapticLight();
    setTriggers((prev) => prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]);
  };

  const submit = useCallback(async () => {
    if (submitting) return;

    // Guest path — no API call, no XP, just show progress modal
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
        stressLevel: Math.max(1, 6 - selected),   // inverse of mood
        energyLevel: selected,
        note: [chips.join(', '), triggers.length > 0 ? `Triggers: ${triggers.join(', ')}` : ''].filter(Boolean).join(' | ') || undefined,
      });
      awardXp(XP_VALUES.moodGate, streak);
      recordAction('checkins', streak);
      markMoodGateShown();
      navigation.replace('MoodSuggest', { moodScore: selected });
    } catch {
      // Still gate-pass on network error
      markMoodGateShown();
      navigation.replace('MoodSuggest', { moodScore: selected });
    } finally {
      setSub(false);
    }
  }, [token, isGuest, selected, chips, triggers, streak, submitting, awardXp, recordAction, markMoodGateShown, showProgressModal, navigation]);

  const mood = MOODS[selected - 1];
  const availableChips = CHIPS_BY_TIER[chipTier(selected)];

  return (
    <View style={s.root}>
      <LinearGradient
        colors={['#0A0A14', '#0D1117', '#0A0F1A']}
        style={StyleSheet.absoluteFill}
      />

      {/* Skip */}
      <Pressable
        style={[s.skipBtn, { top: insets.top + 12 }]}
        onPress={() => {
          if (!isGuest) markMoodGateShown();
          navigation.replace('Main');
        }}
      >
        <Text style={s.skipTxt}>Skip</Text>
      </Pressable>

      {/* Guest preview banner */}
      {isGuest && (
        <View style={[s.guestBanner, { top: insets.top + 8 }]}>
          <Text style={s.guestBannerTxt}>👀  Preview mode — results won't be saved</Text>
        </View>
      )}

      {step === 1 ? (
        <View style={[s.center, { paddingTop: insets.top + 48, paddingBottom: insets.bottom + 24 }]}>
          {/* Title */}
          <Text style={s.title}>How are you feeling{'\n'}right now?</Text>
          <Text style={s.sub}>Tap your mood to get started</Text>

          {/* Animated orb */}
          <View style={s.orbWrap}>
            {/* Ripple rings */}
            <Animated.View style={[s.ripple, {
              width: ORB_MAX, height: ORB_MAX,
              borderRadius: ORB_MAX / 2,
              backgroundColor: mood.ripple,
              opacity: ripple1Op,
              transform: [{ scale: ripple1 }],
            }]} />
            <Animated.View style={[s.ripple, {
              width: ORB_MAX, height: ORB_MAX,
              borderRadius: ORB_MAX / 2,
              backgroundColor: mood.ripple,
              opacity: ripple2Op,
              transform: [{ scale: ripple2 }],
            }]} />

            {/* Main orb */}
            <Animated.View style={{ transform: [{ scale: orbScale }] }}>
              <LinearGradient
                colors={[mood.gradStart, mood.gradEnd]}
                style={[s.orb, { width: ORB_MAX * 0.72, height: ORB_MAX * 0.72, borderRadius: ORB_MAX * 0.36 }]}
                start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }}
              >
                <Text style={s.orbEmoji}>{mood.emoji}</Text>
                <Text style={s.orbLabel}>{mood.label}</Text>
              </LinearGradient>
            </Animated.View>
          </View>

          {/* Emoji selector row */}
          <View style={s.moodRow}>
            {MOODS.map((m) => (
              <Pressable
                key={m.score}
                style={[s.moodBtn, selected === m.score && s.moodBtnActive]}
                onPress={() => selectMood(m.score as MoodScore)}
              >
                <Text style={s.moodEmoji}>{m.emoji}</Text>
                {selected === m.score && <Text style={s.moodBtnLabel}>{m.label}</Text>}
              </Pressable>
            ))}
          </View>

          {/* Continue */}
          <Pressable style={[s.ctaBtn, { backgroundColor: mood.gradEnd }]} onPress={goStep2}>
            <Text style={s.ctaTxt}>Continue →</Text>
          </Pressable>
        </View>
      ) : step === 2 ? (
        <ScrollView
          contentContainerStyle={[s.step2, { paddingTop: insets.top + 60, paddingBottom: insets.bottom + 40 }]}
          showsVerticalScrollIndicator={false}
        >
          <Text style={s.title}>How would you{'\n'}describe it?</Text>
          <Text style={s.sub}>Choose all that apply (or skip)</Text>

          {/* Selected mood recap */}
          <View style={s.recapRow}>
            <LinearGradient
              colors={[mood.gradStart, mood.gradEnd]}
              style={s.recapOrb}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            >
              <Text style={{ fontSize: 22 }}>{mood.emoji}</Text>
            </LinearGradient>
            <Text style={s.recapLabel}>{mood.label}</Text>
          </View>

          {/* Chip grid */}
          <View style={s.chipGrid}>
            {availableChips.map((chip) => {
              const active = chips.includes(chip);
              return (
                <Pressable
                  key={chip}
                  style={[s.chip, active && { backgroundColor: mood.gradEnd, borderColor: mood.gradEnd }]}
                  onPress={() => toggleChip(chip)}
                >
                  <Text style={[s.chipTxt, active && s.chipTxtActive]}>{chip}</Text>
                </Pressable>
              );
            })}
          </View>

          {/* Continue to triggers */}
          <Pressable
            style={[s.ctaBtn, { backgroundColor: mood.gradEnd, marginTop: 32 }]}
            onPress={goStep3}
          >
            <Text style={s.ctaTxt}>Next →</Text>
          </Pressable>

          <Pressable style={s.skipChips} onPress={goStep3}>
            <Text style={s.skipChipsTxt}>Skip</Text>
          </Pressable>
        </ScrollView>
      ) : (
        <ScrollView
          contentContainerStyle={[s.step2, { paddingTop: insets.top + 60, paddingBottom: insets.bottom + 40 }]}
          showsVerticalScrollIndicator={false}
        >
          <Text style={s.title}>What's been affecting you?</Text>
          <Text style={s.sub}>Tag your triggers (optional)</Text>

          <View style={s.chipGrid}>
            {TRIGGERS.map((t) => {
              const active = triggers.includes(t.key);
              return (
                <Pressable
                  key={t.key}
                  style={[s.chip, active && { backgroundColor: mood.gradEnd, borderColor: mood.gradEnd }]}
                  onPress={() => toggleTrigger(t.key)}
                >
                  <Text style={[s.chipTxt, active && s.chipTxtActive]}>{t.label}</Text>
                </Pressable>
              );
            })}
          </View>

          <Pressable
            style={[s.ctaBtn, { backgroundColor: mood.gradEnd, opacity: submitting ? 0.6 : 1, marginTop: 32 }]}
            onPress={submit}
            disabled={submitting}
          >
            <Text style={s.ctaTxt}>{submitting ? 'Saving…' : `Log my mood  +${XP_VALUES.moodGate} XP ✨`}</Text>
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
  root: { flex: 1, backgroundColor: '#0A0A14' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl },
  skipBtn: { position: 'absolute', right: 20, zIndex: 10, padding: 8 },
  skipTxt: { fontFamily: fonts.bodyMedium, fontSize: fontSizes.sm, color: 'rgba(255,255,255,0.45)' },

  title: {
    fontFamily: fonts.display, fontSize: 26,
    color: '#FFFFFF', textAlign: 'center', lineHeight: 34, marginBottom: 8,
  },
  sub: { fontFamily: fonts.bodyMedium, fontSize: fontSizes.sm, color: 'rgba(255,255,255,0.5)', textAlign: 'center', marginBottom: 36 },

  orbWrap: { alignItems: 'center', justifyContent: 'center', marginBottom: 40, width: ORB_MAX, height: ORB_MAX },
  ripple: { position: 'absolute' },
  orb: { alignItems: 'center', justifyContent: 'center', gap: 6, elevation: 12 },
  orbEmoji: { fontSize: 52 },
  orbLabel: { fontFamily: fonts.bodyBold, fontSize: fontSizes.base, color: 'rgba(255,255,255,0.9)' },

  moodRow: { flexDirection: 'row', gap: 10, marginBottom: 36 },
  moodBtn: {
    alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10,
    borderRadius: 16, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.05)', minWidth: 52,
  },
  moodBtnActive: { borderColor: 'rgba(255,255,255,0.5)', backgroundColor: 'rgba(255,255,255,0.12)' },
  moodEmoji: { fontSize: 26 },
  moodBtnLabel: { fontFamily: fonts.bodyMedium, fontSize: 9, color: 'rgba(255,255,255,0.7)', marginTop: 3 },

  ctaBtn: {
    borderRadius: 18, paddingVertical: 16, paddingHorizontal: 48,
    alignItems: 'center', width: '100%',
  },
  ctaTxt: { fontFamily: fonts.bodyBold, fontSize: fontSizes.base, color: '#FFFFFF' },

  // Step 2
  step2: { paddingHorizontal: spacing.xl, alignItems: 'center' },
  recapRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 28, alignSelf: 'flex-start' },
  recapOrb: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  recapLabel: { fontFamily: fonts.bodyBold, fontSize: fontSizes.md, color: '#FFFFFF' },

  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' },
  chip: {
    paddingHorizontal: 18, paddingVertical: 10, borderRadius: 99,
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.18)',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  chipTxt: { fontFamily: fonts.bodyMedium, fontSize: fontSizes.sm, color: 'rgba(255,255,255,0.75)' },
  chipTxtActive: { color: '#FFFFFF', fontFamily: fonts.bodyBold },

  skipChips: { marginTop: 16, padding: 8 },
  skipChipsTxt: { fontFamily: fonts.bodyMedium, fontSize: fontSizes.xs, color: 'rgba(255,255,255,0.35)' },

  // Guest preview banner
  guestBanner: {
    position: 'absolute',
    alignSelf: 'center',
    backgroundColor: 'rgba(251,191,36,0.18)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.35)',
    zIndex: 10,
  },
  guestBannerTxt: {
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
    color: '#FBBF24',
    textAlign: 'center',
  },
});
