/**
 * OnboardingScreen — Calm Forest 3-slide onboarding (Figma "02–04 Onboarding")
 *
 * Flat off-white background per slide, code-composed organic illustrations
 * (Figma exported these as flattened raster art with no reusable vector data —
 * same reason TreeBlob/StudentIllustration are code-composed elsewhere), an
 * animated dot pager, solid green pill CTA ("Continue" → "Get started" on the
 * last slide). Slide 3 reuses <TreeBlob> since Figma's own "grow a wellness
 * tree" motif is the same canopy-cluster art already built for the Wellness
 * Tree / "You're All Set" screens.
 */
import React, { useRef, useState } from 'react';
import {
  View, Text, Pressable, StyleSheet, Animated, Easing,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { fonts, fontSizes, spacing, radii, calm } from '@/theme/tokens';
import { useAuthStore } from '@/state/useAuthStore';
import { getProfileStatus } from '@/api/profileSetup';
import { TreeBlob } from '@/components/illustrations/TreeBlob';

type Props = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;

const SLIDES = [
  {
    key: '1',
    title: 'Know how you\nactually feel',
    body: 'Check in each day and name the emotion behind the noise. Ten taps, ten seconds.',
    illustration: 'face' as const,
    tint: 'none' as const,
  },
  {
    key: '2',
    title: 'Write it down,\nlet it go',
    body: 'Guided prompts for exam panic, homesickness and everything in between. Private by default.',
    illustration: 'journal' as const,
    tint: 'block' as const,
  },
  {
    key: '3',
    title: 'Grow something\nwhile you heal',
    body: 'Every check-in, journal entry and breathing exercise grows your wellness tree.',
    illustration: 'tree' as const,
    tint: 'none' as const,
  },
] as const;

function Dot({ x, y, size, color }: { x: number; y: number; size: number; color: string }) {
  return (
    <View
      style={{
        position: 'absolute', left: x, top: y, width: size, height: size,
        borderRadius: size / 2, backgroundColor: color,
      }}
    />
  );
}

/** Slide 1 — a smiling face nested among floating pastel dots, no backdrop tint. */
function FaceIllustration() {
  return (
    <View style={illo.faceWrap}>
      <Dot x={33} y={32} size={120} color={calm.amber} />
      <Dot x={225} y={16} size={86} color={calm.dustyBlue} />
      <Dot x={293} y={122} size={64} color={calm.dustyPurple} />
      <Dot x={45} y={192} size={72} color={calm.terracotta} />
      <Dot x={173} y={240} size={54} color={calm.mint} />
      <Dot x={261} y={218} size={60} color={calm.dustyPink} />
      <View style={illo.face}>
        <Ionicons name="happy-outline" size={44} color="#FFFFFF" />
      </View>
    </View>
  );
}

/** Slide 2 — two rotated, stacked cards (a torn journal page) with a quote mark and text lines. */
function JournalIllustration() {
  return (
    <View style={illo.journalWrap}>
      <View style={illo.journalGlow} />
      <View style={illo.pageBack} />
      <View style={illo.pageFront} />
      <Text style={illo.quoteMark}>&ldquo;</Text>
      <View style={[illo.line, { left: 100, top: 96 }]} />
      <View style={[illo.line, { left: 100, top: 118 }]} />
      <View style={[illo.line, { left: 100, top: 140 }]} />
      <View style={[illo.line, { left: 100, top: 162 }]} />
      <View style={[illo.line, { left: 100, top: 184, width: 65 }]} />
      <Dot x={14} y={54} size={26} color={calm.dustyBlue} />
      <Dot x={244} y={196} size={38} color={calm.amber} />
    </View>
  );
}

/** Slide 3 — the shared wellness-tree canopy motif, matching the Wellness Tree screen. */
function TreeIllustration() {
  return (
    <View style={illo.treeWrap}>
      <View style={illo.treeGlow} />
      <TreeBlob size={230} />
      <Dot x={168} y={78} size={14} color={calm.dustyPink} />
      <View style={illo.groundShadow} />
    </View>
  );
}

const ILLUSTRATIONS = { face: FaceIllustration, journal: JournalIllustration, tree: TreeIllustration };

function PageDot({ active }: { active: boolean }) {
  const width = useRef(new Animated.Value(active ? 24 : 10)).current;
  React.useEffect(() => {
    Animated.spring(width, { toValue: active ? 24 : 10, friction: 7, tension: 140, useNativeDriver: false }).start();
  }, [active]); // eslint-disable-line react-hooks/exhaustive-deps
  return <Animated.View style={[s.dot, { width, backgroundColor: active ? calm.primary : calm.dotInactive }]} />;
}

export function OnboardingScreen({ navigation }: Props) {
  const [index, setIndex] = useState(0);
  const insets = useSafeAreaInsets();
  const btnScale = useRef(new Animated.Value(1)).current;
  const contentOpacity = useRef(new Animated.Value(1)).current;
  const contentY = useRef(new Animated.Value(0)).current;

  const token = useAuthStore((st) => st.token);

  const goToPostOnboarding = async () => {
    if (!token || token === 'guest') {
      navigation.replace('Main');
      return;
    }
    try {
      const status = await getProfileStatus(token);
      navigation.replace(status.canShowOnboarding ? 'ProfileSetup' : 'Main');
    } catch {
      navigation.replace('Main');
    }
  };

  const goToIndex = (next: number) => {
    if (next === index) return;
    Animated.parallel([
      Animated.timing(contentOpacity, { toValue: 0, duration: 130, useNativeDriver: true }),
      Animated.timing(contentY, { toValue: next > index ? -10 : 10, duration: 130, useNativeDriver: true }),
    ]).start(() => {
      setIndex(next);
      contentY.setValue(next > index ? 10 : -10);
      Animated.parallel([
        Animated.timing(contentOpacity, { toValue: 1, duration: 240, useNativeDriver: true }),
        Animated.timing(contentY, { toValue: 0, duration: 240, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]).start();
    });
  };

  const handleNext = () => {
    Animated.sequence([
      Animated.spring(btnScale, { toValue: 0.96, speed: 60, bounciness: 0, useNativeDriver: true }),
      Animated.spring(btnScale, { toValue: 1, speed: 30, bounciness: 8, useNativeDriver: true }),
    ]).start();

    if (index < SLIDES.length - 1) goToIndex(index + 1);
    else goToPostOnboarding();
  };

  const slide = SLIDES[index];
  const isLast = index === SLIDES.length - 1;
  const Illustration = ILLUSTRATIONS[slide.illustration];

  return (
    <View style={s.root}>
      <Animated.View style={{ opacity: contentOpacity, transform: [{ translateY: contentY }] }}>
        <View style={[s.illustrationArea, slide.tint === 'block' && { backgroundColor: calm.mintBg }]}>
          <Illustration />
        </View>

        <View style={s.copy}>
          <Text style={s.title}>{slide.title}</Text>
          <Text style={s.body}>{slide.body}</Text>
        </View>
      </Animated.View>

      <View style={[s.footer, { paddingBottom: insets.bottom + spacing.xl }]}>
        <View style={s.footerRow}>
          <View style={s.dots}>
            {SLIDES.map((_, i) => (
              <Pressable key={i} onPress={() => goToIndex(i)} hitSlop={8}>
                <PageDot active={i === index} />
              </Pressable>
            ))}
          </View>
          {!isLast && (
            <Pressable onPress={goToPostOnboarding} hitSlop={8}>
              <Text style={s.skip}>Skip</Text>
            </Pressable>
          )}
        </View>

        <Animated.View style={{ transform: [{ scale: btnScale }] }}>
          <Pressable style={s.cta} onPress={handleNext}>
            <Text style={s.ctaText}>{isLast ? 'Get started' : 'Continue'}</Text>
          </Pressable>
        </Animated.View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: calm.bg },

  illustrationArea: {
    height: 400,
    marginTop: 70,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },

  copy: { paddingHorizontal: spacing.xxxl, gap: spacing.md + 2, marginTop: spacing.xxxxl },
  title: {
    fontFamily: fonts.displayExtraBold,
    fontSize: fontSizes.xxl + 8,
    lineHeight: 38,
    color: calm.forest,
    letterSpacing: -0.48,
  },
  body: {
    fontFamily: fonts.body,
    fontSize: fontSizes.md,
    lineHeight: 26,
    color: calm.muted,
  },

  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: spacing.xxxl, gap: spacing.xxl },
  footerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dots: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  dot: { height: 10, borderRadius: 5 },
  skip: { fontFamily: fonts.bodyBold, fontSize: fontSizes.md - 1, color: calm.muted },

  cta: {
    backgroundColor: calm.primary,
    borderRadius: radii.pill,
    paddingVertical: 19,
    alignItems: 'center',
  },
  ctaText: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.md,
    color: '#FFFFFF',
  },
});

const illo = StyleSheet.create({
  // Slide 1 — face + floating dots, sized/positioned to match the Figma cluster 1:1
  faceWrap: { width: 360, height: 320 },
  face: {
    position: 'absolute', left: 125, top: 92,
    width: 150, height: 150, borderRadius: 75,
    backgroundColor: calm.forest,
    alignItems: 'center', justifyContent: 'center',
  },

  // Slide 2 — rotated card stack + straight (unrotated) quote/lines laid on top,
  // matching Figma's own choice to keep the text legible over the tilted card.
  journalWrap: { width: 300, height: 300 },
  journalGlow: {
    position: 'absolute', left: -10, top: 85, width: 230, height: 230, borderRadius: 115,
    backgroundColor: '#DFEAE3',
  },
  pageBack: {
    position: 'absolute', left: 10, top: 30, width: 210, height: 250, borderRadius: 24,
    backgroundColor: '#FFFFFF', transform: [{ rotate: '8deg' }],
  },
  pageFront: {
    position: 'absolute', left: 65, top: 18, width: 210, height: 250, borderRadius: 24,
    backgroundColor: calm.forest, transform: [{ rotate: '-6deg' }],
  },
  quoteMark: {
    position: 'absolute', left: 96, top: 30,
    fontFamily: fonts.displayExtraBold, fontSize: 52, color: calm.journalQuote, height: 44,
  },
  line: { position: 'absolute', width: 130, height: 8, borderRadius: 4, backgroundColor: calm.journalLine },

  // Slide 3 — shared wellness-tree canopy
  treeWrap: { width: 300, height: 300, alignItems: 'center', justifyContent: 'center' },
  treeGlow: {
    position: 'absolute', width: 280, height: 280, borderRadius: 140,
    backgroundColor: '#E4EFE7',
  },
  groundShadow: {
    position: 'absolute', bottom: 24, width: 190, height: 8, borderRadius: 4,
    backgroundColor: calm.track,
  },
});
