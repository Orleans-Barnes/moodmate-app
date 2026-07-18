/**
 * SafePlaceScreen — Quabble-inspired "Safe Place" visualization
 *
 * A 5-step guided sanctuary visualization. Research (imagery rehearsal therapy)
 * shows that actively imagining a calming environment activates the parasympathetic
 * nervous system and reduces cortisol — same mechanism as Quabble's Safe Place.
 *
 * Steps: Arrive → See → Feel → Breathe → Anchor
 */
import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, Pressable, StyleSheet, Animated, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { hapticLight, hapticSuccess, hapticMedium } from '@/utils/haptics';
import { fonts, fontSizes, spacing, radii } from '@/theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'SafePlace'>;

const { width: SW } = Dimensions.get('window');

const STEPS = [
  {
    emoji: '🌅',
    title: 'Arrive',
    body: 'Close your eyes. Take a slow breath in… and out.\n\nImagine a place where you feel completely safe — somewhere real or imagined, indoors or outdoors. It belongs only to you.',
    cta: 'I can picture it →',
    gradient: ['#0A2540', '#1A3D5C', '#2A5F80'] as const,
    orbColor: 'rgba(92,138,230,0.15)',
  },
  {
    emoji: '👁',
    title: 'Look around',
    body: "What do you see in your safe place?\n\nNotice the colours, the light. Is it morning or evening? What's nearby — trees, water, walls, open sky?\n\nLet the scene come into focus.",
    cta: 'I can see it clearly →',
    gradient: ['#0D3B38', '#1A5C56', '#2E8077'] as const,
    orbColor: 'rgba(95,158,124,0.15)',
  },
  {
    emoji: '✋',
    title: 'Feel the space',
    body: 'What does the air feel like against your skin?\n\nIs it warm and gentle, or cool and crisp? Feel the ground beneath you — solid and supportive.\n\nYou are held. You are safe.',
    cta: 'I feel it →',
    gradient: ['#2A1A0D', '#4A3020', '#6B4A30'] as const,
    orbColor: 'rgba(251,191,36,0.12)',
  },
  {
    emoji: '🌬️',
    title: 'Breathe here',
    body: 'In your safe place, breathing is easy.\n\nBreathe in slowly for 4 counts… hold for 2… breathe out for 6.\n\nWith every exhale, you release a little more tension.',
    cta: 'I feel calmer →',
    gradient: ['#1A0D2E', '#2D1B5C', '#4A2E8C'] as const,
    orbColor: 'rgba(142,123,192,0.18)',
  },
  {
    emoji: '⚓',
    title: 'Anchor it',
    body: 'Before you leave, take a mental snapshot. This place is always here for you.\n\nTouch your thumb and forefinger together gently. This is your anchor — whenever you do this, you can return.\n\nYou carry your safe place with you.',
    cta: "I've anchored it 🌿",
    gradient: ['#0A1E0A', '#1A3A1A', '#2E5C2E'] as const,
    orbColor: 'rgba(95,158,124,0.20)',
    isLast: true,
  },
] as const;

export function SafePlaceScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [stepIdx, setStepIdx] = useState(0);

  // Per-element animations
  const emojiScale = useRef(new Animated.Value(0.7)).current;
  const emojiOp    = useRef(new Animated.Value(0)).current;
  const titleOp    = useRef(new Animated.Value(0)).current;
  const titleY     = useRef(new Animated.Value(16)).current;
  const bodyOp     = useRef(new Animated.Value(0)).current;
  const bodyY      = useRef(new Animated.Value(14)).current;
  const btnOp      = useRef(new Animated.Value(0)).current;
  const bgOp       = useRef(new Animated.Value(1)).current;
  const btnScale   = useRef(new Animated.Value(1)).current;

  const animateIn = () => {
    emojiScale.setValue(0.6);
    emojiOp.setValue(0);
    titleOp.setValue(0);
    titleY.setValue(18);
    bodyOp.setValue(0);
    bodyY.setValue(14);
    btnOp.setValue(0);

    Animated.stagger(70, [
      Animated.parallel([
        Animated.spring(emojiScale, { toValue: 1, friction: 5, tension: 130, useNativeDriver: true }),
        Animated.timing(emojiOp,   { toValue: 1, duration: 300, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.spring(titleY,  { toValue: 0, friction: 7, tension: 120, useNativeDriver: true }),
        Animated.timing(titleOp, { toValue: 1, duration: 280, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.spring(bodyY,  { toValue: 0, friction: 7, tension: 100, useNativeDriver: true }),
        Animated.timing(bodyOp, { toValue: 1, duration: 350, useNativeDriver: true }),
      ]),
      Animated.timing(btnOp, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();
  };

  useEffect(() => { animateIn(); }, []);

  const goNext = () => {
    const step = STEPS[stepIdx];
    if ((step as any).isLast) {
      hapticSuccess();
      navigation.goBack();
      return;
    }
    hapticMedium();
    Animated.sequence([
      Animated.spring(btnScale, { toValue: 0.94, speed: 60, bounciness: 0, useNativeDriver: true }),
      Animated.spring(btnScale, { toValue: 1,    speed: 30, bounciness: 6, useNativeDriver: true }),
    ]).start();
    Animated.timing(bgOp, { toValue: 0, duration: 120, useNativeDriver: true }).start(() => {
      setStepIdx((i) => i + 1);
      Animated.timing(bgOp, { toValue: 1, duration: 180, useNativeDriver: true }).start();
      animateIn();
    });
  };

  const step = STEPS[stepIdx];

  return (
    <View style={s.root}>
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: bgOp }]}>
        <LinearGradient
          colors={step.gradient}
          start={{ x: 0.2, y: 0 }}
          end={{ x: 0.8, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        {/* Ambient orb */}
        <View style={[s.orb, { backgroundColor: step.orbColor }]} />
      </Animated.View>

      {/* Back button */}
      <Pressable
        style={[s.backBtn, { top: insets.top + spacing.md }]}
        onPress={() => { hapticLight(); navigation.goBack(); }}
        hitSlop={12}
      >
        <Text style={s.backTxt}>✕</Text>
      </Pressable>

      {/* Progress dots */}
      <View style={[s.dots, { top: insets.top + spacing.md }]}>
        {STEPS.map((_, i) => (
          <View
            key={i}
            style={[
              s.dot,
              i === stepIdx && s.dotActive,
              i < stepIdx && s.dotDone,
            ]}
          />
        ))}
      </View>

      {/* Content */}
      <View style={[s.content, { paddingTop: insets.top + 70, paddingBottom: insets.bottom + 40 }]}>
        <Animated.Text
          style={[s.emoji, { opacity: emojiOp, transform: [{ scale: emojiScale }] }]}
        >
          {step.emoji}
        </Animated.Text>

        <Animated.Text
          style={[s.title, { opacity: titleOp, transform: [{ translateY: titleY }] }]}
        >
          {step.title}
        </Animated.Text>

        <Animated.Text
          style={[s.body, { opacity: bodyOp, transform: [{ translateY: bodyY }] }]}
        >
          {step.body}
        </Animated.Text>

        <Animated.View style={[s.btnWrap, { opacity: btnOp, transform: [{ scale: btnScale }] }]}>
          <Pressable style={s.btn} onPress={goNext}>
            <LinearGradient
              colors={['rgba(255,255,255,0.22)', 'rgba(255,255,255,0.10)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={s.btnGrad}
            >
              <Text style={s.btnText}>{step.cta}</Text>
            </LinearGradient>
          </Pressable>
        </Animated.View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },

  orb: {
    position: 'absolute',
    width: SW * 1.4,
    height: SW * 1.4,
    borderRadius: SW * 0.7,
    top: -SW * 0.3,
    left: -SW * 0.2,
  },

  backBtn: {
    position: 'absolute',
    left: spacing.lg,
    zIndex: 10,
    width: 36, height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backTxt: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    fontFamily: fonts.bodyBold,
  },

  dots: {
    position: 'absolute',
    right: spacing.lg,
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    zIndex: 10,
  },
  dot: {
    width: 6, height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  dotActive: {
    width: 18,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 3,
  },
  dotDone: {
    backgroundColor: 'rgba(255,255,255,0.6)',
  },

  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl + spacing.sm,
    gap: spacing.xl,
  },

  emoji: { fontSize: 72 },

  title: {
    fontFamily: fonts.display,
    fontSize: fontSizes.xxl ?? 30,
    color: '#FFFFFF',
    textAlign: 'center',
  },

  body: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.base,
    color: 'rgba(255,255,255,0.82)',
    textAlign: 'center',
    lineHeight: 26,
  },

  btnWrap: { width: SW - spacing.xl * 2 - spacing.sm * 2 },
  btn: { borderRadius: radii.pill, overflow: 'hidden' },
  btnGrad: {
    paddingVertical: 16,
    alignItems: 'center',
    borderRadius: radii.pill,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.28)',
  },
  btnText: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.base,
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
});
