import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { colors, calm, darkPalette, radii, fonts, fontSizes, spacing } from '@/theme/tokens';
import { useResolvedAppearance } from '@/hooks/useResolvedAppearance';

type ChipVariant = 'default' | 'status' | 'xp';

interface ChipProps {
  label: string;
  active?: boolean;
  onPress?: () => void;
  /**
   * default: the original bordered filter/topic pill.
   * status: borderless solid-tint pill for state pills (pending/confirmed/online/etc) —
   *   pass `tone` for the bg/text pair; falls back to the default look without one.
   * xp: borderless premium-gold pill for XP/level tags.
   */
  variant?: ChipVariant;
  /** variant="status" only — e.g. `{ bg: colors.successSoft, color: colors.success }`. */
  tone?: { bg: string; color: string };
}

export function Chip({ label, active = false, onPress, variant = 'default', tone }: ChipProps) {
  const { isDark } = useResolvedAppearance();
  const isStatus = variant === 'status';
  const isXp = variant === 'xp';

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.base,
        isDark && styles.baseDark,
        active && styles.active,
        isDark && active && styles.activeDark,
        isStatus && [styles.status, tone && { backgroundColor: tone.bg }],
        isDark && isStatus && styles.statusDark,
        isXp && styles.xp,
      ]}
    >
      <Text
        style={[
          styles.label,
          isDark && styles.labelDark,
          active && styles.labelActive,
          isStatus && tone && { color: tone.color },
          isDark && isStatus && styles.labelStatusDark,
          isXp && styles.labelXp,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: 6,
    paddingHorizontal: 13,
    borderRadius: radii.pill,
    borderWidth: 1.5,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    marginRight: spacing.xs,
    marginBottom: spacing.xs,
  },
  active: {
    backgroundColor: calm.primary,
    borderColor: calm.primary,
  },
  activeDark: {
    backgroundColor: darkPalette.primary,
    borderColor: darkPalette.primary,
  },
  baseDark: {
    backgroundColor: darkPalette.surfaceRaised,
    borderColor: darkPalette.border,
  },
  status: {
    borderWidth: 0,
    paddingVertical: 4,
    paddingHorizontal: 10,
    backgroundColor: colors.surfaceContainer,
  },
  statusDark: {
    backgroundColor: darkPalette.surfaceGreen,
  },
  xp: {
    borderWidth: 0,
    backgroundColor: colors.premiumGoldSoft,
  },
  label: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.xs,
    color: colors.inkSoft,
  },
  labelDark: {
    color: darkPalette.textMuted,
  },
  labelActive: {
    color: '#FFFFFF',
  },
  labelStatusDark: {
    color: darkPalette.text,
  },
  labelXp: {
    color: colors.sunText,
  },
});
