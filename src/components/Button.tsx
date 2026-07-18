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
import { colors, radii, fontSizes, fonts, spacing } from '@/theme/tokens';
import { hapticLight } from '@/utils/haptics';

type Variant = 'primary' | 'ghost';

interface ButtonProps {
  label: string;
  onPress?: (e: GestureResponderEvent) => void;
  variant?: Variant;
  fullWidth?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Button({
  label,
  onPress,
  variant = 'ghost',
  fullWidth = false,
  disabled = false,
  style,
}: ButtonProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const pressIn = () => {
    if (disabled) return;
    hapticLight();
    Animated.spring(scale, { toValue: 0.95, useNativeDriver: true, speed: 40 }).start();
  };
  const pressOut = () => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 30 }).start();
  };

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
          styles.base,
          variant === 'primary' ? styles.primary : styles.ghost,
          fullWidth && styles.fullWidth,
          style,
        ]}
      >
        <Text
          style={[styles.label, variant === 'primary' ? styles.labelPrimary : styles.labelGhost]}
        >
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
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
  ghost: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.line,
  },
  label: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.base,
  },
  labelPrimary: {
    color: '#FFFFFF',
  },
  labelGhost: {
    color: colors.ink,
  },
});
