import React, { useCallback, useEffect, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, Animated, Easing } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Screen } from '@/components/Screen';
import { ProgressBar } from '@/components/ProgressBar';
import { ConfettiBurst, ConfettiHandle } from '@/components/Confetti';
import { useWellnessStore } from '@/state/useWellnessStore';
import { useAuthStore } from '@/state/useAuthStore';
import { useToast } from '@/state/useToast';
import { ApiRequestError } from '@/api/client';
import { hapticLight } from '@/utils/haptics';
import { colors, fonts, fontSizes, spacing, radii } from '@/theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'WellnessTree'>;

const JOURNEY_STAGES = ['Roots', 'Sprout', 'Bloom', 'Canopy'] as const;

export function WellnessTreeScreen({ navigation }: Props) {
  const treeXp = useWellnessStore((s) => s.treeXp);
  const treeXpMax = useWellnessStore((s) => s.treeXpMax);
  const treeStage = useWellnessStore((s) => s.treeStage);
  const treeSkinEmoji = useWellnessStore((s) => s.treeSkinEmoji);
  const streakCount = useWellnessStore((s) => s.streakCount);
  const goals = useWellnessStore((s) => s.goals);
  const load = useWellnessStore((s) => s.load);
  const toggleGoal = useWellnessStore((s) => s.toggleGoal);
  const token = useAuthStore((s) => s.token);
  const toast = useToast();
  const confettiRef = useRef<ConfettiHandle>(null);
  const swayAnim = useRef(new Animated.Value(0)).current;
  const growScale = useRef(new Animated.Value(1)).current;

  const treePct = treeXpMax > 0 ? Math.max(0, Math.min(100, Math.round((treeXp / treeXpMax) * 100))) : 0;
  const stageIndex = JOURNEY_STAGES.indexOf(treeStage);
  const nextStage = JOURNEY_STAGES[stageIndex + 1];

  const refresh = useCallback(() => {
    if (!token) return;
    load(token).catch((err) => {
      toast(err instanceof ApiRequestError ? err.message : 'Could not load your wellness tree.');
    });
  }, [token, load, toast]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(swayAnim, {
          toValue: 1,
          duration: 2250,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(swayAnim, {
          toValue: -1,
          duration: 2250,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [swayAnim]);

  const handleToggleGoal = async (id: string) => {
    if (!token) return;
    hapticLight();
    Animated.sequence([
      Animated.timing(growScale, { toValue: 1.28, duration: 150, useNativeDriver: true }),
      Animated.spring(growScale, { toValue: 1, useNativeDriver: true, friction: 4 }),
    ]).start();
    try {
      const streakIncremented = await toggleGoal(token, id);
      if (streakIncremented) {
        confettiRef.current?.fire();
        toast(`Streak +1 — ${streakCount + 1} days now 🔥`);
      }
    } catch (err) {
      toast(err instanceof ApiRequestError ? err.message : 'Could not update that goal.');
    }
  };

  const quoteText = streakCount > 0
    ? `You've kept your streak for ${streakCount} day${streakCount === 1 ? '' : 's'} 🌱`
    : 'Complete a habit below to start your streak 🌱';

  return (
    <View style={styles.flex}>
      <Screen backgroundColor={colors.bg} contentContainerStyle={styles.content}>
        <ScreenHeader title={`Lv ${stageIndex + 1} · ${treeStage}`} onClose={() => navigation.goBack()} />

        <View style={styles.treeWrap}>
          <Animated.Text
            style={[
              styles.treeEmoji,
              {
                transform: [
                  {
                    rotate: swayAnim.interpolate({
                      inputRange: [-1, 1],
                      outputRange: ['-3deg', '3deg'],
                    }),
                  },
                  { scale: growScale },
                ],
              },
            ]}
          >
            {treeSkinEmoji}
          </Animated.Text>
          <View style={styles.quoteBubble}>
            <Text style={styles.quoteText}>&quot;{quoteText}&quot;</Text>
          </View>
        </View>

        <ProgressBar progress={treePct} fillColor={colors.sage} height={5} />
        <Text style={styles.xpLabel}>
          {treeXp} / {treeXpMax} XP{nextStage ? ` to "${nextStage}"` : ' — fully grown 🌳'}
        </Text>

        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>Healing journey</Text>
        </View>
        <View style={styles.journeyRow}>
          {JOURNEY_STAGES.map((stage, i) => (
            <View key={stage} style={styles.journeyStep}>
              <View style={[styles.journeyDot, i <= stageIndex && styles.journeyDotDone]}>
                <Text style={[styles.journeyDotText, i <= stageIndex && styles.journeyDotTextDone]}>
                  {i <= stageIndex ? '✓' : i + 1}
                </Text>
              </View>
              <Text style={styles.journeyLabel}>{stage}</Text>
            </View>
          ))}
        </View>

        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>Today&apos;s habits</Text>
        </View>

        <View style={styles.habitsCard}>
          {goals.map((goal, i) => (
            <Pressable
              key={goal.id}
              onPress={() => handleToggleGoal(goal.id)}
              style={[styles.habitRow, i < goals.length - 1 && styles.habitDivider]}
            >
              <View style={[styles.habitCheck, goal.done && styles.habitCheckDone]}>
                {goal.done && <Text style={styles.habitCheckmark}>✓</Text>}
              </View>
              <Text style={[styles.habitLabel, goal.done && styles.habitLabelDone]}>
                {goal.label}
              </Text>
              <Text style={styles.habitXp}>+{goal.xp}</Text>
            </Pressable>
          ))}
          {goals.length === 0 && (
            <Text style={styles.emptyText}>No habits configured yet.</Text>
          )}
        </View>

        <Pressable style={styles.customizeBtn} onPress={() => navigation.navigate('Shop')}>
          <Text style={styles.customizeBtnText}>🎨 Customize tree</Text>
        </Pressable>
      </Screen>
      <ConfettiBurst ref={confettiRef} />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingHorizontal: spacing.lg },
  treeWrap: { alignItems: 'center', marginVertical: spacing.sm },
  treeEmoji: { fontSize: 78 },
  quoteBubble: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.line,
    borderRadius: radii.pill,
    paddingHorizontal: 18,
    paddingVertical: 8,
    marginTop: spacing.sm,
  },
  quoteText: { fontFamily: fonts.bodyBold, fontSize: fontSizes.xs, color: colors.ink },
  xpLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.xs,
    color: colors.inkFaint,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: spacing.sm,
  },
  sectionHead: { marginTop: spacing.md, marginBottom: spacing.sm },
  sectionTitle: { fontFamily: fonts.bodyBold, fontSize: fontSizes.base + 2, color: colors.ink },
  journeyRow: { flexDirection: 'row', justifyContent: 'space-between' },
  journeyStep: { flex: 1, alignItems: 'center' },
  journeyDot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2.5,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  journeyDotDone: { backgroundColor: colors.sage, borderColor: colors.sage },
  journeyDotText: { fontFamily: fonts.bodyBold, fontSize: fontSizes.sm, color: colors.inkFaint },
  journeyDotTextDone: { color: '#FFFFFF' },
  journeyLabel: { fontFamily: fonts.bodyBold, fontSize: 10, color: colors.inkSoft },
  habitsCard: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.line,
    borderRadius: radii.md,
    paddingVertical: 4,
    paddingHorizontal: spacing.lg,
  },
  habitRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm + 2, paddingVertical: 10 },
  habitDivider: { borderBottomWidth: 1, borderBottomColor: colors.line },
  habitCheck: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.inkFaint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  habitCheckDone: { backgroundColor: colors.sage, borderColor: colors.sage },
  habitCheckmark: { color: '#FFFFFF', fontSize: 10, fontFamily: fonts.bodyBold },
  habitLabel: { flex: 1, fontFamily: fonts.bodyMedium, fontSize: fontSizes.sm, color: colors.ink },
  habitLabelDone: { color: colors.inkFaint, textDecorationLine: 'line-through' },
  habitXp: { fontFamily: fonts.bodyBold, fontSize: fontSizes.xs, color: colors.sage },
  emptyText: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.sm,
    color: colors.inkFaint,
    paddingVertical: spacing.md,
  },
  customizeBtn: {
    alignSelf: 'center',
    marginTop: spacing.lg,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.line,
  },
  customizeBtnText: { fontFamily: fonts.bodyBold, fontSize: fontSizes.sm, color: colors.ink },
});
