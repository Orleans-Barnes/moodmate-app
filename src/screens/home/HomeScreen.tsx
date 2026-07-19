import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, Pressable, StyleSheet, ScrollView, Dimensions,
  BackHandler, Animated, Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainTabParamList, RootStackParamList } from '@/navigation/types';
import { ConfettiBurst, ConfettiHandle } from '@/components/Confetti';
import * as Haptics from 'expo-haptics';
import { GoalRow } from './GoalRow';
import { XPBar } from '@/components/gamification/XPBar';
import { BadgeShelf } from '@/components/gamification/BadgeShelf';
import { MicroNudge } from '@/components/gamification/MicroNudge';
import { DailyMissionCard } from '@/components/gamification/DailyMissionCard';
import { useWellnessStore } from '@/state/useWellnessStore';
import { useAuthStore } from '@/state/useAuthStore';
import { GuestProgressBanner } from '@/components/GuestProgressBanner';
import { useToast } from '@/state/useToast';
import { useGamificationStore, getTodayMission, XP_VALUES } from '@/state/useGamificationStore';
import { ApiRequestError } from '@/api/client';
import { hapticLight } from '@/utils/haptics';
import { colors, fonts, fontSizes, spacing, radii, shadow, gradients, glow } from '@/theme/tokens';
import { DarkGlassView } from '@/components/GlassView';
import { LiquidBackground } from '@/components/LiquidBackground';
import { XPGainFloat, type XPGainHandle } from '@/components/gamification/XPGainFloat';
import { LevelUpModal, type LevelUpHandle } from '@/components/gamification/LevelUpModal';
import { StreakBumpCard, type StreakBumpHandle } from '@/components/gamification/StreakBumpCard';
import { StreakCalendarWidget } from '@/components/gamification/StreakCalendarWidget';
import { useDashboardStore } from '@/state/useDashboardStore';
import { useNotificationStore } from '@/state/useNotificationStore';
import { RecommendationCard } from '@/components/dashboard/RecommendationCard';
import { LatestMoodCard } from '@/components/dashboard/LatestMoodCard';
import { JournalPreviewCard } from '@/components/dashboard/JournalPreviewCard';
import { SosShortcut } from '@/components/dashboard/SosShortcut';
import type { RecommendationAction } from '@/utils/recommendationEngine';


const { width: SW } = Dimensions.get('window');

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Home'>,
  NativeStackScreenProps<RootStackParamList>
>;

const QUICK_ACTIONS = [
  { key: 'breathe', icon: 'leaf-outline',    label: 'Breathe',  from: '#5C8AE6', to: '#7BAEF5', shadowColor: glow.blue },
  { key: 'journal', icon: 'book-outline',    label: 'Journal',  from: '#5F9E7C', to: '#7DC4A0', shadowColor: glow.sage },
  { key: 'explore', icon: 'compass-outline', label: 'Explore',  from: '#8E7BC0', to: '#ADA1D8', shadowColor: glow.lavender },
  { key: 'checkin', icon: 'heart-outline',   label: 'Check in', from: '#FF6F4D', to: '#FF9A80', shadowColor: glow.coral },
] as const;

const JOURNEY_STAGES = ['Roots', 'Sprout', 'Bloom', 'Canopy'];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

const TODAY_LABEL = new Date().toLocaleDateString('en-US', {
  weekday: 'long', month: 'long', day: 'numeric',
});

function getNudge(streakCount: number, doneCount: number, totalGoals: number): { msg: string; emoji: string; color: string } | null {
  const h = new Date().getHours();
  if (streakCount === 0) return { msg: 'Start your streak today! Complete any activity to begin.', emoji: '🔥', color: '#F59E0B' };
  if (streakCount > 0 && doneCount === 0 && h >= 18) return { msg: `Don't lose your ${streakCount}-day streak! Do one activity before midnight.`, emoji: '⚡', color: '#EF4444' };
  if (totalGoals > 0 && doneCount === totalGoals) return { msg: 'All goals done! You\'re crushing it today 🎉', emoji: '🏆', color: '#5C8AE6' };
  if (h >= 6 && h < 9) return { msg: 'Morning check-in sets the tone for your whole day.', emoji: '☀️', color: '#F59E0B' };
  return null;
}

// ── Quick action card - spring press, native driver only ─────────────────────
function QuickActionCard({ action, onPress }: {
  action: typeof QUICK_ACTIONS[number];
  onPress: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const pressIn  = () =>
    Animated.spring(scale, { toValue: 0.93, speed: 60, bounciness: 0, useNativeDriver: true }).start();
  const pressOut = () =>
    Animated.spring(scale, { toValue: 1,    speed: 30, bounciness: 8, useNativeDriver: true }).start();

  return (
    <Animated.View style={[s.quickCard, { transform: [{ scale }], shadowColor: action.shadowColor }]}>
      <Pressable onPressIn={pressIn} onPressOut={pressOut} onPress={onPress}>
        <LinearGradient
          colors={[action.from, action.to]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={s.quickGrad}
        >
          <Ionicons name={action.icon as any} size={30} color="#FFFFFF" />
          <Text style={s.quickLabel}>{action.label}</Text>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}


// ── Daily Affirmations ─────────────────────────────────────────────────────────
const AFFIRMATIONS = [
  "You are enough, exactly as you are today.",
  "Your feelings are valid and worthy of care.",
  "Every small step forward is still progress.",
  "You have survived 100% of your hardest days.",
  "Rest is productive - your mind needs recovery too.",
  "You are allowed to take up space and ask for help.",
  "Struggling doesn't make you weak - it makes you human.",
  "You don't have to have it all figured out right now.",
  "Your mental health matters as much as your grades.",
  "One breath at a time. One moment at a time.",
  "You are worthy of kindness, especially from yourself.",
  "Growth happens in the quiet moments of persistence.",
  "You are not defined by your worst day.",
  "It's okay to slow down - the world will still be here.",
  "Your uniqueness is your greatest strength.",
  "You are more resilient than you give yourself credit for.",
  "Healing isn't linear, and that's completely okay.",
  "You deserve the same compassion you give to others.",
  "Every day is a fresh start, no matter what yesterday held.",
  "Being kind to yourself is a superpower.",
  "Your presence in this world matters deeply.",
  "Progress looks different for everyone - yours is valid.",
  "You are brave for showing up, even on difficult days.",
  "Asking for support is an act of courage, not weakness.",
  "You are doing better than you think.",
  "Your emotions are messengers - they deserve attention.",
  "Small joys compound into a meaningful life.",
  "You are exactly where you need to be right now.",
  "Nourishing your mind is never a waste of time.",
  "You have within you the strength to get through this.",
];


// ── MoodBird - Finch-inspired virtual companion ────────────────────────────
const BIRD_STAGES = [
  { minXp: 0,    maxXp: 99,   emoji: '🥚', name: 'Egg',       msg: ['Your MoodBird is about to hatch! Keep going.', 'A little warmth and it will crack open soon!'] },
  { minXp: 100,  maxXp: 299,  emoji: '🐣', name: 'Hatchling', msg: ['Hello! I just hatched! Keep caring for yourself.', "I'm tiny but growing - just like your good habits!"] },
  { minXp: 300,  maxXp: 599,  emoji: '🐤', name: 'Chick',     msg: ["Look how far you've come! I'm getting bigger!", 'Your consistency is feeding me. Thank you!'] },
  { minXp: 600,  maxXp: 999,  emoji: '🐦', name: 'Fledgling', msg: ["Almost ready to fly! You're doing amazing.", 'My wings are getting stronger, just like you!'] },
  { minXp: 1000, maxXp: Infinity, emoji: '🦅', name: 'Eagle', msg: ["We did it! You've built incredible self-care habits.", 'Soaring high - because you never gave up on yourself!'] },
];

function getBirdStage(xp: number) {
  return BIRD_STAGES.find((s) => xp >= s.minXp && xp <= s.maxXp) ?? BIRD_STAGES[0];
}

function MoodBirdCard({ totalXp }: { totalXp: number }) {
  const stage   = getBirdStage(totalXp);
  const nextStage = BIRD_STAGES[BIRD_STAGES.indexOf(stage) + 1];
  const pct     = nextStage
    ? Math.min(1, (totalXp - stage.minXp) / (nextStage.minXp - stage.minXp))
    : 1;
  const [msg, setMsg] = React.useState('');
  const bounce  = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(bounce, { toValue: -8, duration: 700, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      Animated.timing(bounce, { toValue: 0,  duration: 700, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
    ])).start();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const tap = () => {
    const msgs = stage.msg;
    setMsg(msgs[Math.floor(Math.random() * msgs.length)]);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTimeout(() => setMsg(''), 4000);
  };

  return (
    <Pressable onPress={tap} style={bird.card}>
      <LinearGradient
        colors={['#1A1A2E', '#16213E']}
        style={bird.gradient}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      >
        {/* Stars */}
        <Text style={bird.star1}>✦</Text>
        <Text style={bird.star2}>✦</Text>
        <Text style={bird.star3}>·</Text>

        <View style={bird.row}>
          {/* Bird */}
          <Animated.View style={[bird.birdWrap, { transform: [{ translateY: bounce }] }]}>
            <Text style={bird.birdEmoji}>{stage.emoji}</Text>
          </Animated.View>

          {/* Info */}
          <View style={bird.info}>
            <Text style={bird.stageName}>MoodBird - {stage.name}</Text>
            <Text style={bird.xpTxt}>{totalXp} XP total</Text>
            {/* Progress bar */}
            <View style={bird.barTrack}>
              <LinearGradient
                colors={['#7BAEF5', '#A78BFA']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={[bird.barFill, { width: `${Math.round(pct * 100)}%` as any }]}
              />
            </View>
            <Text style={bird.barLabel}>
              {nextStage ? `${nextStage.minXp - totalXp} XP to ${nextStage.name}` : 'Max stage reached! 🎉'}
            </Text>
          </View>
        </View>

        {/* Speech bubble */}
        {!!msg && (
          <View style={bird.bubble}>
            <Text style={bird.bubbleTxt}>{msg}</Text>
          </View>
        )}

        {/* Tap hint */}
        {!msg && <Text style={bird.tapHint}>Tap to hear from your bird</Text>}
      </LinearGradient>
    </Pressable>
  );
}

const bird = StyleSheet.create({
  card:      { marginBottom: spacing.lg, borderRadius: 20, overflow: 'hidden', ...shadow.md },
  gradient:  { borderRadius: 20, padding: spacing.lg, minHeight: 110 },
  row:       { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  birdWrap:  { width: 64, height: 64, alignItems: 'center', justifyContent: 'center' },
  birdEmoji: { fontSize: 48 },
  info:      { flex: 1 },
  stageName: { fontFamily: fonts.display, fontSize: fontSizes.base, color: '#E8D5FF', marginBottom: 2 },
  xpTxt:     { fontFamily: fonts.bodyMedium, fontSize: fontSizes.xs, color: 'rgba(255,255,255,0.5)', marginBottom: 6 },
  barTrack:  { height: 6, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden', marginBottom: 4 },
  barFill:   { height: 6, borderRadius: 3 },
  barLabel:  { fontFamily: fonts.bodyMedium, fontSize: fontSizes.xs, color: 'rgba(255,255,255,0.45)' },
  bubble:    { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: spacing.sm, marginTop: spacing.md },
  bubbleTxt: { fontFamily: fonts.bodyMedium, fontSize: fontSizes.sm, color: '#E8D5FF', textAlign: 'center' },
  tapHint:   { fontFamily: fonts.bodyMedium, fontSize: fontSizes.xs, color: 'rgba(255,255,255,0.3)', textAlign: 'right', marginTop: spacing.sm },
  star1:     { position: 'absolute', top: 10, right: 20, color: 'rgba(255,255,255,0.15)', fontSize: 10 },
  star2:     { position: 'absolute', top: 30, right: 50, color: 'rgba(255,255,255,0.1)', fontSize: 7 },
  star3:     { position: 'absolute', top: 55, right: 30, color: 'rgba(255,255,255,0.12)', fontSize: 14 },
});

function DailyAffirmationCard() {
  const dayIndex = Math.floor(Date.now() / 86400000) % AFFIRMATIONS.length;
  const text = AFFIRMATIONS[dayIndex];
  const pulse = React.useRef(new Animated.Value(1)).current;
  React.useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1.06, duration: 2200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 1, duration: 2200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ])).start();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <LinearGradient
      colors={['#5F9E7C', '#3B8C68']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={aff.card}
    >
      <View style={aff.top}>
        <Animated.Text style={[aff.quoteIcon, { transform: [{ scale: pulse }] }]}>✨</Animated.Text>
        <Text style={aff.label}>Today's affirmation</Text>
      </View>
      <Text style={aff.text}>"{text}"</Text>
    </LinearGradient>
  );
}
const aff = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: spacing.xl,
    marginBottom: spacing.lg,
  },
  top: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: spacing.sm },
  quoteIcon: { fontSize: 18 },
  label: { fontFamily: fonts.bodyBold, fontSize: fontSizes.xs, color: 'rgba(255,255,255,0.8)', letterSpacing: 0.4, textTransform: 'uppercase' },
  text: { fontFamily: fonts.display, fontSize: fontSizes.md, color: '#FFFFFF', lineHeight: 26 },
});

export function HomeScreen({ navigation }: Props) {
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => sub.remove();
  }, []);

  const goals          = useWellnessStore((s) => s.goals);
  const streakCount    = useWellnessStore((s) => s.streakCount);
  const treeStage      = useWellnessStore((s) => s.treeStage);
  const treeSkinEmoji  = useWellnessStore((s) => s.treeSkinEmoji);
  const treeXp         = useWellnessStore((s) => s.treeXp);
  const treeXpMax      = useWellnessStore((s) => s.treeXpMax);
  const load           = useWellnessStore((s) => s.load);
  const toggleGoal     = useWellnessStore((s) => s.toggleGoal);
  const token          = useAuthStore((s) => s.token);
  const user           = useAuthStore((s) => s.user);
  const isGuest        = user?.guest ?? false;
  const recommendation   = useDashboardStore((s) => s.recommendation);
  const latestMood        = useDashboardStore((s) => s.latestMood);
  const latestJournal     = useDashboardStore((s) => s.latestJournal);
  const dashboardRefresh  = useDashboardStore((s) => s.refresh);
  const unreadCount       = useNotificationStore((s) => s.unreadCount);
  const refreshUnreadCount = useNotificationStore((s) => s.refreshUnreadCount);
  const toast          = useToast();
  const confettiRef    = useRef<ConfettiHandle>(null);
  const xpFloatRef     = useRef<XPGainHandle>(null);
  const levelUpRef     = useRef<LevelUpHandle>(null);
  const prevLevelRef   = useRef<number>(0);
  const streakBumpRef  = useRef<StreakBumpHandle>(null);
  const prevDone       = useRef(false);
  const insets         = useSafeAreaInsets();

  const totalXp             = useGamificationStore((s) => s.totalXp);
  const unlockedBadges      = useGamificationStore((s) => s.unlockedBadges);
  const newlyUnlockedBadge  = useGamificationStore((s) => s.newlyUnlockedBadge);
  const clearNewBadge       = useGamificationStore((s) => s.clearNewBadge);
  const completeMission     = useGamificationStore((s) => s.completeMission);
  const isMissionDoneToday  = useGamificationStore((s) => s.isMissionDoneToday);
  const awardXp             = useGamificationStore((s) => s.awardXp);
  const moodGateLastDate    = useGamificationStore((s) => s.moodGateLastDate);
  const missionCompletedDate = useGamificationStore((s) => s.missionCompletedDate);
  const actionCounts        = useGamificationStore((s) => s.actionCounts);

  const levelData = (() => {
    const THRESHOLDS = [0, 100, 300, 600, 1000, 1500, 2200, 3000];
    let level = 1;
    for (let i = THRESHOLDS.length - 1; i >= 0; i--) {
      if (totalXp >= THRESHOLDS[i]) { level = i + 1; break; }
    }
    const base = THRESHOLDS[level - 1] ?? 0;
    const next = THRESHOLDS[level] ?? (THRESHOLDS[THRESHOLDS.length - 1] + 500);
    return { level, xpInLevel: totalXp - base, xpForNextLevel: next - base };
  })();

  const treePct    = treeXpMax > 0 ? Math.round((treeXp / treeXpMax) * 100) : 0;
  const stageIndex = JOURNEY_STAGES.indexOf(treeStage);
  const doneCount  = goals.filter((g) => g.done).length;
  const firstName  = user?.fullName?.split(' ')[0] ?? 'there';

  // Animated streak pulse
  const streakPulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (streakCount <= 0) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(streakPulse, { toValue: 1.18, duration: 700, useNativeDriver: true }),
        Animated.timing(streakPulse, { toValue: 1,    duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [streakCount]);

  // Badge unlock toast
  const [badgeToast, setBadgeToast] = useState<string | null>(null);
  useEffect(() => {
    if (newlyUnlockedBadge) {
      setBadgeToast(newlyUnlockedBadge);
      confettiRef.current?.fire();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const t = setTimeout(() => { clearNewBadge(); setBadgeToast(null); }, 3500);
      return () => clearTimeout(t);
    }
  }, [newlyUnlockedBadge, clearNewBadge]);

  // Streak celebration — fires only on real increments, not on initial load
  const prevStreakRef = useRef(-1);  // -1 = not yet initialized
  const MILESTONES = [3, 7, 14, 21, 30, 50, 100];
  useEffect(() => {
    if (prevStreakRef.current === -1) {
      // First load — set baseline, no celebration
      prevStreakRef.current = streakCount;
      return;
    }
    if (streakCount > prevStreakRef.current) {
      const isMilestone = MILESTONES.includes(streakCount);
      streakBumpRef.current?.show(streakCount, isMilestone);
      if (isMilestone) {
        confettiRef.current?.fire();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    }
    prevStreakRef.current = streakCount;
  }, [streakCount]);

  const nudge      = getNudge(streakCount, doneCount, goals.length);
  const missionDone = isMissionDoneToday();

  const todayStr = new Date().toISOString().split('T')[0];
  const actDone = {
    checkin:   moodGateLastDate === todayStr,
    mission:   missionCompletedDate === todayStr,
    journal:   (actionCounts?.journals ?? 0) > 0,
    breathing: (actionCounts?.breathing ?? 0) > 0,
    gratitude: (actionCounts?.gratitude ?? 0) > 0,
  };
  const todayActivities = Object.values(actDone).filter(Boolean).length;

  const refresh = useCallback(() => {
    if (!token) return;
    load(token).catch((err) => {
      toast(err instanceof ApiRequestError ? err.message : 'Could not load wellness data.');
    });
    // Dashboard data (latest mood/journal/preferences/recommendation) fails open - a rejected
    // call there is already handled inside useDashboardStore (prior data preserved, no throw), so
    // no .catch()/toast needed here the way the wellness load() above needs one.
    dashboardRefresh(token, {
      streakCount,
      allGoalsDoneToday: goals.length > 0 && goals.every((g) => g.done),
    });
    // Notification badge - already fails silently inside the store (see its own doc comment), so
    // no .catch()/toast needed here, same as the dashboardRefresh call above.
    refreshUnreadCount(token);
  }, [token, load, toast, dashboardRefresh, streakCount, goals, refreshUnreadCount]);

  // ── Level-up detection ────────────────────────────────────────────────────
  useEffect(() => {
    const cur = levelData.level;
    if (prevLevelRef.current > 0 && cur > prevLevelRef.current) {
      levelUpRef.current?.celebrate(cur);
    }
    prevLevelRef.current = cur;
  }, [levelData.level]);

    useFocusEffect(useCallback(() => { refresh(); }, [refresh]));

  useEffect(() => {
    const allDone = goals.length > 0 && goals.every((g) => g.done);
    if (allDone && !prevDone.current) confettiRef.current?.fire();
    prevDone.current = allDone;
  }, [goals]);

  const showXPGain = (amount: number) => xpFloatRef.current?.show(amount);

  const handleToggle = async (id: string) => {
    if (!token) return;
    hapticLight();
    try {
      const didIncrementStreak = await toggleGoal(token, id);
      // The API returns true when this toggle completed all goals + incremented streak.
      // We show the streak card here immediately (before the useEffect can fire) so
      // the celebration is tied to the exact action that earned it.
      if (didIncrementStreak) {
        const newStreak = useWellnessStore.getState().streakCount;
        const isMilestone = [3, 7, 14, 21, 30, 50, 100].includes(newStreak);
        streakBumpRef.current?.show(newStreak, isMilestone);
        if (isMilestone) confettiRef.current?.fire();
        showXPGain(5); // goal-completion XP float
        // Sync prevStreakRef so the useEffect doesn't double-fire
        prevStreakRef.current = newStreak;
      }
    }
    catch (err) { toast(err instanceof ApiRequestError ? err.message : 'Could not update goal.'); }
  };

  const handleQuickAction = (key: typeof QUICK_ACTIONS[number]['key']) => {
    hapticLight();
    if (key === 'breathe') navigation.navigate('BreathingSession', { session: 'Breathing Reset', duration: 120 });
    else if (key === 'journal') navigation.navigate('Journal');
    else if (key === 'explore') navigation.navigate('Explore');
    else if (key === 'checkin') navigation.navigate('CheckIn');
  };

  const handleMissionTap = () => {
    if (missionDone) return;
    hapticLight();
    if (isGuest) {
      const mission = getTodayMission();
      try { (navigation as any).navigate(mission.route, mission.params); }
      catch { navigation.navigate('CheckIn'); }
      return;
    }
    const mission = getTodayMission();
    completeMission();
    awardXp(XP_VALUES.missionBonus, streakCount);
    try { (navigation as any).navigate(mission.route, mission.params); }
    catch { navigation.navigate('CheckIn'); }
  };

  const handleRecommendationAction = (action: RecommendationAction) => {
    hapticLight();
    try { (navigation as any).navigate(action.route, action.params); }
    catch { navigation.navigate('CheckIn'); }
  };

  return (
    <View style={s.root}>
      <LiquidBackground preset="wellness" opacityScale={0.55} />
      {/* ── Brand gradient header ── */}
      <LinearGradient
        colors={gradients.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[s.header, { paddingTop: insets.top + spacing.md }]}
      >
        <View style={s.headerTop}>
          <View>
            <Text style={s.greeting}>{getGreeting()}, {firstName} 👋</Text>
            <Text style={s.date}>{TODAY_LABEL}</Text>
          </View>
          <View style={s.headerActions}>
            {/* Bell - notification center (Phase 1E, Step 3) */}
            <Pressable
              style={s.bellBtn}
              onPress={() => navigation.navigate('NotificationCenter')}
              hitSlop={8}
            >
              <Ionicons name="notifications-outline" size={22} color="#FFFFFF" />
              {unreadCount > 0 && (
                <View style={s.bellBadge}>
                  <Text style={s.bellBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                </View>
              )}
            </Pressable>
            {/* Avatar with coral glow ring */}
            <Pressable
              style={s.avatarBtn}
              onPress={() => navigation.navigate('Profile')}
            >
              <Text style={s.avatarEmoji}>{user?.avatarEmoji ?? '🙂'}</Text>
            </Pressable>
          </View>
        </View>

        {/* Stats pills - glassmorphism */}
        <View style={s.statsRow}>
          <DarkGlassView style={s.statPill} borderRadius={14} overlayColor='rgba(255,255,255,0.13)' borderColor='rgba(255,255,255,0.22)'>
            <Animated.View style={{ transform: [{ scale: streakPulse }] }}>
              <Ionicons
                name={streakCount > 0 ? 'flame' : 'water-outline'}
                size={18}
                color={streakCount > 0 ? '#FFC857' : 'rgba(255,255,255,0.8)'}
              />
            </Animated.View>
            <Text style={s.statPillVal}>{streakCount}</Text>
            <Text style={s.statPillLabel}>day streak</Text>
          </DarkGlassView>
          <DarkGlassView style={s.statPill} borderRadius={14} overlayColor='rgba(255,255,255,0.13)' borderColor='rgba(255,255,255,0.22)'>
            <Text style={s.statPillIcon}>{treeSkinEmoji}</Text>
            <Text style={s.statPillVal}>{treeStage}</Text>
            <Text style={s.statPillLabel}>tree stage</Text>
          </DarkGlassView>
          <DarkGlassView style={s.statPill} borderRadius={14} overlayColor='rgba(255,255,255,0.13)' borderColor='rgba(255,255,255,0.22)'>
            <Ionicons name="checkmark-circle-outline" size={18} color="rgba(255,255,255,0.9)" />
            <Text style={s.statPillVal}>{doneCount}/{goals.length}</Text>
            <Text style={s.statPillLabel}>goals done</Text>
          </DarkGlassView>
        </View>

        {/* XP Bar */}
        {!isGuest && (
          <View style={s.xpBarWrap}>
            <XPBar
              level={levelData.level}
              xpInLevel={levelData.xpInLevel}
              xpForNextLevel={levelData.xpForNextLevel}
              totalXp={totalXp}
              barColor="#FBBF24"
            />
          </View>
        )}
      </LinearGradient>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── SOS shortcut - always visible, never gated on data/auth state ── */}
        <SosShortcut onPress={() => navigation.navigate('SOS')} />

        {/* ── Phase 1D: personalized recommendation + latest mood/journal ── */}
        {!isGuest && (
          <>
            <RecommendationCard
              recommendation={recommendation}
              onAction={() => handleRecommendationAction(recommendation.action)}
            />
            <LatestMoodCard mood={latestMood} onPress={() => navigation.navigate('CheckIn')} />
            <JournalPreviewCard entry={latestJournal} onPress={() => navigation.navigate('Journal')} />
          </>
        )}

        {/* Guest banner / gamification nudges */}
        {isGuest ? (
          <GuestProgressBanner onCreateAccount={() => navigation.navigate('Signup')} />
        ) : (
          <>
            {badgeToast && (
              <MicroNudge
                message={`🎉 Badge unlocked: "${badgeToast}"!`}
                emoji="🏅"
                color="#F59E0B"
                onDismiss={() => setBadgeToast(null)}
              />
            )}
            {!badgeToast && nudge && (
              <MicroNudge message={nudge.msg} emoji={nudge.emoji} color={nudge.color} />
            )}
          </>
        )}

        {/* ── Streak Calendar ── */}
        {!isGuest && (
          <StreakCalendarWidget onShieldBought={() => { if (token) load(token); }} />
        )}

        {/* ── Today's Activities list ── */}
        {!isGuest && (
          <>
            <View style={s.sectionRow}>
              <Text style={s.sectionTitle}>Today's activities</Text>
              <Text style={s.sectionMeta}>{todayActivities}/5 done</Text>
            </View>
            <View style={s.activitiesCard}>
              {([
                { key: 'checkin',   icon: 'heart-outline',         iconColor: '#FF6F4D', bg: '#FFE8E4', name: 'Check in mood',     hint: 'How are you feeling today?',    done: actDone.checkin,   onTap: () => navigation.navigate('CheckIn') },
                { key: 'mission',   icon: 'flag-outline',          iconColor: '#8E7BC0', bg: '#EDE9FA', name: 'Daily mission',      hint: "Complete today's challenge",   done: actDone.mission,   onTap: handleMissionTap },
                { key: 'journal',   icon: 'book-outline',          iconColor: '#5F9E7C', bg: '#E8F5EE', name: 'Write in journal',   hint: 'Reflect on your thoughts',     done: actDone.journal,   onTap: () => navigation.navigate('Journal') },
                { key: 'breathing', icon: 'leaf-outline',          iconColor: '#5C8AE6', bg: '#E8EEFF', name: 'Breathing session',  hint: '2 min to reset your mind',     done: actDone.breathing, onTap: () => navigation.navigate('BreathingSession', { session: 'Breathing Reset', duration: 120 }) },
                { key: 'gratitude', icon: 'flower-outline',        iconColor: '#F59E0B', bg: '#FEF9E7', name: 'Add gratitude note', hint: 'What are you grateful for?',  done: actDone.gratitude, onTap: () => navigation.navigate('GratitudeJar') },
              ] as const).map((act, idx, arr) => (
                <Pressable
                  key={act.key}
                  style={[s.actRow, idx < arr.length - 1 && s.actRowBorder]}
                  onPress={() => { hapticLight(); if (!act.done) act.onTap(); }}
                  accessibilityRole="button"
                  accessibilityLabel={act.name}
                >
                  <View style={[s.actIcon, { backgroundColor: act.bg }]}>
                    <Ionicons name={act.icon as any} size={20} color={act.iconColor} />
                  </View>
                  <View style={s.actText}>
                    <Text style={[s.actName, act.done && s.actNameDone]}>{act.name}</Text>
                    <Text style={s.actHint}>{act.done ? '✓ Completed' : act.hint}</Text>
                  </View>
                  {act.done
                    ? <View style={s.actCheck}><Text style={s.actCheckMark}>✓</Text></View>
                    : <Text style={s.actArrow}>›</Text>}
                </Pressable>
              ))}
            </View>
          </>
        )}

        {/* ── Daily Mission ── */}
        {!isGuest && <Text style={s.sectionTitle}>Daily Mission</Text>}
        {!isGuest && <DailyMissionCard completed={missionDone} onPress={handleMissionTap} />}

        {/* ── Daily Affirmation ── */}
        {!isGuest && <DailyAffirmationCard />}

        {/* ── MoodBird companion ── */}
        {!isGuest && <MoodBirdCard totalXp={totalXp} />}

        {/* ── Quick actions ── */}
        <Text style={s.sectionTitle}>Quick actions</Text>
        <View style={s.quickGrid}>
          {QUICK_ACTIONS.map((a) => (
            <QuickActionCard
              key={a.key}
              action={a}
              onPress={() => handleQuickAction(a.key)}
            />
          ))}
        </View>

        {/* ── Badge shelf ── */}
        <Text style={s.sectionTitle}>Your badges</Text>
        <View style={s.badgeCard}>
          <BadgeShelf unlockedBadges={unlockedBadges} />
        </View>

        {/* ── Wellness tree ── */}
        <Text style={s.sectionTitle}>Your wellness tree</Text>
        <View style={s.treeCard}>
          {/* Sage left accent border */}
          <View style={s.treeAccent} />
          <View style={s.treeTop}>
            <Text style={s.treeBigEmoji}>{treeSkinEmoji}</Text>
            <View style={s.treeInfo}>
              <Text style={s.treeName}>{treeStage} Stage</Text>
              <Text style={s.treeXpText}>{treeXp} / {treeXpMax} XP</Text>
              {/* Gradient progress bar */}
              <View style={s.progressTrack}>
                <LinearGradient
                  colors={['#5F9E7C', '#FF6F4D']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[s.progressFill, { width: `${treePct}%` as any }]}
                />
              </View>
              {stageIndex < JOURNEY_STAGES.length - 1 && (
                <Text style={s.treeNext}>Next: {JOURNEY_STAGES[stageIndex + 1]}</Text>
              )}
            </View>
          </View>
          <Pressable style={s.treeBtn} onPress={() => navigation.navigate('WellnessTree')}>
            <Text style={s.treeBtnText}>View my tree →</Text>
          </Pressable>
        </View>

        {/* ── Daily goals ── */}
        <View style={s.sectionRow}>
          <Text style={s.sectionTitle}>Today's goals</Text>
          <Text style={s.sectionMeta}>{doneCount}/{goals.length} done</Text>
        </View>
        <View style={s.goalsCard}>
          {goals.length === 0 ? (
            <Text style={s.emptyText}>No goals set yet - check your wellness tree 🌱</Text>
          ) : (
            goals.map((goal, i) => (
              <GoalRow key={goal.id} goal={goal} onToggle={handleToggle} isLast={i === goals.length - 1} />
            ))
          )}
        </View>

        {/* ── AI Insight (Pro teaser) ── */}
        <Pressable onPress={() => navigation.navigate('Pro')}>
          <LinearGradient
            colors={['#8E7BC0', '#A491D3']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={s.insightCard}
          >
            <View style={s.insightTop}>
              <View style={s.insightTitleRow}><Ionicons name="sparkles" size={15} color="#FFFFFF" /><Text style={s.insightTitle}>  AI Insight</Text></View>
              <View style={s.proChip}><Text style={s.proChipText}>PRO</Text></View>
            </View>
            <Text style={s.insightText}>
              Your stress tends to dip on Wednesday afternoons. Want a 5-minute breathing reminder?
            </Text>
          </LinearGradient>
        </Pressable>
      </ScrollView>

      <ConfettiBurst ref={confettiRef} />
      <XPGainFloat ref={xpFloatRef} bottom={160} />
      <LevelUpModal ref={levelUpRef} />
      <StreakBumpCard ref={streakBumpRef} />
    </View>
  );
}

const CARD_R = 20;

const s = StyleSheet.create({
  // ── Root ── unified bg
  root: { flex: 1, backgroundColor: colors.bg },

  // ── Header ── brand purple gradient
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  greeting: {
    fontFamily: fonts.display,
    fontSize: fontSizes.xl,
    color: '#FFFFFF',
  },
  date: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.xs,
    color: 'rgba(255,255,255,0.72)',
    marginTop: 2,
  },
  // Avatar with coral ring glow
  avatarBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: colors.coral,
    shadowColor: glow.coral,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 10,
    elevation: 6,
  },
  avatarEmoji: { fontSize: 22 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  bellBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 3,
    backgroundColor: colors.coral,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#7B3CC9', // matches gradients.header's last stop
  },
  bellBadgeText: { fontFamily: fonts.bodyBold, fontSize: 9, color: '#FFFFFF' },

  // Stats pills - glassmorphism
  statsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  statPill: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    gap: 2,
  },
  statPillIcon: { fontSize: 16 },  // used only for treeSkinEmoji dynamic text
  statPillVal: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.base,
    color: '#FFFFFF',
  },
  statPillLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 10,
    color: 'rgba(255,255,255,0.75)',
  },

  xpBarWrap: {
    borderRadius: 14,
    padding: 10,
    marginTop: 4,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },

  scroll: { flex: 1 },
  content: { padding: spacing.lg, gap: spacing.md },

  sectionTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.md,
    color: colors.ink,          // ← fixed: was #1A1A2E hardcoded
    marginTop: spacing.xs,
  },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  sectionMeta: { fontFamily: fonts.bodyBold, fontSize: fontSizes.xs, color: colors.inkFaint },

  // Activities card
  activitiesCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: CARD_R,
    overflow: 'hidden',
    ...shadow.sm,
  },
  actRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
    minHeight: 60,
  },
  actRowBorder: { borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  actIcon: {
    width: 40, height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actText: { flex: 1, gap: 2 },
  actName: { fontFamily: fonts.bodyBold, fontSize: fontSizes.sm, color: colors.ink },
  actNameDone: { color: colors.inkFaint, textDecorationLine: 'line-through' },
  actHint: { fontFamily: fonts.bodyMedium, fontSize: fontSizes.xs, color: colors.inkFaint },
  actCheck: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: colors.sageSoft,
    alignItems: 'center', justifyContent: 'center',
  },
  actCheckMark: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.sage },
  actArrow: { fontFamily: fonts.bodyBold, fontSize: 20, color: colors.inkFaint },

  // Badge shelf
  badgeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: CARD_R,
    paddingVertical: 12,
    marginHorizontal: -spacing.lg,
    ...shadow.sm,
  },

  // Quick actions 2x2 - animated per-card (shadow done in component)
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  quickCard: {
    width: (SW - spacing.lg * 2 - spacing.md) / 2,
    borderRadius: CARD_R + 2,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 8,
  },
  quickGrad: {
    padding: spacing.lg,
    paddingVertical: spacing.xl,
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  quickLabel: { fontFamily: fonts.bodyBold, fontSize: fontSizes.md, color: '#FFFFFF' },

  // Tree card - sage left accent border
  treeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: CARD_R,
    padding: spacing.lg,
    overflow: 'hidden',
    ...shadow.sm,
  },
  treeAccent: {
    position: 'absolute',
    left: 0, top: 0, bottom: 0,
    width: 4,
    backgroundColor: colors.sage,
    borderTopLeftRadius: CARD_R,
    borderBottomLeftRadius: CARD_R,
  },
  treeTop: {
    flexDirection: 'row', gap: spacing.md,
    alignItems: 'center', marginBottom: spacing.md,
    paddingLeft: 8,   // offset from accent bar
  },
  treeBigEmoji: { fontSize: 52 },
  treeInfo: { flex: 1, gap: 4 },
  treeName: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.md,
    color: colors.ink,           // ← fixed
  },
  treeXpText: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.xs,
    color: colors.inkSoft,
  },
  progressTrack: {
    height: 8,
    backgroundColor: colors.sageSoft,
    borderRadius: 4,
    overflow: 'hidden',
    marginTop: 4,
  },
  progressFill: {
    height: 8,
    borderRadius: 4,
  },
  treeNext: {
    fontFamily: fonts.bodyMedium,
    fontSize: 10,
    color: colors.inkFaint,
    marginTop: 2,
  },
  treeBtn: {
    backgroundColor: colors.sageSoft,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    marginLeft: 8,
  },
  treeBtnText: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.sm,
    color: colors.sage,
  },

  // Goals card
  goalsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: CARD_R,
    paddingHorizontal: spacing.lg,
    paddingVertical: 4,
    ...shadow.sm,
  },
  emptyText: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.sm,
    color: colors.inkSoft,
    textAlign: 'center',
    paddingVertical: spacing.xl,
  },

  // Insight card
  insightCard: {
    borderRadius: CARD_R,
    padding: spacing.lg,
    shadowColor: glow.lavender,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.6,
    shadowRadius: 14,
    elevation: 6,
  },
  insightTitleRow: { flexDirection: 'row', alignItems: 'center' },
  insightTop: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 8,
  },
  insightTitle: { fontFamily: fonts.bodyBold, fontSize: fontSizes.base, color: '#FFFFFF' },
  proChip: {
    backgroundColor: colors.sun,
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 8,
  },
  proChipText: { fontFamily: fonts.bodyBold, fontSize: 9, color: colors.sunText },
  insightText: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.sm,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 20,
  },
});
