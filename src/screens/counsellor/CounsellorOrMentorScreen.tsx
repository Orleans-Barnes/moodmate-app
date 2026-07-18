/**
 * CounsellorOrMentorScreen — Phase 1B intermediate screen.
 *
 * Reached only from RoleSelectScreen's combined "Counsellor / Peer Mentor" card. Splits into
 * the two real registration/login paths without cluttering the first screen every user sees.
 * "Professional Counsellor" reuses the existing, working Login(role=COUNSELLOR) -> CounsellorSignup
 * path unchanged. "Peer Mentor" goes to PeerMentorSignupScreen, which is an honest "not open yet"
 * screen, not a real registration form (Peer Mentor accounts don't exist yet - see Phase 1C).
 */
import React, { useEffect, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, Animated, Easing, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { DarkGlassView } from '@/components/GlassView';
import { fonts, fontSizes, spacing, radii, shadow } from '@/theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'CounsellorOrMentor'>;

const OPTIONS = [
  {
    key: 'counsellor' as const,
    icon: 'medkit-outline' as const,
    title: 'Professional Counsellor',
    badge: 'Verification required',
    subtitle: 'Licensed or credentialed mental-health professionals supporting students directly.',
    accent: '#5C8AE6',
  },
  {
    key: 'mentor' as const,
    icon: 'people-circle-outline' as const,
    title: 'Peer Mentor',
    badge: 'Verification required',
    subtitle: 'Trained students supporting fellow students, certified through the MoodMate Peer Mentor Academy.',
    accent: '#8E7BC0',
  },
];

export function CounsellorOrMentorScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fade, { toValue: 1, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [fade]);

  const handleSelect = (key: 'counsellor' | 'mentor') => {
    if (key === 'counsellor') navigation.navigate('Login', { role: 'COUNSELLOR' });
    else navigation.navigate('PeerMentorSignup');
  };

  return (
    <View style={s.root}>
      <LinearGradient colors={['#0D0D1A', '#0F1F2E', '#130A2E']} style={StyleSheet.absoluteFill} />

      <View style={[s.content, { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing.lg }]}>
        <Pressable
          style={s.backBtn}
          onPress={() => navigation.goBack()}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <Ionicons name="chevron-back" size={22} color="rgba(255,255,255,0.75)" importantForAccessibility="no-hide-descendants" accessibilityElementsHidden />
          <Text style={s.backTxt}>Back</Text>
        </Pressable>

        <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false} bounces={false}>
          <Animated.View style={{ opacity: fade }}>
            <Text style={s.heading}>How will you support students?</Text>
            <Text style={s.sub}>Choose the path that matches your role.</Text>
          </Animated.View>

          <View style={s.optionsWrap}>
            {OPTIONS.map((opt, i) => (
              <OptionCard key={opt.key} opt={opt} delay={150 + i * 100} onPress={() => handleSelect(opt.key)} />
            ))}
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

function OptionCard({ opt, delay, onPress }: { opt: typeof OPTIONS[number]; delay: number; onPress: () => void }) {
  const entered = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(entered, { toValue: 1, friction: 7, tension: 45, delay, useNativeDriver: true }).start();
  }, [entered, delay]);

  const pressIn = () => Animated.spring(scale, { toValue: 0.97, speed: 60, bounciness: 0, useNativeDriver: true }).start();
  const pressOut = () => Animated.spring(scale, { toValue: 1, speed: 30, bounciness: 6, useNativeDriver: true }).start();

  return (
    <Animated.View style={{
      opacity: entered,
      transform: [
        { scale: Animated.multiply(scale, entered) },
        { translateY: entered.interpolate({ inputRange: [0, 1], outputRange: [28, 0] }) },
      ],
    }}>
      <Pressable
        onPressIn={pressIn}
        onPressOut={pressOut}
        onPress={onPress}
        accessible
        accessibilityRole="button"
        accessibilityLabel={`${opt.title}, ${opt.badge}`}
        accessibilityHint={opt.subtitle}
      >
        <DarkGlassView intensity={45} borderColor={opt.accent + '55'} borderRadius={20} style={s.cardWrap}>
          <View style={[s.card, shadow.md]}>
            <View style={[s.iconCircle, { backgroundColor: opt.accent + '26' }]} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
              <Ionicons name={opt.icon} size={26} color={opt.accent} />
            </View>
            <View style={s.cardText}>
              <View style={s.titleRow}>
                <Text style={s.cardTitle}>{opt.title}</Text>
                <View style={[s.badge, { backgroundColor: opt.accent + '26' }]}>
                  <Text style={[s.badgeTxt, { color: opt.accent }]}>{opt.badge}</Text>
                </View>
              </View>
              <Text style={s.cardSub}>{opt.subtitle}</Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color="rgba(255,255,255,0.4)" importantForAccessibility="no-hide-descendants" accessibilityElementsHidden />
          </View>
        </DarkGlassView>
      </Pressable>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  content: { flex: 1, paddingHorizontal: spacing.lg },
  scroll: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 2, marginBottom: spacing.xl, alignSelf: 'flex-start' },
  backTxt: { fontFamily: fonts.bodyMedium, fontSize: fontSizes.sm, color: 'rgba(255,255,255,0.75)' },
  heading: { fontFamily: fonts.display, fontSize: fontSizes.display, color: '#FFFFFF', marginBottom: spacing.xs },
  sub: { fontFamily: fonts.bodyMedium, fontSize: fontSizes.sm, color: 'rgba(255,255,255,0.5)', marginBottom: spacing.xxl },
  optionsWrap: { gap: spacing.md },
  cardWrap: { width: '100%' },
  card: {
    borderRadius: 20, padding: spacing.lg,
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
  },
  iconCircle: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  cardText: { flex: 1, gap: 4 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' },
  cardTitle: { fontFamily: fonts.bodyBold, fontSize: fontSizes.base, color: '#FFFFFF' },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radii.pill },
  badgeTxt: { fontFamily: fonts.bodyBold, fontSize: 9, textTransform: 'uppercase', letterSpacing: 0.5 },
  cardSub: { fontFamily: fonts.bodyMedium, fontSize: fontSizes.xs, color: 'rgba(255,255,255,0.6)', lineHeight: 17 },
});
