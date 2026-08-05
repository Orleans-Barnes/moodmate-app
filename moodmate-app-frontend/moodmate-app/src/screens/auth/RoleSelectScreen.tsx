/**
 * RoleSelectScreen — Welcome landing (Figma "05 Welcome")
 *
 * WhatsApp-inspired forest hero with a straight edge into the body.
 * Counsellor/Peer Mentor/Admin paths stay reachable via the portal link and
 * the hidden 7-tap admin gesture on the logo.
 */
import React, { useRef, useCallback, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, Image, ScrollView, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { fonts, fontSizes, spacing, radii, calm, headerCurve } from '@/theme/tokens';
import { PressScale } from '@/components/PressScale';
import { useState } from 'react';

type Props = NativeStackScreenProps<RootStackParamList, 'RoleSelect'>;

const ADMIN_TAP_TARGET = 7;
const ADMIN_TAP_WINDOW_MS = 2500;

const logoWatermark = require('@/assets/moodmate-logo-watermark.png');

function FloatingDot({ x, y, size, color, delay }: { x: number; y: number; size: number; color: string; delay: number }) {
  const float = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(float, { toValue: 1, duration: 2200 + delay, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(float, { toValue: 0, duration: 2200 + delay, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    const timer = setTimeout(() => loop.start(), delay);
    return () => { clearTimeout(timer); loop.stop(); };
  }, [float, delay]);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        transform: [{ translateY: float.interpolate({ inputRange: [0, 1], outputRange: [0, -8] }) }],
        opacity: float.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.55, 1, 0.55] }),
      }}
    />
  );
}

export function RoleSelectScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [agreed, setAgreed] = useState(false);

  const bodyOpacity = useRef(new Animated.Value(0)).current;
  const bodyY = useRef(new Animated.Value(24)).current;
  const logoScale = useRef(new Animated.Value(0.88)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(logoScale, { toValue: 1, friction: 6, tension: 80, useNativeDriver: true }),
      Animated.timing(bodyOpacity, { toValue: 1, duration: 520, delay: 180, useNativeDriver: true }),
      Animated.timing(bodyY, { toValue: 0, duration: 520, delay: 180, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, [bodyOpacity, bodyY, logoScale]);

  const tapCount = useRef(0);
  const lastTapAt = useRef(0);
  const handleLogoTap = () => {
    const now = Date.now();
    if (now - lastTapAt.current > ADMIN_TAP_WINDOW_MS) tapCount.current = 0;
    lastTapAt.current = now;
    tapCount.current += 1;
    if (tapCount.current >= ADMIN_TAP_TARGET) {
      tapCount.current = 0;
      navigation.navigate('Login', { role: 'ADMIN' });
    }
  };

  useFocusEffect(
    useCallback(() => () => {
      tapCount.current = 0;
      lastTapAt.current = 0;
    }, []),
  );

  return (
    <View style={s.root}>
      <ScrollView showsVerticalScrollIndicator={false} bounces={false} contentContainerStyle={s.scroll}>
        <LinearGradient
          colors={[calm.forest, calm.forestPanel]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[s.hero, { paddingTop: insets.top + spacing.xl, paddingBottom: spacing.xxxl }]}
        >
          <View style={s.orbLarge} />
          <View style={s.orbSmall} />

          <FloatingDot x={68} y={45} size={30} color={calm.amber} delay={0} />
          <FloatingDot x={300} y={75} size={22} color={calm.dustyBlue} delay={400} />
          <FloatingDot x={86} y={225} size={26} color={calm.dustyPink} delay={800} />
          <FloatingDot x={306} y={225} size={18} color={calm.mint} delay={1200} />

          <Pressable onPress={handleLogoTap} accessibilityRole="image" accessibilityLabel="MoodMate">
            <Animated.View style={[s.circle, { transform: [{ scale: logoScale }] }]}>
              <Image source={logoWatermark} style={s.watermark} resizeMode="contain" />
            </Animated.View>
          </Pressable>
        </LinearGradient>

        <Animated.View style={[s.body, { opacity: bodyOpacity, transform: [{ translateY: bodyY }] }]}>
          <Text style={s.sub}>Your mental wellness companion,{'\n'}built for student life.</Text>

          <View style={s.consentRow}>
            <Pressable
              style={[s.checkbox, agreed && s.checkboxChecked]}
              onPress={() => setAgreed((v) => !v)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: agreed }}
              accessibilityLabel="Agree to MoodMate terms and privacy policy"
              hitSlop={10}
            >
              {agreed && <Ionicons name="checkmark" size={13} color="#FFFFFF" />}
            </Pressable>
            <Text style={s.consentText} onPress={() => setAgreed((v) => !v)}>
              I agree to MoodMate's Terms and{' '}
              <Text style={s.consentLink} onPress={() => navigation.navigate('PrivacyPolicy')}>
                Privacy Policy
              </Text>
              .
            </Text>
          </View>

          <PressScale
            style={[s.ctaWrap, !agreed && s.ctaDisabled]}
            onPress={() => agreed && navigation.navigate('Signup')}
            disabled={!agreed}
          >
            <LinearGradient
              colors={[calm.primary, calm.primaryDeep]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={s.cta}
            >
              <Text style={s.ctaText}>Create an account</Text>
            </LinearGradient>
          </PressScale>

          <Pressable onPress={() => navigation.navigate('Login', { role: 'STUDENT' })} style={s.loginLink}>
            <Text style={s.loginText}>
              Already have an account? <Text style={s.loginBold}>Log in</Text>
            </Text>
          </Pressable>

          <Pressable onPress={() => navigation.navigate('CounsellorOrMentor')} style={s.portalLink}>
            <Text style={s.portalText}>Counsellor or Peer Mentor? →</Text>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const CIRCLE = 280;

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: calm.bg },
  scroll: { flexGrow: 1 },

  hero: {
    alignItems: 'center',
    overflow: 'hidden',
    minHeight: 420,
    justifyContent: 'center',
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  orbLarge: {
    position: 'absolute',
    top: -40,
    right: -60,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  orbSmall: {
    position: 'absolute',
    bottom: 80,
    left: -40,
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(37,211,102,0.12)',
  },
  circle: {
    width: CIRCLE,
    height: CIRCLE,
    borderRadius: CIRCLE / 2,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  watermark: { width: CIRCLE * 0.68, height: CIRCLE * 0.68, opacity: 0.85 },

  body: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xxxl,
    alignItems: 'center',
  },
  sub: {
    fontFamily: fonts.body,
    fontSize: fontSizes.md - 1,
    color: calm.muted,
    textAlign: 'center',
    lineHeight: 25,
    marginBottom: spacing.xxl,
  },

  consentRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.xl, width: '100%' },
  checkbox: {
    width: 22, height: 22, borderRadius: 7, marginTop: 1,
    borderWidth: 1.5, borderColor: calm.border,
    alignItems: 'center', justifyContent: 'center',
  },
  checkboxChecked: { backgroundColor: calm.primary, borderColor: calm.primary },
  consentText: { flex: 1, fontFamily: fonts.body, fontSize: fontSizes.base - 1, color: calm.muted, lineHeight: 19 },
  consentLink: { fontFamily: fonts.bodyBold, color: calm.primary },

  ctaWrap: { width: '100%', marginBottom: spacing.xl },
  ctaDisabled: { opacity: 0.4 },
  cta: {
    borderRadius: radii.pill,
    paddingVertical: 19,
    alignItems: 'center',
  },
  ctaText: { fontFamily: fonts.bodyBold, fontSize: fontSizes.md, color: '#FFFFFF' },

  loginLink: { marginBottom: spacing.xl },
  loginText: { fontFamily: fonts.bodyBold, fontSize: fontSizes.base, color: calm.muted },
  loginBold: { color: calm.forest },

  portalLink: {},
  portalText: { fontFamily: fonts.bodyMedium, fontSize: fontSizes.base - 1, color: calm.muted },
});
