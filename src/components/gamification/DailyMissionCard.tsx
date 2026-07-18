/**
 * DailyMissionCard — shows today's mission with XP reward and completion state.
 */
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { getTodayMission, XP_VALUES, type DailyMission } from '@/state/useGamificationStore';
import { fonts, fontSizes, radii } from '@/theme/tokens';

interface Props {
  completed: boolean;
  onPress: () => void;
}

export function DailyMissionCard({ completed, onPress }: Props) {
  const mission = getTodayMission();

  return (
    <View style={s.wrapOuter}>
    <Pressable
      style={({ pressed }) => [s.wrapInner, { opacity: pressed ? 0.88 : 1 }]}
      onPress={onPress}
      disabled={completed}
    >
      <LinearGradient
        colors={completed ? ['#D1D5DB', '#9CA3AF'] : ['#F59E0B', '#FBBF24']}
        style={s.grad}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
      >
        <View style={s.left}>
          <Text style={s.tag}>Daily Mission</Text>
          <Text style={s.label}>{mission.title}</Text>
          <Text style={s.sub}>Complete to earn mission XP ✨</Text>
        </View>

        <View style={s.right}>
          {completed ? (
            <View style={s.doneBadge}>
              <Text style={s.doneEmoji}>✅</Text>
              <Text style={s.doneTxt}>Done!</Text>
            </View>
          ) : (
            <View style={s.xpBadge}>
              <Text style={s.xpNum}>+{XP_VALUES.missionBonus}</Text>
              <Text style={s.xpLbl}>XP</Text>
            </View>
          )}
        </View>
      </LinearGradient>
    </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  // Android: outer has shadow, inner has overflow:hidden (they can't coexist)
  wrapOuter: {
    borderRadius: radii.md,
    shadowColor: 'rgba(0,0,0,0.18)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 4,
  },
  wrapInner: { borderRadius: radii.md, overflow: 'hidden' },
  grad: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  left: { flex: 1, gap: 2 },
  tag:  { fontFamily: fonts.bodyBold, fontSize: 10, color: 'rgba(0,0,0,0.55)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 2 },
  label:{ fontFamily: fonts.display, fontSize: fontSizes.md, color: '#1A0A00' },
  sub:  { fontFamily: fonts.bodyMedium, fontSize: fontSizes.xs, color: 'rgba(0,0,0,0.55)' },
  right:{ alignItems: 'center' },
  xpBadge: { backgroundColor: 'rgba(0,0,0,0.15)', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6, alignItems: 'center' },
  xpNum:   { fontFamily: fonts.display, fontSize: 20, color: '#FFFFFF' },
  xpLbl:   { fontFamily: fonts.bodyBold, fontSize: 10, color: 'rgba(255,255,255,0.8)' },
  doneBadge:{ alignItems: 'center', gap: 2 },
  doneEmoji:{ fontSize: 28 },
  doneTxt:  { fontFamily: fonts.bodyBold, fontSize: fontSizes.xs, color: '#FFFFFF' },
});
