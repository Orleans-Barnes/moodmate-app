import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { fonts, fontSizes } from '@/theme/tokens';
import { useAuthStore } from '@/state/useAuthStore';

const { width: W } = Dimensions.get('window');

// ─── Design system (same across every screen) ─────────────────────────────
const PURPLE = '#7C3AED';
const WHITE  = '#FFFFFF';
const GRAD   = ['#1A0A3C', '#3B1275', '#7C3AED'] as const;

export function SplashScreen() {
  const nav   = useNavigation<any>();
  const token = useAuthStore(s => s.token);

  const logo   = useRef(new Animated.Value(0)).current;
  const titleO = useRef(new Animated.Value(0)).current;
  const titleY = useRef(new Animated.Value(24)).current;
  const subO   = useRef(new Animated.Value(0)).current;
  const r1     = useRef(new Animated.Value(0)).current;
  const r2     = useRef(new Animated.Value(0)).current;
  const r3     = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const ring = (v: Animated.Value, delay: number) =>
      Animated.loop(Animated.sequence([
        Animated.delay(delay),
        Animated.timing(v, { toValue: 1, duration: 2200, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(v, { toValue: 0, duration: 0, useNativeDriver: true }),
      ]));

    ring(r1, 0).start();
    ring(r2, 700).start();
    ring(r3, 1400).start();

    Animated.sequence([
      Animated.delay(300),
      Animated.spring(logo, { toValue: 1, friction: 5, tension: 90, useNativeDriver: true }),
      Animated.delay(150),
      Animated.parallel([
        Animated.timing(titleO, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(titleY, { toValue: 0, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]),
      Animated.delay(100),
      Animated.timing(subO, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();

    const t = setTimeout(() => {
      nav.replace(token ? 'Main' : 'Onboarding');
    }, 2800);
    return () => clearTimeout(t);
  }, []);

  const mkRing = (v: Animated.Value) => ({
    transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [1, 3.2] }) }],
    opacity:   v.interpolate({ inputRange: [0, 0.25, 1], outputRange: [0, 0.4, 0] }),
  });

  return (
    <LinearGradient colors={GRAD} style={s.root}>
      <View style={s.rings}>
        {[r1, r2, r3].map((v, i) => (
          <Animated.View key={i} style={[s.ring, mkRing(v)]} />
        ))}
      </View>

      <Animated.View style={[s.logoBox, { opacity: logo, transform: [{ scale: logo }] }]}>
        <LinearGradient
          colors={['rgba(255,255,255,0.20)', 'rgba(255,255,255,0.06)']}
          style={s.logoBg}
        >
          <Ionicons name="leaf" size={52} color={WHITE} />
        </LinearGradient>
      </Animated.View>

      <Animated.Text style={[s.title, { opacity: titleO, transform: [{ translateY: titleY }] }]}>
        MoodMate
      </Animated.Text>
      <Animated.Text style={[s.sub, { opacity: subO }]}>
        Your mental wellness companion
      </Animated.Text>

      <Animated.View style={[s.dots, { opacity: subO }]}>
        {[0, 1, 2].map(i => (
          <View key={i} style={[s.dot, i === 1 && s.dotActive]} />
        ))}
      </Animated.View>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  root:  { flex: 1, alignItems: 'center', justifyContent: 'center' },
  rings: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  ring:  { position: 'absolute', width: 140, height: 140, borderRadius: 70, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.28)' },

  logoBox: { marginBottom: 32 },
  logoBg:  { width: 116, height: 116, borderRadius: 40, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)' },

  title: { fontFamily: fonts.display, fontSize: 42, color: WHITE, letterSpacing: 0.5, marginBottom: 10 },
  sub:   { fontFamily: fonts.body, fontSize: fontSizes.lg, color: 'rgba(255,255,255,0.68)', letterSpacing: 0.3, marginBottom: 52 },

  dots:      { flexDirection: 'row', gap: 7 },
  dot:       { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.35)' },
  dotActive: { width: 22, backgroundColor: 'rgba(255,255,255,0.88)' },
});
