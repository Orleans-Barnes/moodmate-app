import React, { ReactNode } from 'react';
import { View, StyleSheet, ViewStyle, StyleProp, Pressable } from 'react-native';
import { colors, radii, spacing } from '@/theme/tokens';
import { hapticLight } from '@/utils/haptics';

type Tint = 'none' | 'coral' | 'sage' | 'blue' | 'lavender' | 'sun';

interface CardProps {
  children: ReactNode;
  tint?: Tint;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

const tintColors: Record<Tint, string | undefined> = {
  none: colors.surface,
  coral: colors.coralSoft,
  sage: colors.sageSoft,
  blue: colors.blueSoft,
  lavender: colors.lavenderSoft,
  sun: colors.sunSoft,
};

export function Card({ children, tint = 'none', onPress, style }: CardProps) {
  const content = (
    <View
      style={[
        styles.base,
        { backgroundColor: tintColors[tint] },
        tint === 'none' && styles.bordered,
        style,
      ]}
    >
      {children}
    </View>
  );

  if (!onPress) return content;

  const handlePress = () => {
    hapticLight();
    onPress();
  };

  return (
    <Pressable onPress={handlePress} style={({ pressed }) => pressed && styles.pressed}>
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radii.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  bordered: {
    borderWidth: 1,
    borderColor: colors.line,
  },
  pressed: {
    opacity: 0.92,
  },
});
