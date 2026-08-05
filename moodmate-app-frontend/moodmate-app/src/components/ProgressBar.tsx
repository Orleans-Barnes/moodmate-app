import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, calm } from '@/theme/tokens';

interface ProgressBarProps {
  /** 0–100 */
  progress: number;
  fillColor?: string;
  trackColor?: string;
  height?: number;
  /** Gradient fill instead of a flat `fillColor` — e.g. XP/level bars. */
  gradientColors?: readonly [string, string, ...string[]];
  /** Small glowing dot at the fill's leading edge — e.g. XP/level bars. */
  glowDot?: boolean;
}

export function ProgressBar({
  progress,
  fillColor = calm.primary,
  trackColor = calm.track,
  height = 7,
  gradientColors,
  glowDot = false,
}: ProgressBarProps) {
  const widthAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: Math.max(0, Math.min(100, progress)),
      duration: 700,
      useNativeDriver: false, // width animations can't use the native driver
    }).start();
  }, [progress, widthAnim]);

  const dotColor = gradientColors ? gradientColors[gradientColors.length - 1] : fillColor;

  return (
    <View style={[styles.track, { backgroundColor: trackColor, height, borderRadius: height / 2 }]}>
      <Animated.View
        style={[
          styles.fill,
          {
            backgroundColor: gradientColors ? undefined : fillColor,
            height,
            borderRadius: height / 2,
            width: widthAnim.interpolate({
              inputRange: [0, 100],
              outputRange: ['0%', '100%'],
            }),
          },
        ]}
      >
        {gradientColors && (
          <LinearGradient
            colors={gradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[StyleSheet.absoluteFill, { borderRadius: height / 2 }]}
          />
        )}
        {glowDot && (
          <View style={[styles.glowDot, { backgroundColor: dotColor, shadowColor: dotColor }]} />
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: '100%',
    overflow: 'hidden',
  },
  fill: {
    overflow: 'visible',
  },
  glowDot: {
    position: 'absolute',
    right: -3,
    top: '50%',
    marginTop: -5,
    width: 10,
    height: 10,
    borderRadius: 5,
    shadowOpacity: 0.8,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 0 },
    elevation: 3,
  },
});
