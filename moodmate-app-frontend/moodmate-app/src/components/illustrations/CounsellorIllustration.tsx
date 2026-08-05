/**
 * CounsellorIllustration — Phase 1B placeholder art for the "Counsellor / Peer Mentor" card.
 * Code-composed, same swap-later approach as StudentIllustration — see roleAssets.tsx.
 * Reads as: two figures facing each other in conversation, calm and level (no hierarchy cues
 * like one figure being larger/higher), with a small connecting glow between them standing in
 * for "guidance" without literal medical/clinical imagery.
 */
import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export function CounsellorIllustration({ size = 128 }: { size?: number }) {
  const float = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(float, { toValue: 1, duration: 3000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(float, { toValue: 0, duration: 3000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [float]);

  const pulse = float.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.15] });
  const glowOpacity = float.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0.75] });

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <LinearGradient
        colors={['rgba(92,138,230,0.20)', 'rgba(142,123,192,0.12)', 'transparent']}
        style={StyleSheet.absoluteFillObject}
      />

      <View style={{
        width: size * 0.66, height: size * 0.5,
        flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: size * 0.06,
      }}>
        {/* Figure A */}
        <View style={{ alignItems: 'center' }}>
          <View style={{ width: size * 0.16, height: size * 0.16, borderRadius: size * 0.08, backgroundColor: '#5C8AE6' }} />
          <View style={{
            width: size * 0.22, height: size * 0.26, borderTopLeftRadius: size * 0.11, borderTopRightRadius: size * 0.11,
            borderBottomLeftRadius: size * 0.04, borderBottomRightRadius: size * 0.04,
            backgroundColor: '#5C8AE6', marginTop: -size * 0.01,
          }} />
        </View>

        {/* Connecting "guidance" glow */}
        <Animated.View style={{
          width: size * 0.09, height: size * 0.09, borderRadius: size * 0.045,
          backgroundColor: '#FFC857', marginBottom: size * 0.14,
          opacity: glowOpacity, transform: [{ scale: pulse }],
        }} />

        {/* Figure B — same size/level, no hierarchy */}
        <View style={{ alignItems: 'center' }}>
          <View style={{ width: size * 0.16, height: size * 0.16, borderRadius: size * 0.08, backgroundColor: '#8E7BC0' }} />
          <View style={{
            width: size * 0.22, height: size * 0.26, borderTopLeftRadius: size * 0.11, borderTopRightRadius: size * 0.11,
            borderBottomLeftRadius: size * 0.04, borderBottomRightRadius: size * 0.04,
            backgroundColor: '#8E7BC0', marginTop: -size * 0.01,
          }} />
        </View>
      </View>

      <View style={{
        width: size * 0.5, height: size * 0.05, borderRadius: size * 0.025,
        backgroundColor: 'rgba(43,37,48,0.10)', marginTop: size * 0.02,
      }} />
    </View>
  );
}
