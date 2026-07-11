/**
 * StylishPlusButton
 *
 * A premium expand/collapse button for the dynamic tab bar.
 * The plus arms are hand-drawn with rounded View bars — no icon font needed.
 * Rotates 135° (plus → ×) via the parent's animated value.
 * Glows coral when closed, purple when open.
 */

import React from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface StylishPlusButtonProps {
  /** 0 = closed (plus), 1 = open (×) — drives rotation and color */
  revealAnim: Animated.Value;
  size?: number;
}

export function StylishPlusButton({ revealAnim, size = 38 }: StylishPlusButtonProps) {
  const rotation = revealAnim.interpolate({
    inputRange:  [0, 1],
    outputRange: ['0deg', '135deg'],
  });

  // Outer pill scales up slightly on reveal for a "pop" feel
  const outerScale = revealAnim.interpolate({
    inputRange:  [0, 0.5, 1],
    outputRange: [1, 1.08, 1],
  });

  // Glow opacity
  const glowOpacity = revealAnim.interpolate({
    inputRange:  [0, 1],
    outputRange: [0.45, 0.75],
  });

  const armThick = Math.round(size * 0.13);   // bar thickness
  const armLen   = Math.round(size * 0.50);   // bar length
  const radius   = armThick / 2;              // fully rounded ends

  return (
    <Animated.View
      style={[
        styles.outerWrap,
        {
          width:  size,
          height: size,
          borderRadius: size / 2,
          transform: [{ scale: outerScale }],
        },
      ]}
    >
      {/* ── Glow halo ── */}
      <Animated.View
        style={[
          styles.glow,
          {
            width:  size + 14,
            height: size + 14,
            borderRadius: (size + 14) / 2,
            opacity: glowOpacity,
          },
        ]}
      />

      {/* ── Gradient background — interpolates coral→purple ── */}
      {/* Coral layer (visible when closed) */}
      <Animated.View
        style={[StyleSheet.absoluteFill, { borderRadius: size / 2,
          opacity: revealAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }) }]}
      >
        <LinearGradient
          colors={['#FF8050', '#FF5B8A']}
          style={[StyleSheet.absoluteFill, { borderRadius: size / 2 }]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        />
      </Animated.View>

      {/* Purple layer (visible when open) */}
      <Animated.View
        style={[StyleSheet.absoluteFill, { borderRadius: size / 2,
          opacity: revealAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 1] }) }]}
      >
        <LinearGradient
          colors={['#7B3CC9', '#C84895']}
          style={[StyleSheet.absoluteFill, { borderRadius: size / 2 }]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        />
      </Animated.View>

      {/* ── Sheen overlay — top-left highlight ── */}
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            borderRadius: size / 2,
            backgroundColor: 'rgba(255,255,255,0.18)',
            // Only the top half catches the sheen
            overflow: 'hidden',
          },
        ]}
        pointerEvents="none"
      >
        <View style={{
          position: 'absolute', top: 0, left: 0,
          width: size, height: size / 2,
          backgroundColor: 'rgba(255,255,255,0.14)',
          borderTopLeftRadius:  size / 2,
          borderTopRightRadius: size / 2,
        }} />
      </View>

      {/* ── Plus arms (rotate together) ── */}
      <Animated.View
        style={[
          styles.armsWrap,
          { transform: [{ rotate: rotation }] },
        ]}
      >
        {/* Horizontal arm */}
        <View style={[styles.arm, {
          width: armLen, height: armThick, borderRadius: radius,
          position: 'absolute',
        }]} />
        {/* Vertical arm */}
        <View style={[styles.arm, {
          width: armThick, height: armLen, borderRadius: radius,
          position: 'absolute',
        }]} />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  outerWrap: {
    alignItems:     'center',
    justifyContent: 'center',
    overflow:       'visible',
    // Drop shadow
    shadowColor:    '#FF6F4D',
    shadowOffset:   { width: 0, height: 4 },
    shadowOpacity:  0.55,
    shadowRadius:   10,
    elevation:      8,
  },
  glow: {
    position:   'absolute',
    alignSelf:  'center',
    backgroundColor: 'rgba(255,111,77,0.22)',
  },
  armsWrap: {
    width:          '100%',
    height:         '100%',
    alignItems:     'center',
    justifyContent: 'center',
  },
  arm: {
    backgroundColor: '#FFFFFF',
    // Crisp white arms on gradient background
  },
});
