/**
 * Expand/collapse control for the dynamic tab bar.
 * The progress value is native-driver friendly: only transform and opacity use it.
 */

import React from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { calm, glow } from '@/theme/tokens';

interface StylishPlusButtonProps {
  /** 0 = closed (plus), 1 = open (X). */
  progressAnim: Animated.Value;
  size?: number;
}

export function StylishPlusButton({ progressAnim, size = 38 }: StylishPlusButtonProps) {
  const rotation = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '135deg'],
  });

  const outerScale = progressAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 1.08, 1],
  });

  const glowOpacity = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.35, 0.55],
  });

  const armThick = Math.round(size * 0.13);
  const armLen = Math.round(size * 0.5);
  const radius = armThick / 2;

  return (
    <Animated.View
      style={[
        styles.outerWrap,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          transform: [{ scale: outerScale }],
        },
      ]}
    >
      <Animated.View
        style={[
          styles.glow,
          {
            width: size + 14,
            height: size + 14,
            borderRadius: (size + 14) / 2,
            opacity: glowOpacity,
          },
        ]}
      />

      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          {
            borderRadius: size / 2,
            opacity: progressAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }),
          },
        ]}
      >
        <LinearGradient
          colors={[calm.primary, calm.primaryDeep]}
          style={[StyleSheet.absoluteFill, { borderRadius: size / 2 }]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      </Animated.View>

      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          {
            borderRadius: size / 2,
            opacity: progressAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 1] }),
          },
        ]}
      >
        <LinearGradient
          colors={[calm.forestPanel, calm.forest]}
          style={[StyleSheet.absoluteFill, { borderRadius: size / 2 }]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      </Animated.View>

      <View
        style={[
          StyleSheet.absoluteFill,
          {
            borderRadius: size / 2,
            backgroundColor: 'rgba(255,255,255,0.14)',
            overflow: 'hidden',
          },
        ]}
        pointerEvents="none"
      >
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: size,
            height: size / 2,
            backgroundColor: 'rgba(255,255,255,0.12)',
            borderTopLeftRadius: size / 2,
            borderTopRightRadius: size / 2,
          }}
        />
      </View>

      <Animated.View style={[styles.armsWrap, { transform: [{ rotate: rotation }] }]}>
        <View
          style={[
            styles.arm,
            { width: armLen, height: armThick, borderRadius: radius, position: 'absolute' },
          ]}
        />
        <View
          style={[
            styles.arm,
            { width: armThick, height: armLen, borderRadius: radius, position: 'absolute' },
          ]}
        />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  outerWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
    shadowColor: glow.coral,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  glow: {
    position: 'absolute',
    alignSelf: 'center',
    backgroundColor: 'rgba(87,158,101,0.28)',
  },
  armsWrap: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  arm: {
    backgroundColor: '#FFFFFF',
  },
});
