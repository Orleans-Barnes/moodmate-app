/**
 * StudentIllustration — Phase 1B placeholder art for the Role Select "Student" card.
 *
 * Code-composed (gradients + shapes), not a real illustration file. This is intentional per
 * the Phase 1B decision to not block on final artwork — see roleAssets.tsx for the swap point.
 * Reads as: a figure sitting with knees drawn up, head tilted down in thought, with a single
 * soft "hope" glow rising above them — meant to land as "thoughtful but not despairing."
 */
import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export function StudentIllustration({ size = 128 }: { size?: number }) {
  const float = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(float, { toValue: 1, duration: 2600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(float, { toValue: 0, duration: 2600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [float]);

  const glowY = float.interpolate({ inputRange: [0, 1], outputRange: [0, -8] });
  const glowOpacity = float.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.65] });

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {/* Backdrop aura */}
      <LinearGradient
        colors={['rgba(255,200,87,0.22)', 'rgba(255,111,77,0.10)', 'transparent']}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Rising "hope" glow above the figure */}
      <Animated.View
        style={{
          position: 'absolute', top: size * 0.06, width: size * 0.16, height: size * 0.16,
          borderRadius: size * 0.08, backgroundColor: '#FFC857',
          opacity: glowOpacity, transform: [{ translateY: glowY }],
        }}
      />

      {/* Figure — knees-up, head-down seated pose, built from rounded shapes */}
      <View style={{ width: size * 0.62, height: size * 0.62, alignItems: 'center', justifyContent: 'flex-end' }}>
        {/* Head, tilted via slight offset */}
        <View style={{
          width: size * 0.20, height: size * 0.20, borderRadius: size * 0.10,
          backgroundColor: '#8E7BC0', marginBottom: -size * 0.02, marginLeft: size * 0.04,
        }} />
        {/* Body / knees-up silhouette */}
        <View style={{
          width: size * 0.46, height: size * 0.34, borderTopLeftRadius: size * 0.23,
          borderTopRightRadius: size * 0.10, borderBottomLeftRadius: size * 0.06,
          borderBottomRightRadius: size * 0.06, backgroundColor: '#FF6F4D',
        }} />
        {/* Ground shadow */}
        <View style={{
          width: size * 0.5, height: size * 0.05, borderRadius: size * 0.025,
          backgroundColor: 'rgba(43,37,48,0.10)', marginTop: size * 0.04,
        }} />
      </View>
    </View>
  );
}
