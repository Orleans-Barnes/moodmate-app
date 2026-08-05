/**
 * DailyMissionCard — today's mission with icon hero, XP reward, completion state.
 *
 * THESIS: A calm morning path you can step onto — not a neon quest banner.
 * OWN-WORLD: Calm Forest green + amber reward chip; Expo icon illustration strip.
 * STORY: See the mission, know the XP, tap to begin (or see Done).
 * FIRST VIEWPORT: Hero strip → title row → XP / Done chip.
 * FORM: Operate refinement of Calm Forest home.
 */
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { getTodayMission, XP_VALUES } from '@/state/useGamificationStore';
import { fonts, fontSizes, radii, spacing, calm, colors, darkPalette, shadow } from '@/theme/tokens';
import { useResolvedAppearance } from '@/hooks/useResolvedAppearance';

interface Props {
  completed: boolean;
  onPress: () => void;
}

export function DailyMissionCard({ completed, onPress }: Props) {
  const mission = getTodayMission();
  const { isDark } = useResolvedAppearance();

  return (
    <Pressable
      style={({ pressed }) => [s.outer, pressed && !completed && s.pressed]}
      onPress={onPress}
      disabled={completed}
      accessibilityRole="button"
      accessibilityLabel={completed ? `Mission complete: ${mission.title}` : `Daily mission: ${mission.title}`}
    >
      <View style={[s.card, isDark && s.cardDark]}>
        <LinearGradient
          colors={[calm.forest, calm.forestPanel]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={s.heroWrap}
        >
          <View style={[s.orb, s.orbA]} />
          <View style={[s.orb, s.orbB]} />
          <View style={s.heroIconRing}>
            <Ionicons name={mission.ionIcon} size={36} color="#FFFFFF" />
          </View>
          <View style={s.heroBadge}>
            <Ionicons name={mission.ionIcon} size={16} color="#FFFFFF" />
            <Text style={s.heroBadgeText}>{completed ? 'Complete' : 'Today'}</Text>
          </View>
          <View style={s.floatIcons} pointerEvents="none">
            <Ionicons name="leaf-outline" size={18} color="rgba(255,255,255,0.35)" style={s.floatA} />
            <Ionicons name="sparkles-outline" size={16} color="rgba(255,255,255,0.28)" style={s.floatB} />
            <Ionicons name="sunny-outline" size={15} color="rgba(255,200,87,0.45)" style={s.floatC} />
          </View>
        </LinearGradient>

        <View style={s.body}>
          <View style={s.left}>
            <Text style={[s.tag, isDark && s.tagDark]}>Daily mission</Text>
            <Text style={[s.label, isDark && s.labelDark]}>{mission.title}</Text>
            <Text style={[s.sub, isDark && s.subDark]}>
              {completed ? 'Nice work — come back tomorrow.' : 'Complete to earn mission XP'}
            </Text>
          </View>

          {completed ? (
            <View style={s.doneChip}>
              <Ionicons name="checkmark" size={18} color="#FFFFFF" />
            </View>
          ) : (
            <View style={s.xpChip}>
              <Text style={s.xpNum}>+{XP_VALUES.missionBonus}</Text>
              <Text style={s.xpLbl}>XP</Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  outer: {
    borderRadius: radii.card,
    ...shadow.md,
  },
  pressed: { opacity: 0.92, transform: [{ scale: 0.985 }] },
  card: {
    borderRadius: radii.card,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: calm.border,
  },
  cardDark: {
    backgroundColor: darkPalette.surface,
    borderColor: darkPalette.border,
  },
  heroWrap: {
    height: 118,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  orb: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(134,198,160,0.22)',
  },
  orbA: { width: 140, height: 140, top: -48, right: -36 },
  orbB: { width: 90, height: 90, bottom: -30, left: -20, backgroundColor: 'rgba(240,180,41,0.16)' },
  heroIconRing: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.28)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroBadge: {
    position: 'absolute',
    left: spacing.md,
    bottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(36,65,42,0.82)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radii.pill,
  },
  heroBadgeText: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.xs,
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  floatIcons: {
    ...StyleSheet.absoluteFillObject,
  },
  floatA: { position: 'absolute', top: 16, right: 28 },
  floatB: { position: 'absolute', top: 28, left: 36 },
  floatC: { position: 'absolute', bottom: 22, right: 42 },
  body: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    gap: spacing.md,
  },
  left: { flex: 1, gap: 3 },
  tag: {
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    color: calm.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  label: {
    fontFamily: fonts.display,
    fontSize: fontSizes.md,
    color: calm.forest,
    lineHeight: 22,
  },
  sub: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.xs,
    color: calm.muted,
    marginTop: 2,
  },
  tagDark: { color: darkPalette.primary },
  labelDark: { color: darkPalette.text },
  subDark: { color: darkPalette.textMuted },
  xpChip: {
    backgroundColor: calm.amber,
    borderRadius: radii.lg,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
    minWidth: 56,
  },
  xpNum: { fontFamily: fonts.display, fontSize: 18, color: colors.sunText },
  xpLbl: { fontFamily: fonts.bodyBold, fontSize: 9, color: colors.sunText, opacity: 0.8 },
  doneChip: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: calm.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
