/**
 * CounsellorOrMentorScreen — Phase 1B intermediate screen (Calm Forest).
 *
 * Reached only from RoleSelectScreen's "Counsellor or Peer Mentor?" link. Splits into the two
 * real registration/login paths without cluttering the student-facing Welcome screen. Both
 * options go to Login pre-set for that role (for an existing/approved account), with an
 * "Apply to join" link in that Login screen's footer for anyone who doesn't have an account yet.
 */
import React, { useEffect, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, Animated, Easing, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { BackButton } from '@/components/BackButton';
import { fonts, fontSizes, spacing, radii, calm } from '@/theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'CounsellorOrMentor'>;

const OPTIONS = [
  {
    key: 'counsellor' as const,
    icon: 'medkit-outline' as const,
    title: 'Professional Counsellor',
    badge: 'Admin verified',
    subtitle: 'Licensed or credentialed mental-health professionals. Applications are reviewed and approved by our admin team.',
    accent: calm.dustyBlue,
  },
  {
    key: 'mentor' as const,
    icon: 'people-circle-outline' as const,
    title: 'Peer Mentor',
    badge: 'Academy certified',
    subtitle: 'Complete the MoodMate Peer Mentor Academy training to get certified and activate your account instantly.',
    accent: calm.primary,
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
    else navigation.navigate('Login', { role: 'MENTOR' });
  };

  return (
    <View style={[s.root, { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + spacing.lg }]}>
      <BackButton onPress={() => navigation.goBack()} style={s.back} />

      <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
        <Animated.View style={{ opacity: fade }}>
          <Text style={s.heading}>How will you support{'\n'}students?</Text>
          <Text style={s.sub}>Choose the path that matches your role.</Text>
        </Animated.View>

        <View style={s.optionsWrap}>
          {OPTIONS.map((opt, i) => (
            <OptionCard key={opt.key} opt={opt} delay={150 + i * 100} onPress={() => handleSelect(opt.key)} />
          ))}
        </View>
      </ScrollView>
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
        <View style={s.card}>
          <View style={[s.iconCircle, { backgroundColor: opt.accent + '1F' }]}>
            <Ionicons name={opt.icon} size={26} color={opt.accent} />
          </View>
          <View style={s.cardText}>
            <View style={s.titleRow}>
              <Text style={s.cardTitle}>{opt.title}</Text>
              <View style={[s.badge, { backgroundColor: opt.accent + '1F' }]}>
                <Text style={[s.badgeTxt, { color: opt.accent }]}>{opt.badge}</Text>
              </View>
            </View>
            <Text style={s.cardSub}>{opt.subtitle}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={calm.faint} />
        </View>
      </Pressable>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: calm.bg, paddingHorizontal: spacing.xl },
  back: { marginBottom: spacing.xl },
  heading: { fontFamily: fonts.displayExtraBold, fontSize: fontSizes.xxl + 6, lineHeight: 38, color: calm.forest, letterSpacing: -0.45, marginBottom: spacing.xs },
  sub: { fontFamily: fonts.body, fontSize: fontSizes.md - 1, color: calm.muted, marginBottom: spacing.xxl },
  optionsWrap: { gap: spacing.md, paddingBottom: spacing.xl },
  card: {
    borderRadius: radii.card - 2, padding: spacing.lg,
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    borderWidth: 1, borderColor: calm.border,
    backgroundColor: '#FFFFFF',
  },
  iconCircle: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  cardText: { flex: 1, gap: 4 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' },
  cardTitle: { fontFamily: fonts.bodyBold, fontSize: fontSizes.base, color: calm.forest },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radii.pill },
  badgeTxt: { fontFamily: fonts.bodyBold, fontSize: 9, textTransform: 'uppercase', letterSpacing: 0.5 },
  cardSub: { fontFamily: fonts.body, fontSize: fontSizes.xs + 1, color: calm.muted, lineHeight: 17 },
});
