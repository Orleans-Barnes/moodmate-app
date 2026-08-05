import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, darkPalette, fonts, fontSizes, radii, spacing } from '@/theme/tokens';
import { useResolvedAppearance } from '@/hooks/useResolvedAppearance';

export interface ToggleOption {
  key: string;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  sublabel: string;
}

interface ToggleCardsProps {
  options: [ToggleOption, ToggleOption];
  selected: string;
  onSelect: (key: string) => void;
}

/** Two big side-by-side selectable cards — used for Campus Voices/PeerConnect and Articles/Events. */
export function ToggleCards({ options, selected, onSelect }: ToggleCardsProps) {
  const { isDark } = useResolvedAppearance();

  return (
    <View style={styles.row}>
      {options.map((opt) => {
        const active = opt.key === selected;
        return (
          <Pressable
            key={opt.key}
            onPress={() => onSelect(opt.key)}
            style={[styles.card, isDark && styles.cardDark, active && styles.cardActive, active && isDark && styles.cardActiveDark]}
          >
            <Ionicons name={opt.icon} size={22} color={active ? darkPalette.primary : isDark ? darkPalette.textMuted : colors.inkSoft} />
            <Text style={[styles.label, isDark && styles.labelDark]}>{opt.label}</Text>
            <Text style={[styles.sublabel, isDark && styles.sublabelDark]}>{opt.sublabel}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.sm + 2, marginBottom: spacing.lg },
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.line,
    borderRadius: radii.md,
    paddingVertical: spacing.md + 3,
    alignItems: 'center',
  },
  cardActive: {
    borderColor: colors.coral,
    backgroundColor: colors.coralSoft,
  },
  cardDark: {
    backgroundColor: darkPalette.surface,
    borderColor: darkPalette.border,
  },
  cardActiveDark: {
    backgroundColor: darkPalette.primarySoft,
    borderColor: darkPalette.primary,
  },
  icon: { fontSize: 22, marginBottom: 6 },
  label: { fontFamily: fonts.bodyBold, fontSize: fontSizes.sm, color: colors.ink },
  sublabel: { fontFamily: fonts.bodyMedium, fontSize: 10, color: colors.inkFaint, marginTop: 2 },
  labelDark: { color: darkPalette.text },
  sublabelDark: { color: darkPalette.textMuted },
});
