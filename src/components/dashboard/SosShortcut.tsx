import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { colors, radii, spacing, fonts, fontSizes } from '@/theme/tokens';

interface SosShortcutProps {
  onPress: () => void;
}

/**
 * Always rendered, never gated behind any loading/error/data state - SOS must stay reachable no
 * matter what else on the dashboard failed to load (see CLAUDE.md: "Don't touch SOS, crisis
 * resources... must always stay free"). This is a plain navigation shortcut, no store dependency.
 */
export function SosShortcut({ onPress }: SosShortcutProps) {
  return (
    <Pressable onPress={onPress} style={styles.wrap} hitSlop={8}>
      <Text style={styles.icon}>🆘</Text>
      <Text style={styles.label}>Need help now? Tap for SOS resources</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.coralLight,
    borderRadius: radii.pill,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  icon: {
    fontSize: 16,
    marginRight: spacing.sm,
  },
  label: {
    flex: 1,
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.sm,
    color: colors.coralDeep,
  },
});
