import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { darkPalette, fonts, fontSizes, radii, spacing, calm } from '@/theme/tokens';
import { useResolvedAppearance } from '@/hooks/useResolvedAppearance';

interface OptionRowProps {
  label: string;
  sublabel?: string;
  selected: boolean;
  onPress: () => void;
  /** 'check' — filled circular checkmark on the right (multi-select, e.g. wellness goals).
   *  'radio' — a leading colored dot + a radio circle on the right (single-select, e.g. year of study). */
  mode?: 'check' | 'radio';
  /** 'radio' mode only — the small leading dot's color. */
  dotColor?: string;
}

/** The full-width selectable row used across the Calm Forest onboarding/profile-setup flow. */
export function OptionRow({ label, sublabel, selected, onPress, mode = 'check', dotColor }: OptionRowProps) {
  const { isDark } = useResolvedAppearance();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole={mode === 'check' ? 'checkbox' : 'radio'}
      accessibilityState={{ checked: selected }}
      style={[s.row, isDark && s.rowDark, selected && s.rowActive, selected && isDark && s.rowActiveDark]}
    >
      {mode === 'radio' && dotColor && <View style={[s.dot, { backgroundColor: dotColor }]} />}
      <View style={s.textCol}>
        <Text style={[s.label, isDark && s.labelDark]}>{label}</Text>
        {sublabel ? <Text style={[s.sublabel, isDark && s.sublabelDark]}>{sublabel}</Text> : null}
      </View>
      {mode === 'check' ? (
        <View style={[s.check, isDark && s.checkDark, selected && s.checkActive]}>
          {selected && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
        </View>
      ) : (
        <View style={[s.radio, isDark && s.checkDark, selected && s.radioActive]}>
          {selected && <View style={s.radioDot} />}
        </View>
      )}
    </Pressable>
  );
}

const s = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 58,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radii.lg + 2,
    borderWidth: 1.5,
    borderColor: calm.border,
    backgroundColor: '#FFFFFF',
  },
  rowActive: {
    backgroundColor: calm.mintBg,
    borderColor: calm.primary,
  },
  rowDark: {
    backgroundColor: darkPalette.surface,
    borderColor: darkPalette.border,
  },
  rowActiveDark: {
    backgroundColor: darkPalette.primarySoft,
    borderColor: darkPalette.primary,
  },
  dot: { width: 14, height: 14, borderRadius: 7 },
  textCol: { flex: 1, gap: 2 },
  label: { fontFamily: fonts.bodyBold, fontSize: fontSizes.base, color: calm.forest },
  sublabel: { fontFamily: fonts.body, fontSize: fontSizes.sm, color: calm.muted },
  labelDark: { color: darkPalette.text },
  sublabelDark: { color: darkPalette.textMuted },

  check: {
    width: 24, height: 24, borderRadius: 12,
    borderWidth: 1.5, borderColor: calm.border,
    alignItems: 'center', justifyContent: 'center',
  },
  checkDark: { borderColor: darkPalette.border },
  checkActive: { backgroundColor: calm.primary, borderColor: calm.primary },

  radio: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 1.5, borderColor: calm.border,
    alignItems: 'center', justifyContent: 'center',
  },
  radioActive: { borderColor: calm.primary },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: calm.primary },
});
