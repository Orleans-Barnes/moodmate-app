import React, { useRef, useState } from 'react';
import {
  View, Text, ScrollView, TextInput, StyleSheet,
  Pressable, Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Slider from '@react-native-community/slider';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { ScreenHeader } from '@/components/ScreenHeader';
import { EmotionWheel, Emotion } from '@/components/EmotionWheel';
import { ConfettiBurst, ConfettiHandle } from '@/components/Confetti';
import { useAuthStore } from '@/state/useAuthStore';
import { useToast } from '@/state/useToast';
import { recordCheckIn } from '@/api/checkin';
import { ApiRequestError } from '@/api/client';
import type { EmotionKey } from '@/api/types';
import { colors, fonts, fontSizes, radii, spacing, shadow } from '@/theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'CheckIn'>;

const STRESS_LABELS = ['Low', 'Mild', 'Moderate', 'High', 'Severe'];
const ENERGY_LABELS = ['Drained', 'Low', 'Steady', 'High', 'Buzzing'];

const QUICK_MOODS = [
  { emoji: '😄', label: 'Happy',    color: '#FFD93D' },
  { emoji: '😌', label: 'Calm',     color: '#5F9E7C' },
  { emoji: '😐', label: 'Neutral',  color: '#8E7BC0' },
  { emoji: '😟', label: 'Anxious',  color: '#5C8AE6' },
  { emoji: '😢', label: 'Sad',      color: '#7BA7BC' },
  { emoji: '😤', label: 'Angry',    color: '#FF6F4D' },
];

const TODAY_LABEL = new Date().toLocaleDateString('en-US', {
  weekday: 'long', month: 'long', day: 'numeric',
});

function SliderSection({
  label, value, onChange, min, max, labels, color,
}: {
  label: string; value: number; onChange: (v: number) => void;
  min: number; max: number; labels: string[]; color: string;
}) {
  const idx = Math.round(value) - min;
  return (
    <View style={s.sliderCard}>
      <View style={s.sliderTop}>
        <Text style={s.sliderLabel}>{label}</Text>
        <View style={[s.sliderBadge, { backgroundColor: color + '22' }]}>
          <Text style={[s.sliderBadgeText, { color }]}>{labels[idx]}</Text>
        </View>
      </View>
      <Slider
        minimumValue={min}
        maximumValue={max}
        step={1}
        value={value}
        onValueChange={onChange}
        minimumTrackTintColor={color}
        maximumTrackTintColor={colors.line}
        thumbTintColor={color}
        style={{ marginHorizontal: -4 }}
      />
      <View style={s.sliderTicks}>
        {labels.map((l) => (
          <Text key={l} style={s.sliderTick}>{l}</Text>
        ))}
      </View>
    </View>
  );
}

export function CheckInScreen({ navigation }: Props) {
  const [selected, setSelected] = useState<Emotion | null>(null);
  const [stress, setStress] = useState(2);
  const [energy, setEnergy] = useState(2);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const token = useAuthStore((s) => s.token);
  const toast = useToast();
  const confettiRef = useRef<ConfettiHandle>(null);
  const btnScale = useRef(new Animated.Value(1)).current;

  const handleSave = async () => {
    if (!selected || !token) return;
    Animated.sequence([
      Animated.timing(btnScale, { toValue: 0.95, duration: 80, useNativeDriver: true }),
      Animated.spring(btnScale, { toValue: 1, useNativeDriver: true, friction: 4 }),
    ]).start();
    setSaving(true);
    try {
      await recordCheckIn(token, {
        emotionKey: selected.label.toUpperCase() as EmotionKey,
        stressLevel: Math.round(stress),
        energyLevel: Math.round(energy),
        note: note.trim() || undefined,
      });
      confettiRef.current?.fire();
      toast(`Mood logged — ${selected.label} 🌱`);
      setTimeout(() => navigation.goBack(), 500);
    } catch (err) {
      toast(err instanceof ApiRequestError ? err.message : 'Could not save your check-in.');
    } finally {
      setSaving(false);
    }
  };

  const canSave = !!selected && !saving;

  return (
    <View style={s.root}>
      {/* Gradient top */}
      <LinearGradient
        colors={['#FF6F4D', '#FF9A7A', '#FFF5F2']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.4, y: 1 }}
        style={s.headerGrad}
      >
        <ScreenHeader title="" onClose={() => navigation.goBack()} />
        <Text style={s.headline}>How are you{'\n'}feeling today?</Text>
        <Text style={s.sub}>{TODAY_LABEL}</Text>
      </LinearGradient>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Quick mood row */}
        <Text style={s.sectionLabel}>Pick your mood</Text>
        <View style={s.moodRow}>
          {QUICK_MOODS.map((m) => {
            const isActive = selected?.label === m.label;
            return (
              <Pressable
                key={m.label}
                style={[s.moodChip, isActive && { backgroundColor: m.color + '22', borderColor: m.color }]}
                onPress={() => setSelected({ label: m.label } as Emotion)}
              >
                <Text style={s.moodEmoji}>{m.emoji}</Text>
                <Text style={[s.moodChipLabel, isActive && { color: m.color }]}>{m.label}</Text>
              </Pressable>
            );
          })}
        </View>

        {/* Full emotion wheel */}
        <Text style={s.sectionLabel}>Or explore emotions</Text>
        <EmotionWheel selected={selected} onSelect={setSelected} />

        {/* Sliders */}
        <Text style={s.sectionLabel}>How's your body?</Text>
        <SliderSection
          label="Stress level"
          value={stress}
          onChange={setStress}
          min={1}
          max={5}
          labels={STRESS_LABELS}
          color={colors.coral}
        />
        <SliderSection
          label="Energy level"
          value={energy}
          onChange={setEnergy}
          min={1}
          max={5}
          labels={ENERGY_LABELS}
          color={colors.sage}
        />

        {/* Note */}
        <Text style={s.sectionLabel}>Add a note <Text style={s.optional}>(optional)</Text></Text>
        <TextInput
          style={s.noteBox}
          placeholder="What's on your mind?"
          placeholderTextColor={colors.inkFaint}
          multiline
          numberOfLines={3}
          value={note}
          onChangeText={setNote}
        />

        {/* Save button */}
        <Animated.View style={{ transform: [{ scale: btnScale }] }}>
          <Pressable onPress={handleSave} disabled={!canSave}>
            <LinearGradient
              colors={canSave ? ['#FF6F4D', '#FF8F6F'] : ['#CCCCCC', '#AAAAAA']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={s.saveBtn}
            >
              <Text style={s.saveBtnText}>
                {saving ? 'Saving…' : selected ? `Log mood — ${selected.label}` : 'Select a mood first'}
              </Text>
            </LinearGradient>
          </Pressable>
        </Animated.View>
      </ScrollView>
      <ConfettiBurst ref={confettiRef} />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },

  headerGrad: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
  headline: {
    fontFamily: fonts.display,
    fontSize: fontSizes.display,
    color: '#FFFFFF',
    marginTop: spacing.xs,
    lineHeight: 32,
  },
  sub: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.sm,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },

  scroll: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: 48, gap: spacing.sm },

  sectionLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.md,
    color: colors.ink,
    marginTop: spacing.sm,
  },
  optional: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.sm,
    color: colors.inkFaint,
  },

  // Quick mood chips
  moodRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  moodChip: {
    flex: 1,
    minWidth: 80,
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    gap: 4,
    ...shadow.sm,
  },
  moodEmoji: { fontSize: 26 },
  moodChipLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.xs,
    color: colors.inkSoft,
  },

  // Slider card
  sliderCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.lg,
    ...shadow.sm,
  },
  sliderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  sliderLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.base,
    color: colors.ink,
  },
  sliderBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
  },
  sliderBadgeText: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.xs,
  },
  sliderTicks: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  sliderTick: {
    fontFamily: fonts.bodyMedium,
    fontSize: 9,
    color: colors.inkFaint,
    flex: 1,
    textAlign: 'center',
  },

  // Note
  noteBox: {
    borderWidth: 1.5,
    borderColor: colors.line,
    borderRadius: radii.md,
    padding: spacing.md,
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    backgroundColor: colors.surface,
    color: colors.ink,
    minHeight: 80,
    textAlignVertical: 'top',
    ...shadow.sm,
  },

  // Save button
  saveBtn: {
    borderRadius: radii.pill,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  saveBtnText: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.base,
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
});
