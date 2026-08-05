import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors, fonts, fontSizes, radii, spacing } from '@/theme/tokens';

export interface ToggleOption {
  key: string;
  icon: string;
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
  return (
    <View style={styles.row}>
      {options.map((opt) => {
        const active = opt.key === selected;
        return (
          <Pressable
            key={opt.key}
            onPress={() => onSelect(opt.key)}
            style={[styles.card, active && styles.cardActive]}
          >
            <Text style={styles.icon}>{opt.icon}</Text>
            <Text style={styles.label}>{opt.label}</Text>
            <Text style={styles.sublabel}>{opt.sublabel}</Text>
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
  icon: { fontSize: 22, marginBottom: 6 },
  label: { fontFamily: fonts.bodyBold, fontSize: fontSizes.sm, color: colors.ink },
  sublabel: { fontFamily: fonts.bodyMedium, fontSize: 10, color: colors.inkFaint, marginTop: 2 },
});
