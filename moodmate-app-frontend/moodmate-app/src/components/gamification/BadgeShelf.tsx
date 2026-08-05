/**
 * BadgeShelf — horizontal row of badge medallions (Expo Ionicons).
 * Locked badges appear muted with a lock overlay.
 */
import React from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BADGE_DEFS, type BadgeId } from '@/state/useGamificationStore';
import { fonts, fontSizes, calm, colors, darkPalette, radii, spacing, shadow } from '@/theme/tokens';
import { useResolvedAppearance } from '@/hooks/useResolvedAppearance';

interface Props {
  unlockedBadges: BadgeId[];
}

const BADGE_TINT: Record<BadgeId, string> = {
  first_checkin:   calm.mintBg,
  streak_3:        colors.sunSoft,
  streak_7:        colors.warningSoft,
  streak_30:       colors.premiumGoldSoft,
  journaller:      colors.journalAccentSoft,
  deep_breather:   colors.blueSoft,
  community_voice: colors.sageSoft,
  grateful_heart:  colors.errorSoft,
  xp_100:          colors.lavenderSoft,
  xp_500:          colors.aiAccentSoft,
};

const BADGE_ICON_COLOR: Record<BadgeId, string> = {
  first_checkin:   calm.primary,
  streak_3:        calm.amber,
  streak_7:        colors.sunText,
  streak_30:       colors.sunText,
  journaller:      colors.journalAccent,
  deep_breather:   colors.blue,
  community_voice: colors.sageDeep,
  grateful_heart:  calm.terracotta,
  xp_100:          colors.lavender,
  xp_500:          colors.aiAccent,
};

export function BadgeShelf({ unlockedBadges }: Props) {
  const unlockedSet = new Set(unlockedBadges);
  const { isDark } = useResolvedAppearance();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={s.row}
    >
      {BADGE_DEFS.map((def) => {
        const unlocked = unlockedSet.has(def.id);
        return (
          <View key={def.id} style={[s.badge, isDark && s.badgeDark, !unlocked && s.locked, !unlocked && isDark && s.lockedDark]}>
            <View style={[
              s.artWrap,
              { backgroundColor: unlocked ? BADGE_TINT[def.id] : isDark ? darkPalette.surfaceSunken : calm.trackAlt },
            ]}>
              <Ionicons
                name={def.ionIcon}
                size={26}
                color={unlocked ? BADGE_ICON_COLOR[def.id] : isDark ? darkPalette.textFaint : calm.faint}
              />
              {!unlocked && (
                <View style={s.lockOverlay}>
                  <Ionicons name="lock-closed" size={14} color={isDark ? darkPalette.textMuted : calm.muted} />
                </View>
              )}
            </View>
            <Text style={[s.name, isDark && s.nameDark, !unlocked && s.lockedName]} numberOfLines={2}>
              {def.name}
            </Text>
          </View>
        );
      })}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
  },
  badge: {
    width: 84,
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    paddingHorizontal: 6,
    borderWidth: 1,
    borderColor: calm.border,
    ...shadow.sm,
  },
  badgeDark: {
    backgroundColor: darkPalette.surface,
    borderColor: darkPalette.border,
  },
  locked: {
    backgroundColor: calm.trackAlt,
    borderColor: 'transparent',
    shadowOpacity: 0,
    elevation: 0,
  },
  lockedDark: {
    backgroundColor: darkPalette.surfaceSunken,
    borderColor: 'transparent',
  },
  artWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(248,248,248,0.45)',
    borderRadius: 28,
  },
  name: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.xs,
    color: calm.forest,
    textAlign: 'center',
    lineHeight: 13,
  },
  nameDark: { color: darkPalette.text },
  lockedName: { color: calm.faint },
});
