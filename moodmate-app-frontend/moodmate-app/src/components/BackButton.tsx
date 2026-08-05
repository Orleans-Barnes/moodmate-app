import React from 'react';
import { Pressable, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { calm } from '@/theme/tokens';

interface BackButtonProps {
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  /** White-on-dark variant for screens with a forest-green header (e.g. profile setup). */
  inverted?: boolean;
}

/** The 44×44 bordered circular ‹ back button used across the Calm Forest auth/check-in flow. */
export function BackButton({ onPress, style, inverted = false }: BackButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel="Back"
      style={[styles.base, inverted && styles.inverted, style]}
    >
      <Text style={[styles.chevron, inverted && styles.chevronInverted]}>‹</Text>
    </Pressable>
  );
}

const SIZE = 44;

const styles = StyleSheet.create({
  base: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: calm.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inverted: {
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderColor: 'rgba(255,255,255,0.24)',
  },
  chevron: {
    fontSize: 24,
    fontWeight: '700',
    color: calm.forest,
    marginTop: -2,
  },
  chevronInverted: {
    color: '#FFFFFF',
  },
});
