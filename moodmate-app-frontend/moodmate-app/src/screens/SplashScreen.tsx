/**
 * SplashScreen — Calm Forest brand intro
 *
 * Design language (Figma "01 Splash"):
 *  • Flat deep-forest background, no gradient
 *  • Single soft circle behind the wordmark
 *  • "MoodMate" wordmark + "A calmer campus mind" tagline
 *  • Three-dot loader, sequentially dimming
 *  • Auto-advances after 2.2s; tap to skip
 */
import React, { useEffect, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, Animated, Easing } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { useAuthStore } from '@/state/useAuthStore';
import { getMyProfile } from '@/api/auth';
import { fonts, fontSizes, spacing, calm } from '@/theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'Splash'>;

const AUTO_ADVANCE_MS = 2200;

export function SplashScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const advanced = useRef(false);

  const circleScale = useRef(new Animated.Value(0.85)).current;
  const circleOp = useRef(new Animated.Value(0)).current;
  const titleOp = useRef(new Animated.Value(0)).current;
  const titleY = useRef(new Animated.Value(14)).current;
  const tagOp = useRef(new Animated.Value(0)).current;
  const dot1 = useRef(new Animated.Value(1)).current;
  const dot2 = useRef(new Animated.Value(0.5)).current;
  const dot3 = useRef(new Animated.Value(0.25)).current;

  const goNext = async () => {
    if (advanced.current) return;
    advanced.current = true;
    if (!useAuthStore.getState().hydrated) {
      await useAuthStore.getState().hydrate();
    }
    const { token, user } = useAuthStore.getState();
    if (!token || token === 'guest') {
      if (token === 'guest') navigation.replace('Main');
      else navigation.replace('RoleSelect');
      return;
    }
    // Validate the stored token is still alive before routing.
    // An expired JWT returns 401 — catch it and force re-login.
    try {
      const freshUser = await getMyProfile(token);
      await useAuthStore.getState().setUser(freshUser);
      if (freshUser.role === 'ADMIN') {
        navigation.replace('AdminDashboard');
        return;
      }
    } catch {
      await useAuthStore.getState().logout();
      navigation.replace('RoleSelect');
      return;
    }
    navigation.replace('Main');
  };

  useEffect(() => {
    useAuthStore.getState().hydrate();

    Animated.sequence([
      Animated.parallel([
        Animated.spring(circleScale, { toValue: 1, friction: 7, tension: 60, useNativeDriver: true }),
        Animated.timing(circleOp, { toValue: 1, duration: 450, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(titleOp, { toValue: 1, duration: 380, useNativeDriver: true }),
        Animated.spring(titleY, { toValue: 0, friction: 7, tension: 120, useNativeDriver: true }),
      ]),
      Animated.timing(tagOp, { toValue: 1, duration: 320, useNativeDriver: true }),
    ]).start();

    // Loader dots — the lit dot cycles left to right.
    const loop = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(dot1, { toValue: 1, duration: 280, useNativeDriver: true }),
          Animated.timing(dot2, { toValue: 0.5, duration: 280, useNativeDriver: true }),
          Animated.timing(dot3, { toValue: 0.25, duration: 280, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(dot2, { toValue: 1, duration: 280, useNativeDriver: true }),
          Animated.timing(dot1, { toValue: 0.5, duration: 280, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(dot3, { toValue: 1, duration: 280, useNativeDriver: true }),
          Animated.timing(dot2, { toValue: 0.25, duration: 280, useNativeDriver: true }),
        ]),
      ]),
    );
    loop.start();

    const t = setTimeout(goNext, AUTO_ADVANCE_MS);
    return () => { clearTimeout(t); loop.stop(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Pressable style={s.root} onPress={goNext}>
      <View style={[s.center, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <Animated.View
          style={[s.circle, { opacity: circleOp, transform: [{ scale: circleScale }] }]}
          importantForAccessibility="no-hide-descendants"
          accessibilityElementsHidden
        />
        <Animated.Text style={[s.title, { opacity: titleOp, transform: [{ translateY: titleY }] }]}>
          MoodMate
        </Animated.Text>
        <Animated.Text style={[s.tag, { opacity: tagOp }]}>A calmer campus mind</Animated.Text>
      </View>

      <View style={[s.loader, { paddingBottom: insets.bottom + spacing.xxxl }]}>
        <Animated.View style={[s.dot, { opacity: dot1 }]} />
        <Animated.View style={[s.dot, { opacity: dot2 }]} />
        <Animated.View style={[s.dot, { opacity: dot3 }]} />
      </View>
    </Pressable>
  );
}

const CIRCLE = 465;

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: calm.forest },

  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  circle: {
    position: 'absolute',
    width: CIRCLE,
    height: CIRCLE,
    borderRadius: CIRCLE / 2,
    backgroundColor: calm.forestPanel,
  },

  title: {
    fontFamily: fonts.displayExtraBold,
    fontSize: fontSizes.display,
    color: '#FFFFFF',
    letterSpacing: -0.8,
  },
  tag: {
    fontFamily: fonts.body,
    fontSize: fontSizes.md - 1,
    color: calm.mutedOnDark,
    marginTop: spacing.lg,
  },

  loader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
});
