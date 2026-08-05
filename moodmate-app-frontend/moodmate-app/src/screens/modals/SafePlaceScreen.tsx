/**
 * SafePlaceScreen — Calm Forest "Safe Place" visualization
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
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { hapticLight, hapticSuccess, hapticMedium } from '@/utils/haptics';
import { fonts, fontSizes, spacing, radii, calm } from '@/theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'SafePlace'>;

const { width: SW } = Dimensions.get('window');

const STEPS = [
  {
    icon: 'sunny-outline' as const,
    title: 'Arrive',
    body: 'Close your eyes. Take a slow breath in… and out.\n\nImagine a place where you feel completely safe — somewhere real or imagined, indoors or outdoors. It belongs only to you.',
    cta: 'I can picture it',
    color: calm.dustyBlue,
  },
  {
    icon: 'eye-outline' as const,
    title: 'Look around',
    body: "What do you see in your safe place?\n\nNotice the colours, the light. Is it morning or evening? What's nearby — trees, water, walls, open sky?\n\nLet the scene come into focus.",
    cta: 'I can see it clearly',
    color: calm.primary,
  },
  {
    icon: 'hand-left-outline' as const,
    title: 'Feel the space',
    body: 'What does the air feel like against your skin?\n\nIs it warm and gentle, or cool and crisp? Feel the ground beneath you — solid and supportive.\n\nYou are held. You are safe.',
    cta: 'I feel it',
    color: calm.amber,
  },
  {
    icon: 'water-outline' as const,
    title: 'Breathe here',
    body: 'In your safe place, breathing is easy.\n\nBreathe in slowly for 4 counts… hold for 2… breathe out for 6.\n\nWith every exhale, you release a little more tension.',
    cta: 'I feel calmer',
    color: calm.dustyPurple,
  },
  {
    icon: 'bookmark-outline' as const,
    title: 'Anchor it',
    body: 'Before you leave, take a mental snapshot. This place is always here for you.\n\nTouch your thumb and forefinger together gently. This is your anchor — whenever you do this, you can return.\n\nYou carry your safe place with you.',
    cta: "I've anchored it",
    color: calm.mint,
    isLast: true,
  },
] as const;

export function SafePlaceScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [stepIdx, setStepIdx] = useState(0);

  const iconScale = useRef(new Animated.Value(0.7)).current;
  const iconOp    = useRef(new Animated.Value(0)).current;
  const titleOp    = useRef(new Animated.Value(0)).current;
  const titleY     = useRef(new Animated.Value(16)).current;
  const bodyOp     = useRef(new Animated.Value(0)).current;
  const bodyY      = useRef(new Animated.Value(14)).current;
  const btnOp      = useRef(new Animated.Value(0)).current;
  const bgOp       = useRef(new Animated.Value(1)).current;
  const btnScale   = useRef(new Animated.Value(1)).current;

  const animateIn = () => {
    iconScale.setValue(0.6);
    iconOp.setValue(0);
    titleOp.setValue(0);
    titleY.setValue(18);
    bodyOp.setValue(0);
    bodyY.setValue(14);
    btnOp.setValue(0);

    Animated.stagger(70, [
      Animated.parallel([
        Animated.spring(iconScale, { toValue: 1, friction: 5, tension: 130, useNativeDriver: true }),
        Animated.timing(iconOp,   { toValue: 1, duration: 300, useNativeDriver: true }),
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
      {/* Back button */}
      <Pressable
        style={[s.backBtn, { top: insets.top + spacing.md }]}
        onPress={() => { hapticLight(); navigation.goBack(); }}
        hitSlop={12}
      >
        <Ionicons name="close" size={18} color={calm.forest} />
      </Pressable>

      {/* Progress dots */}
      <View style={[s.dots, { top: insets.top + spacing.md }]}>
        {STEPS.map((_, i) => (
          <View
            key={i}
            style={[
              s.dot,
              i === stepIdx && [s.dotActive, { backgroundColor: step.color }],
              i < stepIdx && s.dotDone,
            ]}
          />
        ))}
      </View>

      {/* Content */}
      <Animated.View style={[s.content, { opacity: bgOp, paddingTop: insets.top + 70, paddingBottom: insets.bottom + 40 }]}>
        <Animated.View
          style={[s.iconCircle, { backgroundColor: step.color + '1F', opacity: iconOp, transform: [{ scale: iconScale }] }]}
        >
          <Ionicons name={step.icon} size={44} color={step.color} />
        </Animated.View>

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
          <Pressable style={[s.btn, { backgroundColor: step.color }]} onPress={goNext}>
            <Text style={s.btnText}>{step.cta}</Text>
          </Pressable>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: calm.bg },

  backBtn: {
    position: 'absolute',
    left: spacing.lg,
    zIndex: 10,
    width: 36, height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: calm.border,
    alignItems: 'center',
    justifyContent: 'center',
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
    backgroundColor: calm.border,
  },
  dotActive: {
    width: 18,
    borderRadius: 3,
  },
  dotDone: {
    backgroundColor: calm.faint,
  },

  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl + spacing.sm,
    gap: spacing.xl,
  },

  iconCircle: {
    width: 110, height: 110, borderRadius: 55,
    alignItems: 'center', justifyContent: 'center',
  },

  title: {
    fontFamily: fonts.displayExtraBold,
    fontSize: fontSizes.xxl,
    color: calm.forest,
    textAlign: 'center',
    letterSpacing: -0.29,
  },

  body: {
    fontFamily: fonts.body,
    fontSize: fontSizes.base,
    color: calm.muted,
    textAlign: 'center',
    lineHeight: 26,
  },

  btnWrap: { width: SW - spacing.xl * 2 - spacing.sm * 2 },
  btn: { borderRadius: radii.pill, paddingVertical: 18, alignItems: 'center' },
  btnText: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.base,
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
});
