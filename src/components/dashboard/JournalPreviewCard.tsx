import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from '@/components/Card';
import { colors, spacing, fonts, fontSizes } from '@/theme/tokens';
import type { JournalEntryView } from '@/api/types';

interface JournalPreviewCardProps {
  /** null when the student has no journal entries yet (or the fetch failed) - render the empty
   * state rather than a loading spinner that never resolves. */
  entry: JournalEntryView | null;
  onPress: () => void;
}

function snippet(body: string, max = 80): string {
  const trimmed = body.trim();
  return trimmed.length > max ? `${trimmed.slice(0, max).trimEnd()}…` : trimmed;
}

export function JournalPreviewCard({ entry, onPress }: JournalPreviewCardProps) {
  if (!entry) {
    return (
      <Card tint="none" onPress={onPress} style={styles.card}>
        <Text style={styles.emoji}>📓</Text>
        <View style={styles.textWrap}>
          <Text style={styles.title}>No journal entries yet</Text>
          <Text style={styles.sub}>Tap to write your first one</Text>
        </View>
      </Card>
    );
  }

  return (
    <Card tint="none" onPress={onPress} style={styles.card}>
      <Text style={styles.emoji}>{entry.moodEmoji ?? '📓'}</Text>
      <View style={styles.textWrap}>
        <Text style={styles.title} numberOfLines={1}>{entry.title ?? 'Untitled entry'}</Text>
        <Text style={styles.sub} numberOfLines={2}>{snippet(entry.body)}</Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  emoji: {
    fontSize: 24,
    marginRight: spacing.md,
  },
  textWrap: {
    flex: 1,
  },
  title: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.md,
    color: colors.ink,
  },
  sub: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.inkFaint,
    marginTop: 2,
    lineHeight: 18,
  },
});
