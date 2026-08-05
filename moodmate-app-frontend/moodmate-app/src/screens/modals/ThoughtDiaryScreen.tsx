/**
 * ThoughtDiaryScreen — CBT Thought Record
 *
 * Based on standard CBT Thought Records (Beck, 1979) used in Wysa, Woebot, and clinical practice.
 * Five-step flow:
 *   1. Situation — What happened? When/where?
 *   2. Emotions  — What did you feel? Rate intensity 1–10
 *   3. Hot Thought — The strongest automatic thought
 *   4. Evidence  — For and against that thought
 *   5. Balanced Thought — A more balanced perspective + re-rate emotion
 */
import React, { useRef, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  Pressable, Animated, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { colors, fonts, fontSizes, spacing, radii, shadow, accents } from '@/theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'ThoughtDiary'>;

type Step = 0 | 1 | 2 | 3 | 4;

const STEPS = [
  { title: 'The Situation',     subtitle: 'Briefly describe what happened.',                  hint: 'e.g. "I got a bad grade on my assignment and my friend didn\'t text back."',     icon: 'location-outline' as const },
  { title: 'Your Emotions',     subtitle: 'What feelings came up? How intense (1–10)?',      hint: 'e.g. "Anxious (8/10), Sad (6/10)"',                                            icon: 'heart-outline' as const },
  { title: 'The Hot Thought',   subtitle: 'What was the strongest thought in that moment?',  hint: 'e.g. "I\'m going to fail this semester. Everyone hates me."',                   icon: 'flash-outline' as const },
  { title: 'Examining Evidence',subtitle: 'What supports that thought? What contradicts it?', hint: 'For: "I did fail last quiz." Against: "I passed three others. My friend is just busy."', icon: 'search-outline' as const },
  { title: 'Balanced Thought',  subtitle: 'Write a more balanced, compassionate perspective.', hint: 'e.g. "One bad grade doesn\'t define my semester. I can get help and try again."', icon: 'leaf-outline' as const },
];

// Each CBT step draws from the shared semantic accent table (tokens.ts) instead of an ad-hoc
// rainbow, so the wizard still reads as 5 distinct stages while staying inside the app's
// curated content palette.
const STEP_COLORS: [string, string][] = [
  [accents.learning.pressed, accents.learning.accent],
  [accents.anxiety.pressed, accents.anxiety.accent],
  [accents.energy.pressed, accents.energy.accent],
  [accents.creativity.pressed, accents.creativity.accent],
  [accents.wellness.pressed, accents.wellness.accent],
];

const EMOTION_CHIPS = ['Anxious', 'Sad', 'Angry', 'Ashamed', 'Guilty', 'Scared', 'Hopeless', 'Frustrated', 'Lonely', 'Overwhelmed'];

export function ThoughtDiaryScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<Step>(0);
  const slideAnim = useRef(new Animated.Value(0)).current;

  const [situation, setSituation]           = useState('');
  const [emotions, setEmotions]             = useState('');
  const [selectedEmotions, setSelectedEmotions] = useState<string[]>([]);
  const [intensity, setIntensity]           = useState(5);
  const [hotThought, setHotThought]         = useState('');
  const [evidenceFor, setEvidenceFor]       = useState('');
  const [evidenceAgainst, setEvidenceAgainst] = useState('');
  const [balancedThought, setBalancedThought] = useState('');
  const [newIntensity, setNewIntensity]     = useState(3);

  const goNext = () => {
    if (step < 4) {
      Animated.sequence([
        Animated.timing(slideAnim, { toValue: -30, duration: 150, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
      setStep((s) => (s + 1) as Step);
    } else {
      handleFinish();
    }
  };

  const goBack = () => {
    if (step > 0) {
      setStep((s) => (s - 1) as Step);
    } else {
      navigation.goBack();
    }
  };

  const handleFinish = () => {
    Alert.alert(
      'Thought record saved',
      "Great work challenging that thought. Remember: a balanced perspective doesn't mean toxic positivity — it means being fair to yourself.",
      [{ text: 'Done', onPress: () => navigation.goBack() }],
    );
  };

  const toggleEmotion = (e: string) => {
    setSelectedEmotions((prev) => prev.includes(e) ? prev.filter((x) => x !== e) : [...prev, e]);
  };

  const stepInfo = STEPS[step];
  const [c1, c2] = STEP_COLORS[step];

  const canProgress = () => {
    switch (step) {
      case 0: return situation.trim().length > 5;
      case 1: return selectedEmotions.length > 0 || emotions.trim().length > 0;
      case 2: return hotThought.trim().length > 5;
      case 3: return evidenceFor.trim().length > 3 || evidenceAgainst.trim().length > 3;
      case 4: return balancedThought.trim().length > 10;
    }
  };

  return (
    <KeyboardAvoidingView
      style={[s.root, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header gradient */}
      <LinearGradient colors={[c1, c2]} style={s.header}>
        <Pressable onPress={goBack} hitSlop={12} style={s.backBtn}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </Pressable>
        <View style={s.headerCenter}>
          <Ionicons name={stepInfo.icon} size={22} color="rgba(255,255,255,0.9)" />
          <Text style={s.headerTitle}>{stepInfo.title}</Text>
        </View>
        <Text style={s.stepCount}>{step + 1}/5</Text>
      </LinearGradient>

      {/* Progress bar */}
      <View style={s.progressTrack}>
        <Animated.View style={[s.progressFill, { width: `${((step + 1) / 5) * 100}%` as any, backgroundColor: c2 }]} />
      </View>

      <ScrollView
        contentContainerStyle={[s.body, { paddingBottom: insets.bottom + 80 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ transform: [{ translateX: slideAnim }] }}>
          <Text style={s.subtitle}>{stepInfo.subtitle}</Text>
          <Text style={s.hint}>{stepInfo.hint}</Text>

          {/* ── Step 0: Situation ── */}
          {step === 0 && (
            <TextInput
              style={s.textArea}
              value={situation}
              onChangeText={setSituation}
              placeholder="Describe the situation..."
              placeholderTextColor={colors.inkFaint}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
              autoFocus
            />
          )}

          {/* ── Step 1: Emotions ── */}
          {step === 1 && (
            <>
              <Text style={s.subLabel}>Tap all that apply</Text>
              <View style={s.chipGrid}>
                {EMOTION_CHIPS.map((e) => {
                  const active = selectedEmotions.includes(e);
                  return (
                    <Pressable
                      key={e}
                      style={[s.chip, active && { backgroundColor: c2, borderColor: c2 }]}
                      onPress={() => toggleEmotion(e)}
                    >
                      <Text style={[s.chipTxt, active && s.chipTxtActive]}>{e}</Text>
                    </Pressable>
                  );
                })}
              </View>
              <Text style={s.subLabel}>Other emotions (optional)</Text>
              <TextInput
                style={s.inputLine}
                value={emotions}
                onChangeText={setEmotions}
                placeholder="e.g. Embarrassed, Confused..."
                placeholderTextColor={colors.inkFaint}
              />
              <Text style={s.subLabel}>Overall intensity: {intensity}/10</Text>
              <View style={s.sliderRow}>
                {[1,2,3,4,5,6,7,8,9,10].map((n) => (
                  <Pressable
                    key={n}
                    style={[s.sliderDot, { backgroundColor: n <= intensity ? c2 : colors.line }]}
                    onPress={() => setIntensity(n)}
                  >
                    <Text style={[s.sliderNum, n <= intensity && { color: '#fff' }]}>{n}</Text>
                  </Pressable>
                ))}
              </View>
            </>
          )}

          {/* ── Step 2: Hot Thought ── */}
          {step === 2 && (
            <>
              <View style={s.infoBox}>
                <Ionicons name="bulb-outline" size={16} color={accents.learning.pressed} />
                <Text style={s.infoText}>A "hot thought" is the most distressing thought you had — the one that made your emotions spike.</Text>
              </View>
              <TextInput
                style={s.textArea}
                value={hotThought}
                onChangeText={setHotThought}
                placeholder="What was the strongest thought?"
                placeholderTextColor={colors.inkFaint}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                autoFocus
              />
            </>
          )}

          {/* ── Step 3: Evidence ── */}
          {step === 3 && (
            <>
              <Text style={s.subLabel}>Evidence that supports the thought</Text>
              <TextInput
                style={[s.textArea, { marginBottom: spacing.md }]}
                value={evidenceFor}
                onChangeText={setEvidenceFor}
                placeholder="Facts that seem to confirm it..."
                placeholderTextColor={colors.inkFaint}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
              <Text style={s.subLabel}>Evidence that contradicts it</Text>
              <TextInput
                style={s.textArea}
                value={evidenceAgainst}
                onChangeText={setEvidenceAgainst}
                placeholder="Facts that challenge or disprove it..."
                placeholderTextColor={colors.inkFaint}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
              <View style={s.infoBox}>
                <Ionicons name="search-outline" size={16} color={accents.learning.pressed} />
                <Text style={s.infoText}>Look for: past experiences, what a friend would say, whether you're catastrophising.</Text>
              </View>
            </>
          )}

          {/* ── Step 4: Balanced Thought + re-rate ── */}
          {step === 4 && (
            <>
              <View style={s.infoBox}>
                <Ionicons name="leaf-outline" size={16} color={accents.learning.pressed} />
                <Text style={s.infoText}>A balanced thought isn't forced positivity — it's a fair, compassionate statement that takes all the evidence into account.</Text>
              </View>
              <TextInput
                style={[s.textArea, { marginBottom: spacing.xl }]}
                value={balancedThought}
                onChangeText={setBalancedThought}
                placeholder="Write a kinder, more balanced version..."
                placeholderTextColor={colors.inkFaint}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                autoFocus
              />
              <Text style={s.subLabel}>Re-rate your emotion intensity: {newIntensity}/10</Text>
              <View style={s.sliderRow}>
                {[1,2,3,4,5,6,7,8,9,10].map((n) => (
                  <Pressable
                    key={n}
                    style={[s.sliderDot, { backgroundColor: n <= newIntensity ? c2 : colors.line }]}
                    onPress={() => setNewIntensity(n)}
                  >
                    <Text style={[s.sliderNum, n <= newIntensity && { color: '#fff' }]}>{n}</Text>
                  </Pressable>
                ))}
              </View>
              {newIntensity < intensity && (
                <View style={[s.infoBox, { backgroundColor: accents.wellness.soft, marginTop: spacing.lg }]}>
                  <Ionicons name="checkmark-circle" size={16} color={accents.wellness.pressed} />
                  <Text style={[s.infoText, { color: accents.wellness.pressed }]}>
                    Your emotion dropped from {intensity}/10 to {newIntensity}/10. That's the power of challenging unhelpful thoughts.
                  </Text>
                </View>
              )}
            </>
          )}
        </Animated.View>
      </ScrollView>

      {/* Bottom CTA */}
      <View style={[s.footer, { paddingBottom: insets.bottom + spacing.md }]}>
        <Pressable
          style={[s.nextBtn, { backgroundColor: canProgress() ? c2 : colors.line }]}
          onPress={goNext}
          disabled={!canProgress()}
        >
          <Text style={s.nextBtnTxt}>{step === 4 ? 'Complete ✓' : 'Next →'}</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  backBtn: { padding: 4 },
  headerCenter: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  headerTitle: { fontFamily: fonts.display, fontSize: fontSizes.md, color: '#fff' },
  stepCount: { fontFamily: fonts.bodyBold, fontSize: fontSizes.xs, color: 'rgba(255,255,255,0.7)' },

  progressTrack: { height: 3, backgroundColor: colors.line },
  progressFill: { height: 3, borderRadius: 2 },

  body: { padding: spacing.xl },
  subtitle: { fontFamily: fonts.display, fontSize: fontSizes.lg, color: colors.ink, marginBottom: spacing.xs },
  hint: {
    fontFamily: fonts.bodyMedium, fontSize: fontSizes.sm,
    color: colors.inkSoft, lineHeight: 20, marginBottom: spacing.xl,
    fontStyle: 'italic',
  },
  subLabel: {
    fontFamily: fonts.bodyBold, fontSize: fontSizes.xs,
    color: colors.inkFaint, letterSpacing: 0.4,
    textTransform: 'uppercase', marginBottom: spacing.sm,
  },
  textArea: {
    backgroundColor: colors.surface,
    borderWidth: 1.5, borderColor: colors.line,
    borderRadius: radii.md,
    padding: spacing.lg,
    fontFamily: fonts.body, fontSize: fontSizes.base, color: colors.ink,
    minHeight: 110, textAlignVertical: 'top',
  },
  inputLine: {
    backgroundColor: colors.surface,
    borderWidth: 1.5, borderColor: colors.line,
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg, paddingVertical: 12,
    fontFamily: fonts.body, fontSize: fontSizes.base, color: colors.ink,
    marginBottom: spacing.lg,
  },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.xl },
  chip: {
    paddingHorizontal: spacing.md, paddingVertical: 8,
    borderRadius: radii.pill, borderWidth: 1.5, borderColor: colors.line,
    backgroundColor: colors.surface,
  },
  chipTxt: { fontFamily: fonts.bodyMedium, fontSize: fontSizes.sm, color: colors.inkSoft },
  chipTxtActive: { color: '#fff' },

  sliderRow: { flexDirection: 'row', gap: 4, flexWrap: 'wrap', marginBottom: spacing.lg },
  sliderDot: {
    width: 30, height: 30, borderRadius: 15,
    alignItems: 'center', justifyContent: 'center',
  },
  sliderNum: { fontFamily: fonts.bodyBold, fontSize: 11, color: colors.inkSoft },

  infoBox: {
    flexDirection: 'row', gap: spacing.sm,
    backgroundColor: accents.learning.soft, borderRadius: radii.sm,
    padding: spacing.md, marginBottom: spacing.lg,
  },
  infoText: { flex: 1, fontFamily: fonts.bodyMedium, fontSize: fontSizes.sm, color: accents.learning.pressed, lineHeight: 20 },

  footer: {
    paddingHorizontal: spacing.xl, paddingTop: spacing.md,
    borderTopWidth: 1, borderTopColor: colors.line,
    backgroundColor: colors.bg,
  },
  nextBtn: {
    borderRadius: radii.pill, paddingVertical: 16,
    alignItems: 'center', ...shadow.sm,
  },
  nextBtnTxt: { fontFamily: fonts.bodyBold, fontSize: fontSizes.base, color: '#fff', letterSpacing: 0.3 },
});
