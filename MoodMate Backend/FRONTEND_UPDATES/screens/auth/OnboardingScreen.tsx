import React, { useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated,
  Dimensions, ScrollView, StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { fonts, fontSizes } from '@/theme/tokens';

const { width: W, height: H } = Dimensions.get('window');

const WHITE = '#FFFFFF';

const SLIDES = [
  {
    grad:    ['#1A0A3C', '#2D1060', '#5B21B6'] as const,
    icon:    'heart-circle' as const,
    color:   '#C4B5FD',
    title:   'Track Your Mood',
    body:    'Check in daily and see how your emotions shift over time. Understanding your patterns is the first step to wellness.',
  },
  {
    grad:    ['#0F1B40', '#1E3A7A', '#2563EB'] as const,
    icon:    'chatbubble-ellipses' as const,
    color:   '#93C5FD',
    title:   'Talk to Someone',
    body:    'Connect with an AI companion or a real counsellor — whoever you need, whenever you need them.',
  },
  {
    grad:    ['#1A0A3C', '#3B1275', '#7C3AED'] as const,
    icon:    'fitness' as const,
    color:   '#A78BFA',
    title:   'Build Healthy Habits',
    body:    'From guided meditations to CBT exercises and breathing tools — everything you need to thrive is right here.',
  },
  {
    grad:    ['#0F2818', '#1A5C34', '#16A34A'] as const,
    icon:    'trophy' as const,
    color:   '#86EFAC',
    title:   'Grow Every Day',
    body:    'Earn XP, level up your wellness tree, and celebrate every small win on your journey to feeling better.',
    xp:      true,
  },
];

export function OnboardingScreen() {
  const nav    = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const [idx, setIdx] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const scales = useRef(SLIDES.map(() => new Animated.Value(0))).current;
  const ops    = useRef(SLIDES.map(() => new Animated.Value(0))).current;
  const ys     = useRef(SLIDES.map(() => new Animated.Value(30))).current;

  const animate = (i: number) => {
    scales[i].setValue(0); ops[i].setValue(0); ys[i].setValue(30);
    Animated.sequence([
      Animated.spring(scales[i], { toValue: 1, friction: 5, tension: 100, useNativeDriver: true }),
      Animated.parallel([
        Animated.timing(ops[i], { toValue: 1, duration: 380, useNativeDriver: true }),
        Animated.timing(ys[i], { toValue: 0, duration: 380, useNativeDriver: true }),
      ]),
    ]).start();
  };

  React.useEffect(() => { animate(0); }, []);

  const go = (next: number) => {
    if (next >= SLIDES.length) { nav.replace('RoleSelect'); return; }
    scrollRef.current?.scrollTo({ x: next * W, animated: true });
    setIdx(next);
    animate(next);
  };

  return (
    <View style={{ flex: 1 }}>
      <StatusBar barStyle="light-content" />
      <ScrollView ref={scrollRef} horizontal pagingEnabled scrollEnabled={false} showsHorizontalScrollIndicator={false}>
        {SLIDES.map((slide, i) => (
          <LinearGradient key={i} colors={slide.grad} style={[s.slide, { width: W, height: H }]}>

            {/* Skip */}
            {i < SLIDES.length - 1 && (
              <TouchableOpacity style={[s.skip, { top: insets.top + 16 }]} onPress={() => nav.replace('RoleSelect')}>
                <Text style={s.skipTxt}>Skip</Text>
              </TouchableOpacity>
            )}

            {/* Icon */}
            <Animated.View style={{ transform: [{ scale: scales[i] }], marginBottom: 44 }}>
              <View style={[s.ring, { borderColor: `${slide.color}50` }]}>
                <View style={[s.iconBg, { backgroundColor: `${slide.color}20` }]}>
                  <Ionicons name={slide.icon} size={76} color={slide.color} />
                </View>
              </View>
            </Animated.View>

            {/* Text */}
            <Animated.View style={[s.textWrap, { opacity: ops[i], transform: [{ translateY: ys[i] }] }]}>
              <Text style={s.title}>{slide.title}</Text>
              <Text style={s.body}>{slide.body}</Text>
              {(slide as any).xp && (
                <View style={s.xpPill}>
                  <Ionicons name="trophy-outline" size={14} color="#FCD34D" />
                  <Text style={s.xpTxt}>+50 XP just for getting started</Text>
                </View>
              )}
            </Animated.View>

            {/* Footer */}
            <View style={[s.footer, { paddingBottom: insets.bottom + 36 }]}>
              <View style={s.dotsRow}>
                {SLIDES.map((_, d) => (
                  <View key={d} style={[s.dot, d === i && s.dotOn]} />
                ))}
              </View>
              {i < SLIDES.length - 1 ? (
                <TouchableOpacity style={s.arrowBtn} onPress={() => go(i + 1)}>
                  <Ionicons name="arrow-forward" size={26} color={WHITE} />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={{ width: W - 64 }} onPress={() => go(SLIDES.length)}>
                  <LinearGradient colors={['#7C3AED', '#9333EA']} style={s.startBtn}>
                    <Text style={s.startTxt}>Get Started</Text>
                    <Ionicons name="arrow-forward" size={18} color={WHITE} style={{ marginLeft: 8 }} />
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </View>
          </LinearGradient>
        ))}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  slide:    { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  skip:     { position: 'absolute', right: 24 },
  skipTxt:  { fontFamily: fonts.bodyMedium, fontSize: 13, color: 'rgba(255,255,255,0.55)' },

  ring:   { width: 210, height: 210, borderRadius: 105, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  iconBg: { width: 164, height: 164, borderRadius: 82, alignItems: 'center', justifyContent: 'center' },

  textWrap: { alignItems: 'center', marginBottom: 48 },
  title:    { fontFamily: fonts.display, fontSize: 28, color: WHITE, textAlign: 'center', marginBottom: 14, lineHeight: 36 },
  body:     { fontFamily: fonts.body, fontSize: fontSizes.lg, color: 'rgba(255,255,255,0.70)', textAlign: 'center', lineHeight: 26 },
  xpPill:   { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 20, backgroundColor: 'rgba(255,255,255,0.14)', paddingHorizontal: 16, paddingVertical: 9, borderRadius: 20 },
  xpTxt:    { fontFamily: fonts.bodyBold, fontSize: 12, color: '#FCD34D' },

  footer:    { position: 'absolute', bottom: 0, left: 0, right: 0, alignItems: 'center', gap: 28 },
  dotsRow:   { flexDirection: 'row', gap: 8 },
  dot:       { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.28)' },
  dotOn:     { width: 28, backgroundColor: WHITE },

  arrowBtn:  { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.28)' },
  startBtn:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 56, borderRadius: 28 },
  startTxt:  { fontFamily: fonts.bodyBold, fontSize: fontSizes.lg, color: WHITE },
});
