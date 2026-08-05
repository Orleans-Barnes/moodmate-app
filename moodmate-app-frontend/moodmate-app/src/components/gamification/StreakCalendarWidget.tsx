/**
 * StreakCalendarWidget
 *
 * A Duolingo-inspired 7-day streak row that shows:
 *   • Past days: flame (done) or empty ring (missed)
 *   • Today: highlighted with glow + "Today" label
 *   • Shield badge on the streak count if a shield is active
 *   • "Get Shield" button (10 leaves) when no shield is active
 *   • Milestone leaf-reward badge at days 3, 7, 14, 30
 *
 * Computed purely from `streakCount` + `lastAllGoalsCompletedDate` — no
 * extra API call needed.
 */
import React, { useCallback } from 'react';
import {
  View, Text, Pressable, StyleSheet, Alert, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useWellnessStore } from '@/state/useWellnessStore';
import { useAuthStore } from '@/state/useAuthStore';
import { colors, darkPalette, fonts, fontSizes, radii, spacing } from '@/theme/tokens';
import { useResolvedAppearance } from '@/hooks/useResolvedAppearance';
import * as Haptics from 'expo-haptics';

// days that award bonus leaves on top of the regular streak celebrate
const LEAF_MILESTONES: Record<number, number> = { 3: 5, 7: 10, 14: 20, 30: 50 };
const SHIELD_COST = 10;

interface DayCell {
  label: string;   // Mon, Tue … or 'Today'
  done: boolean;
  isToday: boolean;
}

function buildWeek(streakCount: number, lastCompletedStr: string | null): DayCell[] {
  const today      = new Date();
  today.setHours(0, 0, 0, 0);
  const lastDone   = lastCompletedStr ? new Date(lastCompletedStr + 'T00:00:00') : null;
  const todayDone  = lastDone ? lastDone.getTime() === today.getTime() : false;
  const streakAlive = lastDone
    ? (today.getTime() - lastDone.getTime()) / 86400000 <= 1
    : false;

  const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(today.getTime() - (6 - i) * 86400000);
    const daysAgo = 6 - i;
    const isToday = daysAgo === 0;

    // A past day is "done" if the streak covers it from the last completed date
    let done = false;
    if (isToday) {
      done = todayDone;
    } else if (streakAlive && lastDone) {
      const diffFromLastDone = Math.round(
        (lastDone.getTime() - date.getTime()) / 86400000,
      );
      done = diffFromLastDone >= 0 && diffFromLastDone < streakCount;
    }

    return {
      label: isToday ? 'Today' : DAY_LABELS[date.getDay()],
      done,
      isToday,
    };
  });
}

interface Props {
  onShieldBought?: () => void;
}

export function StreakCalendarWidget({ onShieldBought }: Props) {
  const { isDark } = useResolvedAppearance();
  const token          = useAuthStore((s) => s.token) ?? '';
  const streakCount    = useWellnessStore((s) => s.streakCount);
  const hasShield      = useWellnessStore((s) => s.hasStreakShield);
  const leafBalance    = useWellnessStore((s) => s.leafBalance);
  const lastCompleted  = useWellnessStore((s) => s.lastCompletedDate);
  const buyShield      = useWellnessStore((s) => s.buyStreakShield);
  const [buying, setBuying] = React.useState(false);

  const week = buildWeek(streakCount, lastCompleted ?? null);
  const milestoneLeaves = LEAF_MILESTONES[streakCount];

  const handleBuyShield = useCallback(() => {
    if (leafBalance < SHIELD_COST) {
      Alert.alert('Not enough leaves', `You need ${SHIELD_COST} leaves to buy a shield. You have ${leafBalance}.`);
      return;
    }
    Alert.alert(
      'Buy Streak Shield?',
      `Spend ${SHIELD_COST} leaves to protect your streak from one missed day?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: `Buy (${SHIELD_COST} leaves)`,
          onPress: async () => {
            setBuying(true);
            try {
              await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              await buyShield(token);
              onShieldBought?.();
            } catch (err: unknown) {
              Alert.alert('Error', String(err));
            } finally {
              setBuying(false);
            }
          },
        },
      ],
    );
  }, [leafBalance, token, buyShield, onShieldBought]);

  return (
    <View style={[s.root, isDark && s.rootDark]}>
      {/* Header row */}
      <View style={s.headerRow}>
        <View style={s.streakBadge}>
          <Ionicons name="flame" size={16} color="#F97316" />
          <Text style={s.streakNum}>{streakCount}</Text>
          {hasShield && (
            <View style={s.shieldPip}>
              <Ionicons name="shield-checkmark" size={11} color="#7C3AED" />
            </View>
          )}
        </View>

        <Text style={[s.headerLabel, isDark && s.mutedTextDark]}>
          {streakCount === 0
            ? 'Start your streak today!'
            : `${streakCount}-day streak${hasShield ? ' · Shield active' : ''}`}
        </Text>

        {/* Shield / leaves indicator */}
        {hasShield ? (
          <View style={s.shieldActiveChip}>
            <Ionicons name="shield-checkmark" size={13} color="#7C3AED" />
            <Text style={s.shieldActiveText}>Protected</Text>
          </View>
        ) : (
          <Pressable style={s.buyShieldBtn} onPress={handleBuyShield} disabled={buying}>
            {buying
              ? <ActivityIndicator size="small" color="#7C3AED" />
              : (
                <>
                  <Ionicons name="shield-outline" size={13} color="#7C3AED" />
                  <Text style={s.buyShieldText}>{SHIELD_COST}</Text>
                  <Ionicons name="leaf" size={10} color="#22C55E" />
                </>
              )}
          </Pressable>
        )}
      </View>

      {/* 7-day calendar row */}
      <View style={s.daysRow}>
        {week.map((day, idx) => (
          <View key={idx} style={s.dayCol}>
            <Text style={[s.dayLabel, isDark && s.mutedTextDark, day.isToday && s.dayLabelToday]}>
              {day.label}
            </Text>
            {day.isToday ? (
              <LinearGradient
                colors={day.done ? ['#F97316', '#EF4444'] : ['rgba(249,115,22,0.18)', 'rgba(239,68,68,0.12)']}
                style={[s.dayCircle, s.dayCircleToday]}
              >
                <Ionicons
                  name={day.done ? 'flame' : 'flame-outline'}
                  size={20}
                  color={day.done ? '#fff' : '#F97316'}
                />
              </LinearGradient>
            ) : (
              <View style={[s.dayCircle, day.done ? s.dayCircleDone : s.dayCircleEmpty, !day.done && isDark && s.dayCircleEmptyDark]}>
                <Ionicons
                  name={day.done ? 'flame' : 'ellipse-outline'}
                  size={day.done ? 18 : 14}
                  color={day.done ? '#F97316' : isDark ? darkPalette.textFaint : 'rgba(0,0,0,0.18)'}
                />
              </View>
            )}
          </View>
        ))}
      </View>

      {/* Milestone leaf reward banner */}
      {milestoneLeaves && (
        <View style={s.milestoneBanner}>
          <Ionicons name="leaf" size={14} color="#22C55E" />
          <Text style={s.milestoneText}>
            Milestone bonus: +{milestoneLeaves} leaves earned today!
          </Text>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    backgroundColor: '#FFF9F5',
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginHorizontal: spacing.xl,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(249,115,22,0.12)',
  },
  rootDark: {
    backgroundColor: darkPalette.surface,
    borderColor: darkPalette.border,
  },

  // Header
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(249,115,22,0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radii.pill,
  },
  streakNum: {
    fontFamily: fonts.display,
    fontSize: fontSizes.md,
    color: '#EA580C',
  },
  shieldPip: {
    marginLeft: 2,
  },
  headerLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.sm,
    color: colors.inkSoft,
    flex: 1,
  },

  // Shield buy button
  buyShieldBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    borderWidth: 1,
    borderColor: 'rgba(124,58,237,0.3)',
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    backgroundColor: 'rgba(124,58,237,0.07)',
  },
  buyShieldText: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.xs,
    color: '#7C3AED',
  },
  shieldActiveChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(124,58,237,0.1)',
    borderRadius: radii.pill,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  shieldActiveText: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.xs,
    color: '#7C3AED',
  },

  // Day cells
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayCol: {
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  dayLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 10,
    color: colors.inkFaint,
  },
  dayLabelToday: {
    color: '#F97316',
    fontFamily: fonts.bodyBold,
  },
  dayCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircleToday: {
    shadowColor: '#F97316',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },
  dayCircleDone: {
    backgroundColor: 'rgba(249,115,22,0.1)',
  },
  dayCircleEmpty: {
    backgroundColor: 'rgba(0,0,0,0.04)',
  },
  dayCircleEmptyDark: {
    backgroundColor: darkPalette.surfaceSunken,
  },

  // Milestone banner
  milestoneBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.sm,
    backgroundColor: 'rgba(34,197,94,0.08)',
    borderRadius: radii.md,
    padding: spacing.sm,
    borderLeftWidth: 2,
    borderLeftColor: '#22C55E',
  },
  milestoneText: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.xs,
    color: '#166534',
  },
  mutedTextDark: { color: darkPalette.textMuted },
});
