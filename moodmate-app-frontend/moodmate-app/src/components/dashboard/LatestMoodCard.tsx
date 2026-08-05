import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/Card';
import { colors, spacing, fonts, fontSizes } from '@/theme/tokens';
import type { CheckInResponse, EmotionKey } from '@/api/types';

interface LatestMoodCardProps {
  /** null when there's no check-in yet today (or the fetch failed) - always render the empty
   * state in that case, never a spinner that hangs, per the audit's fail-open principle. */
  mood: CheckInResponse | null;
  onPress: () => void;
}

// Ionicons name + accent color per emotion — kept in sync with EmotionWheel.tsx.
const EMOTION_DISPLAY: Record<EmotionKey, { icon: keyof typeof Ionicons.glyphMap; label: string; color: string }> = {
  HAPPY:       { icon: 'happy-outline',        label: 'Happy',       color: '#F0B429' },
  CALM:        { icon: 'leaf-outline',          label: 'Calm',        color: '#6FA8C7' },
  HOPEFUL:     { icon: 'sunny-outline',         label: 'Hopeful',     color: '#579E65' },
  GRATEFUL:    { icon: 'heart-outline',         label: 'Grateful',    color: '#E8A0BF' },
  MOTIVATED:   { icon: 'flash-outline',         label: 'Motivated',   color: '#E08A5A' },
  ANXIOUS:     { icon: 'alert-circle-outline',  label: 'Anxious',     color: '#D2694E' },
  STRESSED:    { icon: 'warning-outline',       label: 'Stressed',    color: '#8E86BF' },
  LONELY:      { icon: 'person-outline',        label: 'Lonely',      color: '#5B6EAE' },
  OVERWHELMED: { icon: 'cloud-outline',         label: 'Overwhelmed', color: '#3D8A7D' },
  FRUSTRATED:  { icon: 'thunderstorm-outline',  label: 'Frustrated',  color: '#5C8AE6' },
};

function isToday(iso: string): boolean {
  const d = new Date(iso);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
}

export function LatestMoodCard({ mood, onPress }: LatestMoodCardProps) {
  const showEmpty = !mood || !isToday(mood.createdAt);

  if (showEmpty) {
    return (
      <Card tint="none" onPress={onPress} style={styles.card}>
        <Ionicons name="chatbubble-ellipses-outline" size={26} color={colors.inkFaint} style={styles.icon} />
        <View style={styles.textWrap}>
          <Text style={styles.label}>No check-in yet today</Text>
          <Text style={styles.sub}>Tap to log how you're feeling</Text>
        </View>
      </Card>
    );
  }

  const display = EMOTION_DISPLAY[mood.emotionKey];

  return (
    <Card tint="none" onPress={onPress} style={styles.card}>
      <View style={[styles.iconCircle, { backgroundColor: `${display.color}20` }]}>
        <Ionicons name={display.icon} size={24} color={display.color} />
      </View>
      <View style={styles.textWrap}>
        <Text style={styles.label}>{display.label} today</Text>
        <Text style={styles.sub}>Stress {mood.stressLevel}/5 · Energy {mood.energyLevel}/5</Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  iconCircle: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
    marginRight: spacing.md,
  },
  icon: {
    marginRight: spacing.md,
    opacity: 0.7,
  },
  textWrap: {
    flex: 1,
  },
  label: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.md,
    color: colors.ink,
  },
  sub: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.inkFaint,
    marginTop: 2,
  },
});
