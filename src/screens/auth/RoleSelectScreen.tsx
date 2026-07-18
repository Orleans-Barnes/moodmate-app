import React, { useEffect, useRef, useCallback } from 'react';
import {
  View, Text, Pressable, StyleSheet, Animated, Easing, Dimensions, ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useIsFocused } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { fonts, fontSizes, spacing, radii, shadow, glow } from '@/theme/tokens';
import { DarkGlassView } from '@/components/GlassView';
import { ROLE_ILLUSTRATIONS, ROLE_CAPTIONS, type RoleIllustrationKey } from '@/constants/roleAssets';

type Props = NativeStackScreenProps<RootStackParamList, 'RoleSelect'>;

const { width: SW } = Dimensions.get('window');

// Hidden Admin access: tap the MoodMate logo 7 times within ADMIN_TAP_WINDOW_MS to reach
// AdminSetup. Not discoverable UI — intentional, per Phase 1B scope (Admin is no longer a
// visible card). Resets automatically if the user pauses too long between taps.
const ADMIN_TAP_TARGET = 7;
const ADMIN_TAP_WINDOW_MS = 2500;

const ROLES: {
  key: RoleIllustrationKey;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  badge: string;
  gradient: [string, string, ...string[]];
  iconBg: string;
  badgeBg: string;
  badgeColor: string;
  accentColor: string;
  onPress: (nav: Props['navigation']) => void;
}[] = [
  {
    key: 'student',
    icon: 'school-outline',
    title: 'Student',
    badge: 'Most common',
    gradient: ['#1A1A2E', '#16213E'],
    iconBg: 'rgba(149,213,178,0.2)',
    badgeBg: 'rgba(149,213,178,0.25)',
    badgeColor: '#95D5B2',
    accentColor: '#52B788',
    onPress: (nav) => nav.navigate('Login', { role: 'STUDENT' }),
  },
  {
    key: 'counsellor',
    icon: 'heart-outline',
    title: 'Counsellor · Peer Mentor',
    badge: 'Provider',
    gradient: ['#0D1B35', '#163257'],
    iconBg: 'rgba(93,188,255,0.2)',
    badgeBg: 'rgba(93,188,255,0.2)',
    badgeColor: '#5DBCFF',
    accentColor: '#5C8AE6',
    onPress: (nav) => nav.navigate('CounsellorOrMentor'),
  },
];

// ── Floating orb ──────────────────────────────────────────────────────────────
// Purely decorative background motion. `active` pauses the loop (via .stop(), not just letting
// it keep running off-screen) whenever the screen isn't focused, so it doesn't burn battery in
// the background while another screen is on top of the stack.
function Orb({ color, size, x, y, dur, delay = 0, active }: {
  color: string; size: number; x: number; y: number; dur: number; delay?: number; active: boolean;
}) {
  const anim = useRef(new Animated.Value(0)).current;
  const loopRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (!active) {
      loopRef.current?.stop();
      return;
    }
    loopRef.current = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: dur, delay, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: dur, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    loopRef.current.start();
    return () => loopRef.current?.stop();
  }, [active]); // eslint-disable-line react-hooks/exhaustive-deps
  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [0, -24] });
  return (
    <Animated.View
      pointerEvents="none"
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden
      style={{
        position: 'absolute', left: x, top: y,
        width: size, height: size, borderRadius: size / 2,
        backgroundColor: color, opacity: 0.18,
        transform: [{ translateY }],
      }}
    />
  );
}

// ── Role card — glassmorphism, code-composed illustration, Ionicons ──────────
function RoleCard({ item, onPress, delay }: {
  item: typeof ROLES[0];
  onPress: () => void;
  delay: number;
}) {
  const scale   = useRef(new Animated.Value(1)).current;
  const entered = useRef(new Animated.Value(0)).current;
  const Illustration = ROLE_ILLUSTRATIONS[item.key];
  const caption = ROLE_CAPTIONS[item.key];

  useEffect(() => {
    Animated.spring(entered, {
      toValue: 1, friction: 7, tension: 45, delay, useNativeDriver: true,
    }).start();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const pressIn = () =>
    Animated.spring(scale, { toValue: 0.97, speed: 60, bounciness: 0, useNativeDriver: true }).start();
  const pressOut = () =>
    Animated.spring(scale, { toValue: 1, speed: 30, bounciness: 6, useNativeDriver: true }).start();

  return (
    <Animated.View style={{
      transform: [
        { scale: Animated.multiply(scale, entered) },
        { translateY: entered.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) },
      ],
      opacity: entered,
      width: SW - spacing.lg * 2,
    }}>
      <Pressable
        onPressIn={pressIn}
        onPressOut={pressOut}
        onPress={onPress}
        accessible
        accessibilityRole="button"
        accessibilityLabel={`${item.title}, ${item.badge}`}
        accessibilityHint={caption}
      >
        <DarkGlassView
          intensity={50}
          overlayColor='rgba(255,255,255,0.05)'
          borderColor={item.accentColor + '55'}
          borderRadius={20}
          style={s.glassWrap}
        >
        <LinearGradient
          colors={item.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={s.card}
        >
          {/* Color accent top border — decorative */}
          <View style={[s.cardAccentBar, { backgroundColor: item.accentColor }]} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden />

          {/* Top-right: arrow — decorative, the whole card is already the single tap target */}
          <View style={[s.arrowCircle, { backgroundColor: item.iconBg }]} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
            <Ionicons name="chevron-forward" size={18} color={item.badgeColor} />
          </View>

          {/* Top: code-composed illustration — decorative, meaning is conveyed by the label/hint above */}
          <View style={[s.illoCircle, { backgroundColor: item.iconBg }]} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
            <Illustration size={64} />
          </View>

          {/* Bottom: text block */}
          <View style={s.cardText}>
            <View style={s.titleRow}>
              <Text style={s.cardTitle}>{item.title}</Text>
              <View style={[s.badge, { backgroundColor: item.badgeBg }]}>
                <Text style={[s.badgeLabel, { color: item.badgeColor }]}>{item.badge}</Text>
              </View>
            </View>
            <Text style={s.cardSub} numberOfLines={2}>{caption}</Text>
          </View>
        </LinearGradient>
        </DarkGlassView>
      </Pressable>
    </Animated.View>
  );
}

// ── Screen ─────────────────────────────────────────────────────────────────────
export function RoleSelectScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();

  // Hidden 7-tap admin gesture on the logo.
  const tapCount = useRef(0);
  const lastTapAt = useRef(0);
  const handleLogoTap = () => {
    const now = Date.now();
    if (now - lastTapAt.current > ADMIN_TAP_WINDOW_MS) {
      tapCount.current = 0;
    }
    lastTapAt.current = now;
    tapCount.current += 1;
    if (tapCount.current >= ADMIN_TAP_TARGET) {
      tapCount.current = 0;
      navigation.navigate('AdminSetup');
    }
  };

  // Leaving this screen always resets the counter, so a partial tap sequence never carries over
  // to the next visit.
  useFocusEffect(
    useCallback(() => {
      return () => {
        tapCount.current = 0;
        lastTapAt.current = 0;
      };
    }, []),
  );

  const logoAnim  = useRef(new Animated.Value(0)).current;
  const titleAnim = useRef(new Animated.Value(0)).current;
  const subAnim   = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(120, [logoAnim, titleAnim, subAnim].map(v =>
      Animated.spring(v, { toValue: 1, friction: 7, tension: 45, useNativeDriver: true }),
    )).start();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const slide = (anim: Animated.Value, offset = 24) => ({
    opacity: anim,
    transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [offset, 0] }) }],
  });

  return (
    <View style={s.root}>
      {/* Background */}
      <LinearGradient
        colors={['#0D0D1A', '#0F1F2E', '#130A2E']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Floating orbs — decorative, paused when this screen isn't focused */}
      <Orb color="#52B788" size={220} x={-80}   y={-60}  dur={4200} active={isFocused} />
      <Orb color="#5C8AE6" size={160} x={SW-90}  y={80}   dur={3800} delay={400} active={isFocused} />
      <Orb color="#8E7BC0" size={140} x={20}     y={300}  dur={4600} delay={200} active={isFocused} />
      <Orb color="#FF6F4D" size={100} x={SW-70}  y={420}  dur={3500} delay={600} active={isFocused} />

      {/* Content — ScrollView so two full-height role cards never overflow on smaller devices */}
      <ScrollView
        style={s.scroll}
        contentContainerStyle={[
          s.content,
          { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing.lg },
        ]}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Logo — 7 taps opens hidden Admin access. Presented to screen readers as a plain,
            non-interactive image so the gesture stays undiscoverable via accessibility tools too. */}
        <Pressable onPress={handleLogoTap} hitSlop={12} accessibilityRole="image" accessibilityLabel="MoodMate">
          <Animated.View style={[s.logoWrap, slide(logoAnim, 30)]}>
            <LinearGradient
              colors={['#FF6F4D', '#8E7BC0']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={s.logoCircle}
            >
              <Ionicons name="leaf-outline" size={30} color="#FFFFFF" />
            </LinearGradient>
            <Text style={s.brand}>MoodMate</Text>
          </Animated.View>
        </Pressable>

        {/* Heading */}
        <Animated.Text style={[s.heading, slide(titleAnim, 24)]}>
          How are you joining?
        </Animated.Text>
        <Animated.Text style={[s.sub, slide(subAnim, 20)]}>
          Select your role to continue
        </Animated.Text>

        {/* Role cards */}
        <View style={s.cards}>
          {ROLES.map((item, i) => (
            <RoleCard
              key={item.key}
              item={item}
              delay={300 + i * 120}
              onPress={() => item.onPress(navigation)}
            />
          ))}
        </View>

        {/* Footer */}
        <View style={s.footerRow} accessible accessibilityLabel="All data is encrypted and confidential">
          <Ionicons name="lock-closed-outline" size={11} color="rgba(255,255,255,0.35)" importantForAccessibility="no-hide-descendants" accessibilityElementsHidden />
          <Text style={s.footer}>All data is encrypted & confidential</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },
  content: { flexGrow: 1, alignItems: 'center', paddingHorizontal: spacing.lg },

  // Logo
  logoWrap:  { alignItems: 'center', marginBottom: spacing.xl },
  logoCircle: {
    width: 72, height: 72, borderRadius: 36,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 10,
    shadowColor: glow.coral,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 20,
    elevation: 10,
  },
  brand: {
    fontFamily: fonts.display,
    fontSize: fontSizes.lg,
    color: '#FFFFFF',
    letterSpacing: 1,
  },

  // Heading
  heading: {
    fontFamily: fonts.display,
    fontSize: fontSizes.display,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  sub: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.sm,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    marginBottom: spacing.xl,
  },

  // Cards
  cards: { width: '100%', gap: spacing.md, alignItems: 'center' },
  glassWrap: { width: '100%' },
  card: {
    height: 232,
    borderRadius: 24,
    padding: spacing.xl,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    overflow: 'hidden',
    ...shadow.md,
  },
  // Accent bar at top of card
  cardAccentBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  arrowCircle: {
    position: 'absolute',
    top: spacing.lg,
    right: spacing.lg,
    width: 32, height: 32, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  illoCircle: {
    width: 92, height: 92, borderRadius: 28,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  cardText: { alignItems: 'center', gap: 6 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, flexWrap: 'wrap' },
  cardTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.lg,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  badge: {
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: radii.pill,
  },
  badgeLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: 9,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardSub: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.xs,
    color: 'rgba(255,255,255,0.6)',
    lineHeight: 17,
    textAlign: 'center',
    paddingHorizontal: spacing.sm,
  },


  // Footer
  footerRow: {
    marginTop: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  footer: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.xs,
    color: 'rgba(255,255,255,0.35)',
    textAlign: 'center',
  },
});
