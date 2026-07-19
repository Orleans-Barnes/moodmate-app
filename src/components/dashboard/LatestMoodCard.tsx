import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from '@/components/Card';
import { colors, spacing, fonts, fontSizes } from '@/theme/tokens';
import type { CheckInResponse, EmotionKey } from '@/api/types';

interface LatestMoodCardProps {
  /** null when there's no check-in yet today (or the fetch failed) - always render the empty
   * state in that case, never a spinner that hangs, per the audit's fail-open principle. */
  mood: CheckInResponse | null;
  onPress: () => void;
}

// Same emoji/label pairing as src/components/EmotionWheel.tsx, kept in sync deliberately so a
// mood shown here always matches how the student picked it on the check-in screen.
const EMOTION_DISPLAY: Record<EmotionKey, { emoji: string; label: string }> = {
  HAPPY: { emoji: '😄', label: 'Happy' },
  CALM: { emoji: '😌', label: 'Calm' },
  HOPEFUL: { emoji: '🌟', label: 'Hopeful' },
  GRATEFUL: { emoji: '🙏', label: 'Grateful' },
  MOTIVATED: { emoji: '💪', label: 'Motivated' },
  ANXIOUS: { emoji: '😰', label: 'Anxious' },
  STRESSED: { emoji: '😓', label: 'Stressed' },
  LONELY: { emoji: '😔', label: 'Lonely' },
  OVERWHELMED: { emoji: '😩', label: 'Overwhelmed' },
  FRUSTRATED: { emoji: '😤', label: 'Frustrated' },
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
        <Text style={styles.emptyEmoji}>💭</Text>
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
      <Text style={styles.emoji}>{display.emoji}</Text>
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
  emoji: {
    fontSize: 32,
    marginRight: spacing.md,
  },
  emptyEmoji: {
    fontSize: 28,
    marginRight: spacing.md,
    opacity: 0.5,
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
