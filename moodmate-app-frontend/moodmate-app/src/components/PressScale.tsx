import React, { useRef } from 'react';
import {
  Animated,
  Pressable,
  StyleProp,
  ViewStyle,
  GestureResponderEvent,
} from 'react-native';

interface PressScaleProps {
  children: React.ReactNode;
  onPress?: (e: GestureResponderEvent) => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  /** How far to shrink on press. Default 0.97. */
  pressedScale?: number;
  accessibilityRole?: 'button' | 'link' | 'none';
  accessibilityLabel?: string;
}

/** Native-driver spring press — same vocabulary Home quick-actions use. */
export function PressScale({
  children,
  onPress,
  disabled,
  style,
  pressedScale = 0.97,
  accessibilityRole = 'button',
  accessibilityLabel,
}: PressScaleProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const pressIn = () => {
    if (disabled) return;
    Animated.spring(scale, { toValue: pressedScale, speed: 55, bounciness: 0, useNativeDriver: true }).start();
  };
  const pressOut = () => {
    Animated.spring(scale, { toValue: 1, speed: 28, bounciness: 6, useNativeDriver: true }).start();
  };

  return (
    <Animated.View style={[{ transform: [{ scale }] }, style]}>
      <Pressable
        onPress={onPress}
        onPressIn={pressIn}
        onPressOut={pressOut}
        disabled={disabled}
        accessibilityRole={accessibilityRole}
        accessibilityLabel={accessibilityLabel}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}
