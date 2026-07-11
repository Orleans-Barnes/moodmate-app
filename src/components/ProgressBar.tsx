import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { colors } from '@/theme/tokens';

interface ProgressBarProps {
  /** 0–100 */
  progress: number;
  fillColor?: string;
  trackColor?: string;
  height?: number;
}

export function ProgressBar({
  progress,
  fillColor = colors.sage,
  trackColor = 'rgba(0,0,0,0.06)',
  height = 7,
}: ProgressBarProps) {
  const widthAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: Math.max(0, Math.min(100, progress)),
      duration: 700,
      useNativeDriver: false, // width animations can't use the native driver
    }).start();
  }, [progress, widthAnim]);

  return (
    <View style={[styles.track, { backgroundColor: trackColor, height, borderRadius: height / 2 }]}>
      <Animated.View
        style={[
          styles.fill,
          {
            backgroundColor: fillColor,
            height,
            borderRadius: height / 2,
            width: widthAnim.interpolate({
              inputRange: [0, 100],
              outputRange: ['0%', '100%'],
            }),
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: '100%',
    overflow: 'hidden',
  },
  fill: {
    overflow: 'hidden',
  },
});
