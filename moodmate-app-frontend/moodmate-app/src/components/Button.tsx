import React, { useRef } from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  Animated,
  ViewStyle,
  StyleProp,
  GestureResponderEvent,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, darkPalette, radii, fontSizes, fonts, gradients } from '@/theme/tokens';
import { hapticLight } from '@/utils/haptics';
import { useResolvedAppearance } from '@/hooks/useResolvedAppearance';

type Variant = 'primary' | 'secondary' | 'ghost' | 'gradient';

interface ButtonProps {
  label: string;
  onPress?: (e: GestureResponderEvent) => void;
  variant?: Variant;
  fullWidth?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  /** Only used when variant="gradient". Defaults to the brand coral CTA gradient. */
  gradientColors?: readonly [string, string, ...string[]];
}

export function Button({
  label,
  onPress,
  variant = 'ghost',
  fullWidth = false,
  disabled = false,
  style,
  gradientColors = gradients.coralBtn,
}: ButtonProps) {
  const { isDark } = useResolvedAppearance();
  const scale = useRef(new Animated.Value(1)).current;

  const pressIn = () => {
    if (disabled) return;
    hapticLight();
    Animated.spring(scale, { toValue: 0.95, useNativeDriver: true, speed: 40 }).start();
  };
  const pressOut = () => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 30 }).start();
  };

  const labelStyle = [
    styles.label,
    variant === 'primary' || variant === 'gradient'
      ? styles.labelPrimary
      : variant === 'secondary'
      ? [styles.labelSecondary, isDark && styles.labelSecondaryDark]
      : [styles.labelGhost, isDark && styles.labelGhostDark],
  ];

  return (
    <Animated.View
      style={[
        { transform: [{ scale }] },
        fullWidth && styles.fullWidth,
        disabled && styles.disabled,
      ]}
    >
      <Pressable
        onPress={onPress}
        onPressIn={pressIn}
        onPressOut={pressOut}
        disabled={disabled}
        style={[
          variant !== 'gradient' && styles.base,
          variant === 'primary'
            ? [styles.primary, isDark && styles.primaryDark]
            : variant === 'secondary'
              ? [styles.secondary, isDark && styles.secondaryDark]
              : variant === 'ghost'
                ? [styles.ghost, isDark && styles.ghostDark]
                : styles.gradientShadow,
          fullWidth && styles.fullWidth,
          style,
        ]}
      >
        {variant === 'gradient' ? (
          <LinearGradient
            colors={gradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.base, fullWidth && styles.fullWidth]}
          >
            <Text style={labelStyle}>{label}</Text>
          </LinearGradient>
        ) : (
          <Text style={labelStyle}>{label}</Text>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: radii.pill,
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.45,
  },
  primary: {
    backgroundColor: colors.coral,
    shadowColor: colors.coral,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 4,
  },
  primaryDark: {
    backgroundColor: darkPalette.primary,
    shadowColor: darkPalette.primary,
  },
  secondary: {
    backgroundColor: colors.sageSoft,
  },
  secondaryDark: {
    backgroundColor: darkPalette.primarySoft,
    borderWidth: 1,
    borderColor: darkPalette.border,
  },
  ghost: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.line,
  },
  ghostDark: {
    backgroundColor: darkPalette.surfaceRaised,
    borderColor: darkPalette.border,
  },
  gradientShadow: {
    borderRadius: radii.pill,
    overflow: 'hidden',
    shadowColor: colors.coral,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 4,
  },
  label: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.base,
  },
  labelPrimary: {
    color: '#FFFFFF',
  },
  labelSecondary: {
    color: colors.ink,
  },
  labelSecondaryDark: {
    color: darkPalette.text,
  },
  labelGhost: {
    color: colors.ink,
  },
  labelGhostDark: {
    color: darkPalette.text,
  },
});
