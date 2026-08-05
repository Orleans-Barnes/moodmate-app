/**
 * CheckInScreen — Calm Forest 3-step check-in wizard
 * (Figma "14 Check-in · Mood" / "15 · Emotion Wheel" / "16 · Energy & Stress" / "17 · Saved")
 *
 * Figma's mood step is a free 1–10 drag and its emotion step is multi-select with no numeric
 * cap; the real backend (CheckInRequest) only stores one `emotionKey` plus 1–5 stressLevel/
 * energyLevel — there's no schema field for a standalone mood score or multiple emotion tags.
 * Adaptation: the mood slider runs 1–5 (matching the real scale) and is shown back to the user
 * on the Saved screen but isn't sent to the server; multi-selected emotions are all kept, but
 * only the first becomes the stored `emotionKey` — any others are folded into the free-text
 * note so nothing the user picked is silently dropped.
 */
import React, { useRef, useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, Pressable, Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { BackButton } from '@/components/BackButton';
import { ProgressBar } from '@/components/ProgressBar';
import { EmotionWheel, Emotion } from '@/components/EmotionWheel';
import { ConfettiBurst, ConfettiHandle } from '@/components/Confetti';
import { useAuthStore } from '@/state/useAuthStore';
import { useGuestStore } from '@/state/useGuestStore';
import { useWellnessStore } from '@/state/useWellnessStore';
import { useDashboardStore } from '@/state/useDashboardStore';
import { XP_VALUES } from '@/state/useGamificationStore';
import { useToast } from '@/state/useToast';
import { recordCheckIn } from '@/api/checkin';
import { ApiRequestError } from '@/api/client';
import type { EmotionKey } from '@/api/types';
import { fonts, fontSizes, radii, spacing, calm } from '@/theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'CheckIn'>;

const MOOD_FACES: (keyof typeof Ionicons.glyphMap)[] = [
  'sad-outline',
  'cloud-outline',
  'remove-outline',
  'happy-outline',
  'heart-circle-outline',
];
const MOOD_LABELS = ['Awful', 'Not great', 'Okay', 'Pretty good', 'Amazing'];
const ENERGY_LABELS = ['Drained', 'Low', 'Steady', 'High', 'Buzzing'];
const STRESS_LABELS = ['Calm', 'Mild', 'Tense', 'High', 'Breaking'];

function compareToLast(value: number, last: number | undefined, name: string): string | null {
  if (last === undefined) return null;
  if (value === last) return `Same ${name} as your last check-in`;
  return value > last ? `Higher ${name} than your last check-in` : `Lower ${name} than your last check-in`;
}

export function CheckInScreen({ navigation }: Props) {
  const [step, setStep] = useState<0 | 1 | 2 | 3>(0);
  const [mood, setMood] = useState(3);
  const [selectedEmotions, setSelectedEmotions] = useState<Emotion[]>([]);
  const [note, setNote] = useState('');
  const [energy, setEnergy] = useState(3);
  const [stress, setStress] = useState(3);
  const [saving, setSaving] = useState(false);

  const token = useAuthStore((s) => s.token);
  const isGuest = useAuthStore((s) => s.user?.guest ?? false);
  const showProgressModal = useGuestStore((s) => s.showProgressModal);
  const streakCount = useWellnessStore((s) => s.streakCount);
  const latestMood = useDashboardStore((s) => s.latestMood);
  const toast = useToast();
  const confettiRef = useRef<ConfettiHandle>(null);
  const insets = useSafeAreaInsets();

  const toggleEmotion = (e: Emotion) => {
    setSelectedEmotions((prev) =>
      prev.some((p) => p.label === e.label) ? prev.filter((p) => p.label !== e.label) : [...prev, e],
    );
  };

  const handleSave = async () => {
    if (selectedEmotions.length === 0 || saving) return;
    const primary = selectedEmotions[0];
    const extras = selectedEmotions.slice(1).map((e) => e.label).join(', ');
    const fullNote = extras ? `${note.trim()}${note.trim() ? ' — ' : ''}Also feeling: ${extras}.` : note.trim();

    if (isGuest) {
      showProgressModal('Mood check-in', XP_VALUES.checkin);
      setStep(3);
      confettiRef.current?.fire();
      return;
    }
    if (!token) return;
    setSaving(true);
    try {
      await recordCheckIn(token, {
        emotionKey: primary.label.toUpperCase() as EmotionKey,
        stressLevel: Math.round(stress),
        energyLevel: Math.round(energy),
        note: fullNote || undefined,
      });
      setStep(3);
      confettiRef.current?.fire();
    } catch (err) {
      toast(err instanceof ApiRequestError ? err.message : 'Could not save your check-in.');
    } finally {
      setSaving(false);
    }
  };

  // ── Step 1: Mood ──────────────────────────────────────────────────────────
  if (step === 0) {
    const idx = Math.round(mood) - 1;
    return (
      <View style={[s.root, { paddingTop: insets.top + spacing.lg }]}>
        <StepHeader onBack={() => navigation.goBack()} stepLabel="1 of 3" progress={33} />
        <Text style={s.title}>How's your mood{'\n'}right now?</Text>
        <Text style={s.sub}>Drag to what feels closest.</Text>

        <View style={s.moodCircleOuter}>
          <View style={s.moodCircleInner}>
            <Ionicons name={MOOD_FACES[idx]} size={44} color={calm.primary} />
          </View>
        </View>

        <Text style={s.moodLabel}>{MOOD_LABELS[idx]}</Text>
        <Text style={s.moodOutOf}>{Math.round(mood)} out of 5</Text>

        <Slider
          minimumValue={1}
          maximumValue={5}
          step={1}
          value={mood}
          onValueChange={setMood}
          minimumTrackTintColor={calm.primary}
          maximumTrackTintColor={calm.track}
          thumbTintColor={calm.primary}
          style={s.slider}
        />
        <View style={s.sliderEnds}>
          <Text style={s.sliderEndText}>Awful</Text>
          <Text style={s.sliderEndText}>Amazing</Text>
        </View>

        <View style={s.footer}>
          <Pressable style={s.cta} onPress={() => setStep(1)}>
            <Text style={s.ctaText}>Continue</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // ── Step 2: Emotion wheel ─────────────────────────────────────────────────
  if (step === 1) {
    return (
      <View style={[s.root, { paddingTop: insets.top + spacing.lg }]}>
        <StepHeader onBack={() => setStep(0)} stepLabel="2 of 3" progress={66} />
        <Text style={s.title}>Name the feeling</Text>
        <Text style={s.sub}>Tap all that fit. Naming it takes the edge off.</Text>

        <View style={s.wheelWrap}>
          <EmotionWheel selected={selectedEmotions} onToggle={toggleEmotion} />
        </View>

        {selectedEmotions.length > 0 && (
          <View style={s.chipsRow}>
            {selectedEmotions.map((e) => (
              <Pressable key={e.label} style={[s.chip, { backgroundColor: e.color }]} onPress={() => toggleEmotion(e)}>
                <Text style={s.chipText}>{e.label}</Text>
                <Ionicons name="close" size={14} color="#FFFFFF" style={s.chipCloseIcon} />
              </Pressable>
            ))}
          </View>
        )}

        <Text style={s.noteLabel}>Add a note (optional)</Text>
        <TextInput
          style={s.noteInput}
          placeholder="What's on your mind?"
          placeholderTextColor={calm.faint}
          value={note}
          onChangeText={setNote}
        />

        <View style={s.footer}>
          <Pressable
            style={[s.cta, selectedEmotions.length === 0 && s.ctaDisabled]}
            disabled={selectedEmotions.length === 0}
            onPress={() => setStep(2)}
          >
            <Text style={s.ctaText}>Continue</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // ── Step 3: Energy & Stress ───────────────────────────────────────────────
  if (step === 2) {
    const energyHint = compareToLast(energy, latestMood?.energyLevel, 'energy');
    const stressHint = compareToLast(stress, latestMood?.stressLevel, 'stress');
    return (
      <View style={[s.root, { paddingTop: insets.top + spacing.lg }]}>
        <StepHeader onBack={() => setStep(1)} stepLabel="3 of 3" progress={100} />
        <Text style={s.title}>Last two</Text>
        <Text style={s.sub}>These power your weekly burnout check.</Text>

        <View style={s.metricCard}>
          <View style={s.metricTop}>
            <Text style={s.metricLabel}>Energy</Text>
            <Text style={[s.metricValue, { color: calm.amber }]}>{Math.round(energy)}</Text>
          </View>
          <Text style={s.metricStatus}>{ENERGY_LABELS[Math.round(energy) - 1]}</Text>
          <Slider
            minimumValue={1} maximumValue={5} step={1}
            value={energy} onValueChange={setEnergy}
            minimumTrackTintColor={calm.amber} maximumTrackTintColor={calm.trackAlt} thumbTintColor={calm.amber}
            style={s.metricSlider}
          />
          <View style={s.sliderEnds}>
            <Text style={s.sliderEndText}>Drained</Text>
            <Text style={s.sliderEndText}>Steady</Text>
            <Text style={s.sliderEndText}>Buzzing</Text>
          </View>
          {energyHint && (
            <View style={s.hintPill}>
              <Ionicons name="information-circle-outline" size={13} color={calm.forest} style={{ marginRight: 5 }} />
              <Text style={s.hintText}>{energyHint}</Text>
            </View>
          )}
        </View>

        <View style={s.metricCard}>
          <View style={s.metricTop}>
            <Text style={s.metricLabel}>Stress</Text>
            <Text style={[s.metricValue, { color: calm.rust }]}>{Math.round(stress)}</Text>
          </View>
          <Text style={s.metricStatus}>{STRESS_LABELS[Math.round(stress) - 1]}</Text>
          <Slider
            minimumValue={1} maximumValue={5} step={1}
            value={stress} onValueChange={setStress}
            minimumTrackTintColor={calm.rust} maximumTrackTintColor={calm.trackAlt} thumbTintColor={calm.rust}
            style={s.metricSlider}
          />
          <View style={s.sliderEnds}>
            <Text style={s.sliderEndText}>Calm</Text>
            <Text style={s.sliderEndText}>Tense</Text>
            <Text style={s.sliderEndText}>Breaking</Text>
          </View>
          {stressHint && (
            <View style={s.hintPill}>
              <Ionicons name="information-circle-outline" size={13} color={calm.forest} style={{ marginRight: 5 }} />
              <Text style={s.hintText}>{stressHint}</Text>
            </View>
          )}
        </View>

        <View style={s.footer}>
          <Pressable style={[s.cta, saving && s.ctaDisabled]} disabled={saving} onPress={handleSave}>
            <Text style={s.ctaText}>{saving ? 'Saving…' : 'Save check-in'}</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // ── Step 4: Saved ─────────────────────────────────────────────────────────
  const insight = stress >= 4 && energy <= 2
    ? `Stress at ${Math.round(stress)} with energy at ${Math.round(energy)} is a heavy combination. A short reset now is worth more than an hour later.`
    : stress <= 2 && energy >= 4
    ? `Stress low, energy high — a great state to build something today, big or small.`
    : `Noted. Small, steady check-ins like this one are what make patterns visible over time.`;

  return (
    <View style={[s.savedRoot, { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + spacing.xl }]}>
      <View style={s.savedCircleOuter}>
        <View style={s.savedCircleInner}>
          <Ionicons name="checkmark" size={48} color={calm.primary} />
        </View>
      </View>
      <Text style={s.savedTitle}>Logged.</Text>
      <Text style={s.savedSub}>Day {Math.max(1, streakCount)}. Your tree grew a new leaf.</Text>

      <View style={s.savedStatsRow}>
        <View style={s.savedStat}>
          <Text style={s.savedStatValue}>{Math.round(mood)}/5</Text>
          <Text style={s.savedStatLabel}>Mood</Text>
        </View>
        <View style={s.savedStat}>
          <Text style={s.savedStatValue}>{Math.round(energy)}/5</Text>
          <Text style={s.savedStatLabel}>Energy</Text>
        </View>
        <View style={s.savedStat}>
          <Text style={s.savedStatValue}>{Math.round(stress)}/5</Text>
          <Text style={s.savedStatLabel}>Stress</Text>
        </View>
      </View>

      <View style={s.insightCard}>
        <Text style={s.insightLabel}>WHAT WE NOTICED</Text>
        <Text style={s.insightText}>{insight}</Text>
      </View>

      <Pressable
        style={s.savedCta}
        onPress={() => navigation.replace('BreathingSession', { session: 'Breathing Reset', duration: 180 })}
      >
        <Text style={s.ctaText}>Try a 3-min breathing reset</Text>
      </Pressable>
      <Pressable onPress={() => navigation.goBack()} style={{ paddingVertical: spacing.md }}>
        <Text style={s.backToToday}>Back to Today</Text>
      </Pressable>

      <ConfettiBurst ref={confettiRef} />
    </View>
  );
}

function StepHeader({ onBack, stepLabel, progress }: { onBack: () => void; stepLabel: string; progress: number }) {
  return (
    <>
      <View style={s.headerRow}>
        <BackButton onPress={onBack} />
        <Text style={s.stepLabel}>{stepLabel}</Text>
      </View>
      <View style={s.progressWrap}>
        <ProgressBar progress={progress} height={6} />
      </View>
    </>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: calm.bg, paddingHorizontal: spacing.xl },

  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  stepLabel: { fontFamily: fonts.bodyMedium, fontSize: fontSizes.sm, color: calm.muted },
  progressWrap: { marginTop: spacing.lg, marginBottom: spacing.xl },

  title: {
    fontFamily: fonts.displayExtraBold,
    fontSize: fontSizes.xxl + 4,
    lineHeight: 36,
    color: calm.forest,
    letterSpacing: -0.42,
  },
  sub: { fontFamily: fonts.body, fontSize: fontSizes.md - 1, color: calm.muted, marginTop: spacing.sm, marginBottom: spacing.xl },

  moodCircleOuter: {
    width: 220, height: 220, borderRadius: 110,
    backgroundColor: calm.mintBg,
    alignSelf: 'center',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  moodCircleInner: {
    width: 150, height: 150, borderRadius: 75,
    backgroundColor: calm.amber,
    alignItems: 'center', justifyContent: 'center',
  },
  moodFace: { fontSize: 64 },
  moodLabel: { fontFamily: fonts.displayExtraBold, fontSize: fontSizes.xxl + 6, color: calm.forest, textAlign: 'center' },
  moodOutOf: { fontFamily: fonts.body, fontSize: fontSizes.base - 1, color: calm.muted, textAlign: 'center', marginTop: 4, marginBottom: spacing.xl },

  slider: { marginHorizontal: -4 },
  sliderEnds: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.xs },
  sliderEndText: { fontFamily: fonts.body, fontSize: fontSizes.sm, color: calm.muted },

  footer: { position: 'absolute', left: spacing.xl, right: spacing.xl, bottom: spacing.xl },
  cta: { backgroundColor: calm.primary, borderRadius: radii.pill, paddingVertical: 19, alignItems: 'center' },
  ctaDisabled: { opacity: 0.45 },
  ctaText: { fontFamily: fonts.bodyBold, fontSize: fontSizes.md, color: '#FFFFFF' },

  wheelWrap: { alignItems: 'center', marginBottom: spacing.lg },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
  chip: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: 16, paddingVertical: 9, borderRadius: radii.pill },
  chipText: { fontFamily: fonts.bodyBold, fontSize: fontSizes.base - 2, color: '#FFFFFF' },
  chipCloseIcon: { marginLeft: 4 },

  noteLabel: { fontFamily: fonts.bodyMedium, fontSize: fontSizes.sm, color: calm.muted, marginBottom: spacing.sm },
  noteInput: {
    borderWidth: 1.5, borderColor: calm.border, borderRadius: radii.lg,
    paddingHorizontal: spacing.lg, paddingVertical: 18,
    fontFamily: fonts.body, fontSize: fontSizes.base - 1, color: calm.ink,
    backgroundColor: '#FFFFFF', marginBottom: 90,
  },

  metricCard: {
    backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: calm.border,
    borderRadius: radii.card, padding: spacing.lg, marginBottom: spacing.lg,
  },
  metricTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  metricLabel: { fontFamily: fonts.bodyBold, fontSize: fontSizes.base + 1, color: calm.forest },
  metricValue: { fontFamily: fonts.displayExtraBold, fontSize: 34 },
  metricStatus: { fontFamily: fonts.body, fontSize: fontSizes.sm, color: calm.muted, marginTop: -6, marginBottom: spacing.sm },
  metricSlider: { marginHorizontal: -4 },
  hintPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: calm.mintBg, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, marginTop: spacing.sm },
  hintText: { fontFamily: fonts.bodyMedium, fontSize: fontSizes.sm, color: calm.forest },

  savedRoot: { flex: 1, backgroundColor: calm.forest, paddingHorizontal: spacing.xl, alignItems: 'center' },
  savedCircleOuter: {
    width: 200, height: 200, borderRadius: 100,
    backgroundColor: calm.forestPanel,
    alignItems: 'center', justifyContent: 'center',
    marginTop: spacing.xxxl, marginBottom: spacing.xl,
  },
  savedCircleInner: {
    width: 130, height: 130, borderRadius: 65,
    backgroundColor: '#E4EAE6',
    borderWidth: 6, borderColor: calm.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  savedTitle: { fontFamily: fonts.displayExtraBold, fontSize: fontSizes.xxl + 10, color: '#FFFFFF', letterSpacing: -0.51 },
  savedSub: { fontFamily: fonts.body, fontSize: fontSizes.md - 1, color: calm.mutedOnDark, marginTop: spacing.sm, marginBottom: spacing.xl, textAlign: 'center' },

  savedStatsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.xl },
  savedStat: { backgroundColor: calm.forestPanel, borderRadius: radii.card - 4, padding: spacing.lg, alignItems: 'center', minWidth: 100 },
  savedStatValue: { fontFamily: fonts.bodyBold, fontSize: fontSizes.base + 1, color: calm.amber },
  savedStatLabel: { fontFamily: fonts.body, fontSize: fontSizes.xs + 1, color: calm.mutedOnDark, marginTop: 4 },

  insightCard: { backgroundColor: calm.forestPanel, borderRadius: radii.card, padding: spacing.lg, marginBottom: spacing.xl, width: '100%' },
  insightLabel: { fontFamily: fonts.bodyBold, fontSize: fontSizes.xs, color: calm.primary, letterSpacing: 0.6, marginBottom: spacing.sm },
  insightText: { fontFamily: fonts.body, fontSize: fontSizes.base - 1, color: '#E6EDE8', lineHeight: 22 },

  savedCta: { backgroundColor: calm.primary, borderRadius: radii.pill, paddingVertical: 19, alignItems: 'center', width: '100%' },
  backToToday: { fontFamily: fonts.bodyBold, fontSize: fontSizes.base - 1, color: calm.mutedOnDark },
});
