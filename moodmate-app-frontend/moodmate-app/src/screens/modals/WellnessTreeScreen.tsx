import React, { useCallback, useEffect, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { ProgressBar } from '@/components/ProgressBar';
import { ConfettiBurst, ConfettiHandle } from '@/components/Confetti';
import { TreeBlob } from '@/components/illustrations/TreeBlob';
import { useWellnessStore } from '@/state/useWellnessStore';
import { useAuthStore } from '@/state/useAuthStore';
import { useToast } from '@/state/useToast';
import { ApiRequestError } from '@/api/client';
import { hapticLight } from '@/utils/haptics';
import { fonts, fontSizes, spacing, radii, calm } from '@/theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'WellnessTree'>;

const JOURNEY_STAGES = ['Roots', 'Sprout', 'Bloom', 'Canopy'] as const;

export function WellnessTreeScreen({ navigation }: Props) {
  const treeXp = useWellnessStore((s) => s.treeXp);
  const treeXpMax = useWellnessStore((s) => s.treeXpMax);
  const treeStage = useWellnessStore((s) => s.treeStage);
  const streakCount = useWellnessStore((s) => s.streakCount);
  const goals = useWellnessStore((s) => s.goals);
  const load = useWellnessStore((s) => s.load);
  const toggleGoal = useWellnessStore((s) => s.toggleGoal);
  const token = useAuthStore((s) => s.token);
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const confettiRef = useRef<ConfettiHandle>(null);
  const swayAnim = useRef(new Animated.Value(0)).current;

  const treePct = treeXpMax > 0 ? Math.max(0, Math.min(100, Math.round((treeXp / treeXpMax) * 100))) : 0;
  const stageIndex = JOURNEY_STAGES.indexOf(treeStage);
  const nextStage = JOURNEY_STAGES[stageIndex + 1];
  const remaining = Math.max(0, treeXpMax - treeXp);

  const refresh = useCallback(() => {
    if (!token) return;
    load(token).catch((err) => {
      toast(err instanceof ApiRequestError ? err.message : 'Could not load your wellness tree.');
    });
  }, [token, load, toast]);

  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(swayAnim, { toValue: 1, duration: 2250, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(swayAnim, { toValue: -1, duration: 2250, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [swayAnim]);

  const handleToggleGoal = async (id: string) => {
    if (!token) return;
    hapticLight();
    try {
      const streakIncremented = await toggleGoal(token, id);
      if (streakIncremented) {
        confettiRef.current?.fire();
        toast(`Streak +1 — ${streakCount + 1} days now`);
      }
    } catch (err) {
      toast(err instanceof ApiRequestError ? err.message : 'Could not update that goal.');
    }
  };

  return (
    <View style={s.root}>
      <View style={[s.hero, { paddingTop: insets.top + spacing.md }]}>
        <Text style={s.heroTitle}>Your wellness tree</Text>
        <Pressable style={[s.closeBtn, { top: insets.top + spacing.md }]} onPress={() => navigation.goBack()} hitSlop={8}>
          <Ionicons name="close" size={20} color="#FFFFFF" />
        </Pressable>
        <View style={s.circle}>
          <Animated.View style={{
            transform: [{ rotate: swayAnim.interpolate({ inputRange: [-1, 1], outputRange: ['-3deg', '3deg'] }) }],
          }}>
            <TreeBlob size={190} />
          </Animated.View>
        </View>
      </View>

      <View style={s.body}>
        <Text style={s.stageTitle}>{treeStage} · Stage {stageIndex + 1} of {JOURNEY_STAGES.length}</Text>
        <Text style={s.stageSub}>
          {treeXp} growth points{nextStage ? ` · ${remaining} to next stage` : ' · fully grown'}
        </Text>
        <ProgressBar progress={treePct} fillColor={calm.primary} trackColor={calm.track} height={12} />

        <Text style={s.sectionTitle}>Ways to grow today</Text>
        <View style={s.list}>
          {goals.map((goal) => (
            <Pressable
              key={goal.id}
              onPress={() => handleToggleGoal(goal.id)}
              style={[s.row, goal.done && s.rowActive]}
            >
              <View style={s.rowLeft}>
                <View style={[s.check, goal.done && s.checkActive]}>
                  {goal.done && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
                </View>
                <Text style={[s.rowLabel, goal.done && s.rowLabelDone]}>{goal.label}</Text>
              </View>
              <Text style={[s.rowXp, goal.done && s.rowXpActive]}>+{goal.xp} pts</Text>
            </Pressable>
          ))}
          {goals.length === 0 && <Text style={s.emptyText}>No habits configured yet.</Text>}
        </View>

        <Pressable style={s.customizeBtn} onPress={() => navigation.navigate('Shop')}>
          <Text style={s.customizeText}>Customize tree</Text>
        </Pressable>
      </View>

      <ConfettiBurst ref={confettiRef} />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: calm.bg },

  hero: {
    height: 260,
    backgroundColor: calm.forest,
    borderBottomLeftRadius: 200,
    borderBottomRightRadius: 200,
    alignItems: 'center',
    overflow: 'hidden',
  },
  heroTitle: { fontFamily: fonts.bodyBold, fontSize: fontSizes.md, color: '#FFFFFF' },
  closeBtn: { position: 'absolute', right: spacing.lg },
  closeText: { fontFamily: fonts.bodyBold, fontSize: 20, color: '#FFFFFF' },
  circle: {
    width: 260, height: 260, borderRadius: 130,
    backgroundColor: calm.forestPanel,
    alignItems: 'center', justifyContent: 'center',
    marginTop: spacing.xl,
  },

  body: { paddingHorizontal: spacing.xl, paddingTop: spacing.xxl, flex: 1 },
  stageTitle: { fontFamily: fonts.displayExtraBold, fontSize: fontSizes.xxl, color: calm.forest, textAlign: 'center', letterSpacing: -0.29 },
  stageSub: { fontFamily: fonts.body, fontSize: fontSizes.base - 1, color: calm.muted, textAlign: 'center', marginTop: spacing.xs, marginBottom: spacing.lg },

  sectionTitle: { fontFamily: fonts.bodyBold, fontSize: fontSizes.base + 1, color: calm.forest, marginTop: spacing.xl, marginBottom: spacing.md },
  list: { gap: spacing.sm },
  row: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: calm.border,
    borderRadius: radii.lg, paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
  },
  rowActive: { backgroundColor: calm.mintBg, borderColor: calm.primary },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  check: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 1.5, borderColor: calm.border,
    alignItems: 'center', justifyContent: 'center',
  },
  checkActive: { backgroundColor: calm.primary, borderColor: calm.primary },
  rowLabel: { fontFamily: fonts.bodyBold, fontSize: fontSizes.base - 1, color: calm.forest },
  rowLabelDone: { color: calm.muted },
  rowXp: { fontFamily: fonts.bodyMedium, fontSize: fontSizes.sm - 1, color: calm.muted },
  rowXpActive: { color: calm.primary },
  emptyText: { fontFamily: fonts.body, fontSize: fontSizes.sm, color: calm.muted, paddingVertical: spacing.md, textAlign: 'center' },

  customizeBtn: {
    alignSelf: 'center', marginTop: spacing.xl,
    paddingVertical: 12, paddingHorizontal: 22,
    borderRadius: radii.pill,
    backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: calm.border,
  },
  customizeText: { fontFamily: fonts.bodyBold, fontSize: fontSizes.sm, color: calm.forest },
});
