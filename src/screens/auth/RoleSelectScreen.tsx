import React, { useEffect, useRef } from 'react';
import {
  View, Text, Image, Pressable, StyleSheet, Animated, Easing, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList, UserRole } from '@/navigation/types';
import { useAuthStore } from '@/state/useAuthStore';
import { fonts, fontSizes, spacing, radii, shadow, glow } from '@/theme/tokens';
import { DarkGlassView } from '@/components/GlassView';

type Props = NativeStackScreenProps<RootStackParamList, 'RoleSelect'>;

const { width: SW } = Dimensions.get('window');

const ROLES: {
  role: UserRole;
  emoji: string;
  title: string;
  subtitle: string;
  badge: string;
  gradient: [string, string, ...string[]];
  iconBg: string;
  badgeBg: string;
  badgeColor: string;
  accentColor: string;
  glowColor: string;
}[] = [
  {
    role: 'STUDENT',
    emoji: '🎓',
    title: 'Student',
    subtitle: 'Track moods, journal daily, access wellness tools & connect with a counsellor',
    badge: 'Most common',
    gradient: ['#12291F', '#1A3A2B'],
    iconBg: 'rgba(149,213,178,0.2)',
    badgeBg: 'rgba(149,213,178,0.25)',
    badgeColor: '#95D5B2',
    accentColor: '#52B788',
    glowColor: 'rgba(82,183,136,0.35)',
  },
  {
    role: 'COUNSELLOR',
    emoji: '💙',
    title: 'Counsellor · Peer Mentor',
    subtitle: 'Manage sessions, support students & track appointment history',
    badge: 'Provider',
    gradient: [	'#0F2A1F', '#15402F'],
    iconBg: 'rgba(125,196,160,0.2)',
    badgeBg: 'rgba(125,196,160,0.2)',
    badgeColor: '#7DC4A0',
    accentColor: '#3D7A5C',
    glowColor: 'rgba(92,138,230,0.35)',
  },
  {
    role: 'ADMIN',
    emoji: '🔑',
    title: 'Administrator',
    subtitle: 'Manage platform, approve counsellors & monitor campus wellbeing',
    badge: 'Restricted',
    gradient: ['#0B1F16', '#123527'],
    iconBg: 'rgba(61,122,92,0.35)0.2)',
    badgeBg: 'rgba(61,122,92,0.35)0.2)',
    badgeColor: '#A8D4BC',
    accentColor: '#2A5C45',
    glowColor: 'rgba(27,140,110,0.35)',
  },
];

// ── Floating orb ──────────────────────────────────────────────────────────────
function Orb({ color, size, x, y, dur, delay = 0 }: {
  color: string; size: number; x: number; y: number; dur: number; delay?: number;
}) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: dur, delay, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: dur, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    ).start();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [0, -24] });
  return (
    <Animated.View pointerEvents="none" style={{
      position: 'absolute', left: x, top: y,
      width: size, height: size, borderRadius: size / 2,
      backgroundColor: color, opacity: 0.18,
      transform: [{ translateY }],
    }} />
  );
}

// ── Role card — glassmorphism upgrade ─────────────────────────────────────────
function RoleCard({ item, onPress, delay }: {
  item: typeof ROLES[0];
  onPress: () => void;
  delay: number;
}) {
  const scale   = useRef(new Animated.Value(1)).current;
  const entered = useRef(new Animated.Value(0)).current;
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
      <Pressable onPressIn={pressIn} onPressOut={pressOut} onPress={onPress}>
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
          {/* Color accent top border */}
          <View style={[s.cardAccentBar, { backgroundColor: item.accentColor }]} />

          {/* Left: icon */}
          <View style={[s.iconCircle, { backgroundColor: item.iconBg }]}>
            <Text style={s.iconEmoji}>{item.emoji}</Text>
          </View>

          {/* Middle: text */}
          <View style={s.cardText}>
            <View style={s.titleRow}>
              <Text style={s.cardTitle}>{item.title}</Text>
              <View style={[s.badge, { backgroundColor: item.badgeBg }]}>
                <Text style={[s.badgeLabel, { color: item.badgeColor }]}>{item.badge}</Text>
              </View>
            </View>
            <Text style={s.cardSub} numberOfLines={2}>{item.subtitle}</Text>
          </View>

          {/* Right: arrow */}
          <Text style={[s.arrow, { color: item.badgeColor }]}>›</Text>
        </LinearGradient>
        </DarkGlassView>
      </Pressable>
    </Animated.View>
  );
}

// ── Screen ─────────────────────────────────────────────────────────────────────
export function RoleSelectScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const loginAsGuest = useAuthStore((s) => s.loginAsGuest);

  const handleGuest = () => {
    loginAsGuest();
    navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
  };

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
        colors={[	'#0D1B12', '#152E22', '#1B3A2B']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Floating orbs */}
      <Orb color="#52B788" size={220} x={-80}   y={-60}  dur={4200} />
      <Orb color="#5C8AE6" size={160} x={SW-90}  y={80}   dur={3800} delay={400} />
      <Orb color="#8E7BC0" size={140} x={20}     y={300}  dur={4600} delay={200} />
      <Orb color="#FF6F4D" size={100} x={SW-70}  y={420}  dur={3500} delay={600} />

      {/* Content */}
      <View style={[s.content, { paddingTop: insets.top + spacing.xl }]}>
        {/* Logo */}
        <Animated.View style={[s.logoWrap, slide(logoAnim, 30)]}>
          <LinearGradient
            colors={['#5F9E7C', '#2A5C45']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={s.logoCircle}
          >
            <Image source={require('../../../assets/logo-white.png')} resizeMode="contain" style={{ width: 42, height: 42 }} />
          </LinearGradient>
          <Text style={s.brand}>MoodMate</Text>
        </Animated.View>

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
              key={item.role}
              item={item}
              delay={300 + i * 120}
              onPress={() => navigation.navigate('Login', { role: item.role })}
            />
          ))}
        </View>

        {/* Guest entry */}
        <Pressable style={s.guestLink} onPress={handleGuest}>
          <Text style={s.guestTxt}>👤  Continue as guest</Text>
        </Pressable>

        {/* Footer */}
        <Text style={[s.footer, { paddingBottom: insets.bottom + spacing.md }]}>
          All data is encrypted & confidential 🔒
        </Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  content: { flex: 1, alignItems: 'center', paddingHorizontal: spacing.lg },

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
  logoEmoji: { fontSize: 30 },
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
    borderRadius: 20,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
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
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  iconCircle: {
    width: 52, height: 52, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  iconEmoji: { fontSize: 24 },
  cardText: { flex: 1, gap: 4 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' },
  cardTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.base,
    color: '#FFFFFF',
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
  },
  arrow: { fontSize: 28, fontFamily: fonts.bodyBold, flexShrink: 0 },

  // Guest link
  guestLink: { marginTop: spacing.sm, paddingVertical: 12, paddingHorizontal: 24 },
  guestTxt: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.sm,
    color: 'rgba(255,255,255,0.45)',
    textAlign: 'center',
  },

  // Footer
  footer: {
    marginTop: 'auto',
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.xs,
    color: 'rgba(255,255,255,0.35)',
    textAlign: 'center',
  },
});
