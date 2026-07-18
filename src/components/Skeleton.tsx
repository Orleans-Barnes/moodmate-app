import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, ViewStyle, StyleProp, DimensionValue } from 'react-native';
import { colors, radii } from '@/theme/tokens';

interface SkeletonProps {
  width?: DimensionValue;
  height?: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
}

// Pulsing placeholder block used while a real-API screen is loading, instead
// of a bare spinner - shapes itself like the content that's about to land so
// the layout doesn't jump when data arrives.
export function Skeleton({ width = '100%', height = 14, radius = radii.sm, style }: SkeletonProps) {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.9, duration: 650, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 650, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View style={[styles.base, { width, height, borderRadius: radius, opacity }, style]} />
  );
}

const styles = StyleSheet.create({
  base: { backgroundColor: colors.line },
});
