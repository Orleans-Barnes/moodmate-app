import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { colors, radii, fonts, fontSizes, spacing } from '@/theme/tokens';

interface ChipProps {
  label: string;
  active?: boolean;
  onPress?: () => void;
}

export function Chip({ label, active = false, onPress }: ChipProps) {
  return (
    <Pressable onPress={onPress} style={[styles.base, active && styles.active]}>
      <Text style={[styles.label, active && styles.labelActive]}>{label}</Text>
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
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },
  label: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.xs,
    color: colors.inkSoft,
  },
  labelActive: {
    color: '#FFFFFF',
  },
});
