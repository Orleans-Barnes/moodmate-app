/**
 * OnboardingScreen — Cinematic 3-slide onboarding
 *
 * Upgrades:
 *  • Independent spring animations per element (emoji scale, title slide, body fade)
 *  • Background gradient + orbs change per slide
 *  • Animated dot pills (active = wide pill, spring width)
 *  • Solid coral CTA button on last slide
 *  • Button spring press
 */
import React, { useRef, useState, useEffect } from 'react';
import {
  View, Text, Pressable, StyleSheet, Dimensions,
  Animated, Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { fonts, fontSizes, spacing, radii, gradients, glow } from '@/theme/tokens';
import { useAuthStore } from '@/state/useAuthStore';
import { getProfileStatus } from '@/api/profileSetup';

type Props = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;

const { width: SW } = Dimensions.get('window');

const SLIDES = [
  {
    key: '1',
    gradient: gradients.onboard1,
    emoji: '🌿',
    title: 'Track your mood\ndaily',
    body: 'A 10-second check-in each day helps you spot patterns in how you feel — and what drives them.',
    orbColor1: 'rgba(95,158,124,0.18)',
    orbColor2: 'rgba(255,111,77,0.08)',
  },
  {
    key: '2',
    gradient: gradients.onboard2,
    emoji: '🧘',
    title: 'Breathe, reflect\n& grow',
    body: 'Guided sessions, a personal journal, and stress-relief tools — all in one place, just for you.',
    orbColor1: 'rgba(142,123,192,0.20)',
    orbColor2: 'rgba(92,138,230,0.10)',
  },
  {
    key: '3',
    gradient: gradients.onboard3,
    emoji: '🤝',
    title: 'Never face it\nalone',
    body: 'Connect with trained counsellors and peer mentors who understand campus life.',
    orbColor1: 'rgba(92,138,230,0.16)',
    orbColor2: 'rgba(95,158,124,0.10)',
  },
] as const;

// Animated dot indicator
function Dot({ active }: { active: boolean }) {
  const width = useRef(new Animated.Value(active ? 28 : 8)).current;
  const opacity = useRef(new Animated.Value(active ? 1 : 0.4)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(width,   { toValue: active ? 28 : 8, friction: 6, tension: 120, useNativeDriver: false }),
      Animated.timing(opacity, { toValue: active ? 1 : 0.4, duration: 200, useNativeDriver: false }),
    ]).start();
  }, [active]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Animated.View style={[s.dot, { width, opacity }]} />
  );
}

export function OnboardingScreen({ navigation }: Props) {
  const [index, setIndex] = useState(0);
  const insets = useSafeAreaInsets();

  // Per-element animated values (reset on slide change)
  const emojiScale = useRef(new Animated.Value(0.7)).current;
  const emojiOp    = useRef(new Animated.Value(0)).current;
  const titleX     = useRef(new Animated.Value(30)).current;
  const titleOp    = useRef(new Animated.Value(0)).current;
  const bodyOp     = useRef(new Animated.Value(0)).current;
  const bodyY      = useRef(new Animated.Value(12)).current;

  // Background fade
  const bgOp = useRef(new Animated.Value(1)).current;

  // Button press
  const btnScale = useRef(new Animated.Value(1)).current;

  const animateIn = () => {
    // Reset
    emojiScale.setValue(0.65);
    emojiOp.setValue(0);
    titleX.setValue(28);
    titleOp.setValue(0);
    bodyOp.setValue(0);
    bodyY.setValue(14);

    Animated.stagger(60, [
      // Emoji springs in
      Animated.parallel([
        Animated.spring(emojiScale, { toValue: 1, friction: 5, tension: 140, useNativeDriver: true }),
        Animated.timing(emojiOp,   { toValue: 1, duration: 280, useNativeDriver: true }),
      ]),
      // Title slides from right
      Animated.parallel([
        Animated.spring(titleX,  { toValue: 0, friction: 7, tension: 120, useNativeDriver: true }),
        Animated.timing(titleOp, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]),
      // Body fades up
      Animated.parallel([
        Animated.spring(bodyY,  { toValue: 0, friction: 7, tension: 100, useNativeDriver: true }),
        Animated.timing(bodyOp, { toValue: 1, duration: 350, useNativeDriver: true }),
      ]),
    ]).start();
  };

  useEffect(() => {
    // Animate in immediately on mount
    animateIn();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const goTo = (next: number) => {
    // Fade out bg, swap content, fade back
    Animated.timing(bgOp, { toValue: 0, duration: 120, useNativeDriver: true }).start(() => {
      setIndex(next);
      Animated.timing(bgOp, { toValue: 1, duration: 180, useNativeDriver: true }).start();
      animateIn();
    });
  };

  const token = useAuthStore((st) => st.token);

  // Post-onboarding routing: guests and any status-check failure fail open straight to Main
  // (never block app entry on a non-critical check). Real students get routed to ProfileSetup
  // only if the server says their profile isn't complete yet — this is derived server-side
  // every time, never a client-side "have I onboarded" flag.
  const goToPostOnboarding = async () => {
    if (!token || token === 'guest') {
      navigation.replace('Main');
      return;
    }
    try {
      const status = await getProfileStatus(token);
      if (status.canShowOnboarding) {
        navigation.replace('ProfileSetup');
      } else {
        navigation.replace('Main');
      }
    } catch {
      navigation.replace('Main');
    }
  };

  const handleNext = () => {
    Animated.sequence([
      Animated.spring(btnScale, { toValue: 0.95, speed: 60, bounciness: 0, useNativeDriver: true }),
      Animated.spring(btnScale, { toValue: 1,    speed: 30, bounciness: 8, useNativeDriver: true }),
    ]).start();

    if (index < SLIDES.length - 1) {
      goTo(index + 1);
    } else {
      goToPostOnboarding();
    }
  };

  const slide = SLIDES[index];
  const isLast = index === SLIDES.length - 1;

  return (
    <View style={s.root}>
      {/* Background gradient */}
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: bgOp }]}>
        <LinearGradient
          colors={slide.gradient}
          start={{ x: 0.2, y: 0 }}
          end={{ x: 0.8, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        {/* Per-slide ambient orbs */}
        <View style={[s.orbTop, { backgroundColor: slide.orbColor1 }]} />
        <View style={[s.orbBottom, { backgroundColor: slide.orbColor2 }]} />
      </Animated.View>

      {/* Skip */}
      <Pressable
        style={[s.skipBtn, { top: insets.top + spacing.md }]}
        onPress={() => goToPostOnboarding()}
        hitSlop={12}
      >
        <Text style={s.skipTxt}>Skip</Text>
      </Pressable>

      {/* Slide content */}
      <View style={[s.content, { paddingTop: insets.top + 60 }]}>
        {/* Emoji illustration */}
        <Animated.View style={[
          s.illustrationWrap,
          { opacity: emojiOp, transform: [{ scale: emojiScale }] },
        ]}>
          <Text style={s.illustrationEmoji}>{slide.emoji}</Text>
        </Animated.View>

        {/* Title */}
        <Animated.Text style={[
          s.slideTitle,
          { opacity: titleOp, transform: [{ translateX: titleX }] },
        ]}>
          {slide.title}
        </Animated.Text>

        {/* Body */}
        <Animated.Text style={[
          s.slideBody,
          { opacity: bodyOp, transform: [{ translateY: bodyY }] },
        ]}>
          {slide.body}
        </Animated.Text>
      </View>

      {/* Footer: dots + button */}
      <View style={[s.footer, { paddingBottom: insets.bottom + spacing.xl }]}>
        <View style={s.dots}>
          {SLIDES.map((_, i) => (
            <Pressable key={i} onPress={() => goTo(i)}>
              <Dot active={i === index} />
            </Pressable>
          ))}
        </View>

        <Animated.View style={[s.nextBtnWrap, { transform: [{ scale: btnScale }] }]}>
          <Pressable style={s.nextBtnOuter} onPress={handleNext}>
            {isLast ? (
              <LinearGradient
                colors={['#FF6F4D', '#FF5C35']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={s.nextGrad}
              >
                <Text style={s.nextTxt}>Let's begin 🌱</Text>
              </LinearGradient>
            ) : (
              <LinearGradient
                colors={['rgba(255,255,255,0.22)', 'rgba(255,255,255,0.10)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[s.nextGrad, s.nextGradGhost]}
              >
                <Text style={s.nextTxt}>Next →</Text>
              </LinearGradient>
            )}
          </Pressable>
        </Animated.View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },

  // Ambient orbs (per-slide colours set inline)
  orbTop: {
    position: 'absolute',
    width: SW * 1.2, height: SW * 1.2,
    borderRadius: SW * 0.6,
    top: -SW * 0.35, left: -SW * 0.1,
  },
  orbBottom: {
    position: 'absolute',
    width: SW * 0.85, height: SW * 0.85,
    borderRadius: SW * 0.425,
    bottom: -SW * 0.2, right: -SW * 0.2,
  },

  skipBtn: { position: 'absolute', right: spacing.lg, zIndex: 10 },
  skipTxt: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.sm,
    color: 'rgba(255,255,255,0.6)',
  },

  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxxl,
    gap: spacing.xl,
  },

  illustrationWrap: {
    width: 180, height: 180, borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.10)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.18)',
    shadowColor: 'rgba(255,255,255,0.3)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 24,
    elevation: 0,
  },
  illustrationEmoji: { fontSize: 88, textAlign: 'center' },

  slideTitle: {
    fontFamily: fonts.display,
    fontSize: fontSizes.display + 2,
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 36,
  },
  slideBody: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.base,
    color: 'rgba(255,255,255,0.72)',
    textAlign: 'center',
    lineHeight: 22,
  },

  footer: { alignItems: 'center', gap: spacing.xl, paddingHorizontal: spacing.lg },

  dots: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  dot: {
    height: 8, borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },

  nextBtnWrap: { width: SW - spacing.lg * 2 },
  nextBtnOuter: { borderRadius: radii.pill, overflow: 'hidden' },
  nextGrad: {
    paddingVertical: 16,
    alignItems: 'center',
    borderRadius: radii.pill,
    shadowColor: glow.coral,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.8,
    shadowRadius: 16,
    elevation: 8,
  },
  nextGradGhost: {
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.28)',
    shadowColor: 'transparent',
    shadowOpacity: 0,
    elevation: 0,
  },
  nextTxt: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.base,
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
});
