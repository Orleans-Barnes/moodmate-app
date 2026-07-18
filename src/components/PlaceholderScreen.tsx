import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { ScreenHeader } from './ScreenHeader';
import { colors, fonts, fontSizes, spacing, radii } from '@/theme/tokens';

interface PlaceholderScreenProps {
  title: string;
  /** Bullet list summarizing what this screen needs to contain, taken from the HTML prototype. */
  todo: string[];
  onClose?: () => void;
}

/**
 * Used for screens not yet fully ported from MoodMate_Headspace_Style_UI.html.
 * Each one is fully wired into navigation already — only the visual content
 * still needs to be built out, following the patterns established in
 * HomeScreen.tsx / WellnessTreeScreen.tsx / LoginScreen.tsx.
 */
export function PlaceholderScreen({ title, todo, onClose }: PlaceholderScreenProps) {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {onClose ? (
        <ScreenHeader title={title} onClose={onClose} />
      ) : (
        <Text style={styles.heading}>{title}</Text>
      )}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>🚧 Not yet ported from the prototype</Text>
        <Text style={styles.cardSub}>This screen exists and navigates correctly — port the UI from the HTML prototype next:</Text>
        {todo.map((item) => (
          <View key={item} style={styles.todoRow}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.todoText}>{item}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  heading: {
    fontFamily: fonts.display,
    fontSize: fontSizes.xxl,
    color: colors.ink,
    marginBottom: spacing.md,
  },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radii.md,
    padding: spacing.lg,
  },
  cardTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.base,
    color: colors.ink,
    marginBottom: 6,
  },
  cardSub: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.sm,
    color: colors.inkSoft,
    marginBottom: spacing.md,
    lineHeight: 19,
  },
  todoRow: { flexDirection: 'row', gap: 6, marginBottom: 6 },
  bullet: { color: colors.sage, fontFamily: fonts.bodyBold },
  todoText: { flex: 1, fontFamily: fonts.body, fontSize: fontSizes.sm, color: colors.inkSoft },
});
