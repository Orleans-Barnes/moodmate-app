/**
 * GuestProgressBanner — replaces the XP bar, badge shelf, routine counter, and
 * daily mission card on HomeScreen when the user is exploring as a guest.
 *
 * Design: dark card with a subtle animated glow, "progress isn't being saved"
 * message, feature lock list, and a coral CTA to create a free account.
 */
import React, { useEffect, useRef } from 'react';
import {
  View, Text, Pressable, StyleSheet, Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, fonts, fontSizes, spacing } from '@/theme/tokens';

interface Props {
  onCreateAccount: () => void;
}

const LOCKED_FEATURES = [
  { emoji: '🔥', label: 'Daily streaks' },
  { emoji: '⭐', label: 'XP & levels' },
  { emoji: '🏅', label: 'Badges' },
  { emoji: '📈', label: 'Mood history' },
];

export function GuestProgressBanner({ onCreateAccount }: Props) {
  const pulse = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1800, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.6, duration: 1800, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, []);

  return (
    <View style={s.wrapper}>
      <LinearGradient
        colors={['#1C1C2E', '#252540']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={s.card}
      >
        {/* Animated glow orb */}
        <Animated.View style={[s.glowOrb, { opacity: pulse }]} />

        {/* Header */}
        <View style={s.headerRow}>
          <View style={s.lockCircle}>
            <Text style={s.lockEmoji}>🔒</Text>
          </View>
          <View style={s.headerText}>
            <Text style={s.title}>Exploring as guest</Text>
            <Text style={s.sub}>Progress isn't being saved</Text>
          </View>
        </View>

        {/* Locked feature chips */}
        <View style={s.chips}>
          {LOCKED_FEATURES.map((f) => (
            <View key={f.label} style={s.chip}>
              <Text style={s.chipEmoji}>{f.emoji}</Text>
              <Text style={s.chipLabel}>{f.label}</Text>
            </View>
          ))}
        </View>

        {/* CTA */}
        <Pressable style={s.cta} onPress={onCreateAccount}>
          <Text style={s.ctaTxt}>Create free account  →</Text>
        </Pressable>

        <Text style={s.fine}>Free forever · No credit card needed</Text>
      </LinearGradient>
    </View>
  );
}

const s = StyleSheet.create({
  wrapper: { marginBottom: 4 },
  card: {
    borderRadius: 20,
    padding: spacing.lg,
    gap: spacing.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    elevation: 6,
  },
  glowOrb: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: colors.coral,
    top: -60,
    right: -40,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  lockCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockEmoji: { fontSize: 20 },
  headerText: { flex: 1, gap: 2 },
  title: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.base,
    color: '#FFFFFF',
  },
  sub: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.xs,
    color: 'rgba(255,255,255,0.5)',
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  chipEmoji: { fontSize: 12 },
  chipLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
    color: 'rgba(255,255,255,0.65)',
  },
  cta: {
    backgroundColor: colors.coral,
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
  },
  ctaTxt: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.base,
    color: '#FFFFFF',
  },
  fine: {
    fontFamily: fonts.bodyMedium,
    fontSize: 10,
    color: 'rgba(255,255,255,0.3)',
    textAlign: 'center',
    marginTop: -4,
  },
});
