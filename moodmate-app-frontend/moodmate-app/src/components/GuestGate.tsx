/**
 * GuestGate — full-section "sign up to unlock" prompt for screens that guests genuinely
 * cannot use in any local-only form (Community's shared feed, Support's counsellor/mentor
 * booking + messaging). Unlike GratitudeJar/JournalEntry/BreathingSession/etc., which give a
 * guest a real local-only version of the activity, there's no honest local stand-in for a
 * shared anonymous feed or a real conversation with a real counsellor — so those screens show
 * this instead of attempting a backend call that would just 401 silently.
 *
 * Visually a companion to GuestProgressBanner (same dark-card-with-CTA language) but meant to
 * fill the body of a screen rather than sit inline in a list.
 */
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, darkPalette, fonts, fontSizes, radii, spacing, calm } from '@/theme/tokens';
import { useResolvedAppearance } from '@/hooks/useResolvedAppearance';

interface Props {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  message: string;
  onCreateAccount: () => void;
}

export function GuestGate({ icon, title, message, onCreateAccount }: Props) {
  const { isDark } = useResolvedAppearance();
  return (
    <View style={s.wrap}>
      <View style={[s.iconCircle, isDark && s.iconCircleDark]}>
        <Ionicons name={icon} size={28} color={isDark ? darkPalette.primary : calm.primary} />
      </View>
      <Text style={[s.title, isDark && s.titleDark]}>{title}</Text>
      <Text style={[s.message, isDark && s.messageDark]}>{message}</Text>
      <Pressable style={s.cta} onPress={onCreateAccount}>
        <Text style={s.ctaTxt}>Create free account  →</Text>
      </Pressable>
      <Text style={[s.fine, isDark && s.fineDark]}>Free forever · No credit card needed</Text>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
    gap: spacing.sm,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: calm.mintBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  iconCircleDark: {
    backgroundColor: darkPalette.primarySoft,
  },
  title: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.md,
    color: colors.ink,
    textAlign: 'center',
  },
  titleDark: {
    color: darkPalette.text,
  },
  message: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.sm,
    color: colors.inkSoft,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  messageDark: {
    color: darkPalette.textMuted,
  },
  cta: {
    backgroundColor: colors.coral,
    borderRadius: radii.pill,
    paddingVertical: 13,
    paddingHorizontal: spacing.xl,
    alignSelf: 'stretch',
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
    color: colors.inkFaint,
    marginTop: 2,
  },
  fineDark: {
    color: darkPalette.textFaint,
  },
});
