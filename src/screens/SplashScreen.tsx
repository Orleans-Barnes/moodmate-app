/**
 * SplashScreen — Cinematic brand intro
 *
 * Design language:
 *  • Deep dark-to-purple gradient background
 *  • Multi-ring pulsing orb (coral/lavender/sage rings, staggered)
 *  • Per-letter spring stagger on "MoodMate" title
 *  • Coral brand progress bar
 *  • Auto-advances after 2.8s; tap to skip
 */
import React, { useEffect, useRef } from 'react';
import {
  View, Text, Pressable, StyleSheet, Animated, Easing, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { useAuthStore } from '@/state/useAuthStore';
import { getMyProfile } from '@/api/auth';
import { fonts, fontSizes, spacing, gradients, glow } from '@/theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'Splash'>;

const { width: SW } = Dimensions.get('window');
const AUTO_ADVANCE_MS = 2800;
const ORB_SIZE = 116;
const TITLE = 'MoodMate';

export function SplashScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const advanced = useRef(false);

  // Orb animations
  const orbScale   = useRef(new Animated.Value(0.55)).current;
  const orbOpacity = useRef(new Animated.Value(0)).current;
  const orbPulse   = useRef(new Animated.Value(1)).current;

  // Three glow rings (coral, lavender, sage) — each pulses offset
  const ring1Op = useRef(new Animated.Value(0)).current;
  const ring2Op = useRef(new Animated.Value(0)).current;
  const ring3Op = useRef(new Animated.Value(0)).current;

  // Per-letter title animations
  const letterAnims = useRef(
    TITLE.split('').map(() => ({
      op: new Animated.Value(0),
      y:  new Animated.Value(14),
    })),
  ).current;

  const tagOp    = useRef(new Animated.Value(0)).current;
  const barWidth = useRef(new Animated.Value(0)).current;
  const hintOp   = useRef(new Animated.Value(0)).current;

  const goNext = async () => {
    if (advanced.current) return;
    advanced.current = true;
    if (!useAuthStore.getState().hydrated) {
      await useAuthStore.getState().hydrate();
    }
    const { token, user } = useAuthStore.getState();
    if (!token || token === 'guest') {
      // No session at all — go to role select
      if (token === 'guest') navigation.replace('Main');
      else navigation.replace('RoleSelect');
      return;
    }
    // Validate the stored token is still alive before routing.
    // An expired JWT returns 401 — catch it and force re-login.
    try {
      await getMyProfile(token);
    } catch {
      await useAuthStore.getState().logout();
      navigation.replace('RoleSelect');
      return;
    }
    if (user?.role === 'ADMIN') navigation.replace('AdminDashboard');
    else navigation.replace('Main');
  };

  const startRingPulse = (anim: Animated.Value, delay: number) => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 900, delay, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.2, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    ).start();
  };

  useEffect(() => {
    useAuthStore.getState().hydrate();

    // Phase 1 — orb springs in
    Animated.parallel([
      Animated.spring(orbScale,   { toValue: 1, friction: 5, tension: 80, useNativeDriver: true }),
      Animated.timing(orbOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start(() => {
      // Phase 2 — orb breathes, rings appear, letters stagger in
      Animated.sequence([
        Animated.timing(orbPulse, { toValue: 1.10, duration: 600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(orbPulse, { toValue: 1,    duration: 600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]).start();

      // Stagger rings on
      Animated.stagger(150, [ring1Op, ring2Op, ring3Op].map(r =>
        Animated.timing(r, { toValue: 0.7, duration: 400, useNativeDriver: true }),
      )).start(() => {
        startRingPulse(ring1Op, 0);
        startRingPulse(ring2Op, 400);
        startRingPulse(ring3Op, 700);
      });

      // Letter-by-letter title
      Animated.stagger(45, letterAnims.map(({ op, y }) =>
        Animated.parallel([
          Animated.timing(op, { toValue: 1, duration: 320, useNativeDriver: true }),
          Animated.spring(y,  { toValue: 0, friction: 7, tension: 160, useNativeDriver: true }),
        ]),
      )).start();

      // Tagline + hint after letters
      Animated.sequence([
        Animated.delay(TITLE.length * 45 + 100),
        Animated.parallel([
          Animated.timing(tagOp,  { toValue: 1,    duration: 400, useNativeDriver: true }),
          Animated.timing(hintOp, { toValue: 0.55, duration: 500, useNativeDriver: true }),
        ]),
      ]).start();
    });

    // Progress bar (runs independently)
    Animated.timing(barWidth, {
      toValue: 100,
      duration: AUTO_ADVANCE_MS - 100,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start();

    const t = setTimeout(goNext, AUTO_ADVANCE_MS);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Pressable style={s.root} onPress={goNext}>
      {/* Background */}
      <LinearGradient
        colors={['#1E1040', '#2D1478', '#4A1E8A']}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Ambient background circles */}
      <View style={[s.bgCircle, s.bgCircle1]} />
      <View style={[s.bgCircle, s.bgCircle2]} />

      <View style={[s.center, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>

        {/* ── Orb + rings ── */}
        <Animated.View style={[
          s.orbWrap,
          { opacity: orbOpacity, transform: [{ scale: Animated.multiply(orbScale, orbPulse) }] },
        ]}>
          {/* Ring 3 — outermost, sage */}
          <Animated.View style={[s.ring, s.ring3, { opacity: ring3Op }]} />
          {/* Ring 2 — mid, lavender */}
          <Animated.View style={[s.ring, s.ring2, { opacity: ring2Op }]} />
          {/* Ring 1 — inner, coral */}
          <Animated.View style={[s.ring, s.ring1, { opacity: ring1Op }]} />

          {/* Core orb */}
          <LinearGradient
            colors={['#FF6F4D', '#C050A0', '#8E7BC0']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={s.orb}
          >
            <Text style={s.orbEmoji}>🌿</Text>
          </LinearGradient>
        </Animated.View>

        {/* ── Letter-by-letter title ── */}
        <View style={s.titleRow}>
          {TITLE.split('').map((letter, i) => (
            <Animated.Text
              key={i}
              style={[
                s.titleLetter,
                {
                  opacity:   letterAnims[i].op,
                  transform: [{ translateY: letterAnims[i].y }],
                },
              ]}
            >
              {letter}
            </Animated.Text>
          ))}
        </View>

        {/* Tagline */}
        <Animated.Text style={[s.tag, { opacity: tagOp }]}>
          breathe  ·  track  ·  grow
        </Animated.Text>
      </View>

      {/* Bottom: progress bar + hint */}
      <View style={[s.barArea, { paddingBottom: insets.bottom + spacing.xl }]}>
        <View style={s.barTrack}>
          <Animated.View style={[
            s.barFill,
            { width: barWidth.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }) },
          ]} />
        </View>
        <Animated.Text style={[s.hint, { opacity: hintOp }]}>tap to continue</Animated.Text>
      </View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },

  // Ambient bg blobs
  bgCircle: { position: 'absolute', borderRadius: 9999 },
  bgCircle1: {
    width: SW * 1.2, height: SW * 1.2,
    top: -SW * 0.4, left: -SW * 0.1,
    backgroundColor: 'rgba(142,123,192,0.06)',
  },
  bgCircle2: {
    width: SW * 0.9, height: SW * 0.9,
    bottom: -SW * 0.25, right: -SW * 0.25,
    backgroundColor: 'rgba(255,111,77,0.05)',
  },

  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
  },

  // Orb
  orbWrap: {
    width: ORB_SIZE * 2.2,
    height: ORB_SIZE * 2.2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  orb: {
    width: ORB_SIZE,
    height: ORB_SIZE,
    borderRadius: ORB_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: glow.coral,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 32,
    elevation: 16,
  },
  orbEmoji: { fontSize: 46 },

  // Concentric glow rings
  ring: {
    position: 'absolute',
    borderRadius: 9999,
  },
  ring1: {
    width: ORB_SIZE * 1.55, height: ORB_SIZE * 1.55,
    backgroundColor: 'rgba(255,111,77,0.18)',  // coral inner
  },
  ring2: {
    width: ORB_SIZE * 1.95, height: ORB_SIZE * 1.95,
    backgroundColor: 'rgba(142,123,192,0.10)', // lavender mid
  },
  ring3: {
    width: ORB_SIZE * 2.20, height: ORB_SIZE * 2.20,
    backgroundColor: 'rgba(95,158,124,0.07)',  // sage outer
  },

  // Title
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleLetter: {
    fontFamily: fonts.display,
    fontSize: 40,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },

  // Tagline
  tag: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.sm,
    color: 'rgba(255,255,255,0.55)',
    letterSpacing: 2.5,
    textTransform: 'uppercase',
    marginTop: -4,
  },

  // Progress bar
  barArea: { alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.xxxl },
  barTrack: {
    width: 180,
    height: 5,
    borderRadius: 99,
    backgroundColor: 'rgba(255,255,255,0.12)',
    overflow: 'hidden',
  },
  barFill: {
    height: 5,
    borderRadius: 99,
    backgroundColor: '#FF6F4D',
  },
  hint: {
    fontFamily: fonts.bodyMedium,
    fontSize: 10,
    color: '#FFFFFF',
    letterSpacing: 1,
  },
});
