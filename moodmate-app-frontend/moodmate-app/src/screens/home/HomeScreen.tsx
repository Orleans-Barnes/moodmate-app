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
import { colors, calm, darkPalette, fonts, fontSizes, spacing, radii, shadow, gradients, glow, accents } from '@/theme/tokens';
import { LiquidBackground } from '@/components/LiquidBackground';
import { HeroHeader } from '@/components/HeroHeader';
import { TreeBlob } from '@/components/illustrations/TreeBlob';
import { XPGainFloat, type XPGainHandle } from '@/components/gamification/XPGainFloat';
import { LevelUpModal, type LevelUpHandle } from '@/components/gamification/LevelUpModal';
import { StreakBumpCard, type StreakBumpHandle } from '@/components/gamification/StreakBumpCard';
import { StreakCalendarWidget } from '@/components/gamification/StreakCalendarWidget';
import { openProUpgrade } from '@/utils/openProUpgrade';
import { useDashboardStore } from '@/state/useDashboardStore';
import { useNotificationStore } from '@/state/useNotificationStore';
import { RecommendationCard } from '@/components/dashboard/RecommendationCard';
import { LatestMoodCard } from '@/components/dashboard/LatestMoodCard';
import { JournalPreviewCard } from '@/components/dashboard/JournalPreviewCard';
import { SosShortcut } from '@/components/dashboard/SosShortcut';
import type { RecommendationAction } from '@/utils/recommendationEngine';
import { useHideTabBarOnScroll } from '@/hooks/useHideTabBarOnScroll';
import { useResolvedAppearance } from '@/hooks/useResolvedAppearance';


const { width: SW } = Dimensions.get('window');

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Home'>,
  NativeStackScreenProps<RootStackParamList>
>;

const QUICK_ACTIONS = [
  { key: 'breathe', icon: 'leaf-outline',    label: 'Breathe',  from: calm.dustyBlue, to: '#8CBFDA', shadowColor: glow.blue },
  { key: 'journal', icon: 'book-outline',    label: 'Journal',  from: calm.primary, to: calm.mint, shadowColor: glow.sage },
  { key: 'explore', icon: 'compass-outline', label: 'Explore',  from: calm.forestPanel, to: calm.primary, shadowColor: glow.sage },
  { key: 'checkin', icon: 'heart-outline',   label: 'Check in', from: calm.terracotta, to: '#E8A87F', shadowColor: glow.sun },
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

// Student-view polish pass - was `{ msg, emoji: string, color }`, rendered as raw emoji text
// inside MicroNudge. Now returns an Ionicons glyph name so the banner renders a proper icon.
function getNudge(
  streakCount: number,
  doneCount: number,
  totalGoals: number,
): { msg: string; icon: keyof typeof Ionicons.glyphMap; color: string } | null {
  const h = new Date().getHours();
  if (streakCount === 0) return { msg: 'Start your streak today! Complete any activity to begin.', icon: 'flame', color: '#F59E0B' };
  if (streakCount > 0 && doneCount === 0 && h >= 18) return { msg: `Don't lose your ${streakCount}-day streak! Do one activity before midnight.`, icon: 'flash', color: '#EF4444' };
  if (totalGoals > 0 && doneCount === totalGoals) return { msg: "All goals done! You're crushing it today.", icon: 'trophy', color: '#5C8AE6' };
  if (h >= 6 && h < 9) return { msg: 'Morning check-in sets the tone for your whole day.', icon: 'sunny', color: '#F59E0B' };
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


// ── MoodBird - Finch-inspired virtual companion (Ionicons, no raster art) ──
const BIRD_STAGES = [
  { minXp: 0,    maxXp: 99,   name: 'Egg',       icon: 'ellipse' as const,           msg: ['Your MoodBird is about to hatch! Keep going.', 'A little warmth and it will crack open soon!'] },
  { minXp: 100,  maxXp: 299,  name: 'Hatchling', icon: 'happy-outline' as const,     msg: ['Hello! I just hatched! Keep caring for yourself.', "I'm tiny but growing - just like your good habits!"] },
  { minXp: 300,  maxXp: 599,  name: 'Chick',     icon: 'heart-circle-outline' as const, msg: ["Look how far you've come! I'm getting bigger!", 'Your consistency is feeding me. Thank you!'] },
  { minXp: 600,  maxXp: 999,  name: 'Fledgling', icon: 'sparkles-outline' as const,  msg: ["Almost ready to fly! You're doing amazing.", 'My wings are getting stronger, just like you!'] },
  { minXp: 1000, maxXp: Infinity, name: 'Eagle', icon: 'trophy' as const,            msg: ["We did it! You've built incredible self-care habits.", 'Soaring high - because you never gave up on yourself!'] },
];

function getBirdStage(xp: number) {
  return BIRD_STAGES.find((s) => xp >= s.minXp && xp <= s.maxXp) ?? BIRD_STAGES[0];
}

function MoodBirdArt({ icon, size = 72 }: { icon: keyof typeof Ionicons.glyphMap; size?: number }) {
  return (
    <View style={[bird.art, { width: size, height: size, borderRadius: size / 2 }]}>
      <View style={[bird.artGlow, { width: size * 0.78, height: size * 0.78, borderRadius: size * 0.39 }]} />
      <Ionicons name={icon} size={Math.round(size * 0.42)} color="#FFFFFF" />
      <View style={[bird.artDot, { top: size * 0.12, right: size * 0.14, backgroundColor: calm.amber }]} />
      <View style={[bird.artDot, { bottom: size * 0.16, left: size * 0.12, backgroundColor: calm.mint }]} />
    </View>
  );
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
        colors={[calm.forest, calm.forestPanel]}
        style={bird.gradient}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      >
        <View style={bird.row}>
          <Animated.View style={[bird.birdWrap, { transform: [{ translateY: bounce }] }]}>
            <MoodBirdArt icon={stage.icon} />
          </Animated.View>

          <View style={bird.info}>
            <Text style={bird.stageName}>MoodBird · {stage.name}</Text>
            <Text style={bird.xpTxt}>{totalXp} XP total</Text>
            <View style={bird.barTrack}>
              <LinearGradient
                colors={[calm.mint, calm.primary]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={[bird.barFill, { width: `${Math.round(pct * 100)}%` as any }]}
              />
            </View>
            <Text style={bird.barLabel}>
              {nextStage ? `${nextStage.minXp - totalXp} XP to ${nextStage.name}` : 'Max stage reached'}
            </Text>
          </View>
        </View>

        {!!msg && (
          <View style={bird.bubble}>
            <Text style={bird.bubbleTxt}>{msg}</Text>
          </View>
        )}

        {!msg && <Text style={bird.tapHint}>Tap to hear from your bird</Text>}
      </LinearGradient>
    </Pressable>
  );
}

const bird = StyleSheet.create({
  card:      { marginBottom: spacing.lg, borderRadius: radii.card, overflow: 'hidden', ...shadow.md },
  gradient:  { borderRadius: radii.card, padding: spacing.lg, minHeight: 120 },
  row:       { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  birdWrap:  { width: 72, height: 72, alignItems: 'center', justifyContent: 'center' },
  art: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.28)',
    overflow: 'hidden',
  },
  artGlow: {
    position: 'absolute',
    backgroundColor: 'rgba(134,198,160,0.28)',
  },
  artDot: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    opacity: 0.9,
  },
  info:      { flex: 1 },
  stageName: { fontFamily: fonts.display, fontSize: fontSizes.base, color: '#FFFFFF', marginBottom: 2 },
  xpTxt:     { fontFamily: fonts.bodyMedium, fontSize: fontSizes.xs, color: calm.mutedOnDark, marginBottom: 6 },
  barTrack:  { height: 6, backgroundColor: 'rgba(255,255,255,0.14)', borderRadius: 3, overflow: 'hidden', marginBottom: 4 },
  barFill:   { height: 6, borderRadius: 3 },
  barLabel:  { fontFamily: fonts.bodyMedium, fontSize: fontSizes.xs, color: calm.mutedOnDark },
  bubble:    { backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: radii.md, padding: spacing.sm, marginTop: spacing.md },
  bubbleTxt: { fontFamily: fonts.bodyMedium, fontSize: fontSizes.sm, color: '#FFFFFF', textAlign: 'center' },
  tapHint:   { fontFamily: fonts.bodyMedium, fontSize: fontSizes.xs, color: 'rgba(255,255,255,0.45)', textAlign: 'right', marginTop: spacing.sm },
});

function DailyAffirmationCard({ onCheckIn }: { onCheckIn?: () => void }) {
  const dayIndex = Math.floor(Date.now() / 86400000) % AFFIRMATIONS.length;
  const text = AFFIRMATIONS[dayIndex];
  return (
    <View style={aff.card}>
      <View style={aff.top}>
        <Ionicons name="leaf-outline" size={16} color={calm.primary} />
        <Text style={aff.label}>Today's affirmation</Text>
      </View>
      <Text style={aff.text}>"{text}"</Text>
      
      {onCheckIn && (
        <View style={{ borderTopWidth: 1, borderTopColor: calm.border, marginTop: spacing.md, paddingTop: spacing.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 13, color: calm.muted }}>How are you feeling today?</Text>
          <Pressable onPress={onCheckIn} style={{ backgroundColor: calm.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: radii.pill }}>
            <Text style={{ fontFamily: fonts.bodyBold, fontSize: 12, color: '#FFFFFF' }}>Check in</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}
const aff = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: calm.border,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    ...shadow.sm,
  },
  top: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: spacing.sm },
  label: { fontFamily: fonts.bodyBold, fontSize: fontSizes.xs, color: calm.primary, letterSpacing: 0.4, textTransform: 'uppercase' },
  text: { fontFamily: fonts.display, fontSize: fontSizes.md, color: calm.forest, lineHeight: 26 },
});

export function HomeScreen({ navigation }: Props) {
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => sub.remove();
  }, []);

  const goals          = useWellnessStore((s) => s.goals);
  const streakCount    = useWellnessStore((s) => s.streakCount);
  const treeStage      = useWellnessStore((s) => s.treeStage);
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
  const scrollY        = useRef(new Animated.Value(0)).current;
  const handleTabAwareScroll = useHideTabBarOnScroll();
  const { isDark } = useResolvedAppearance();

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
    const wellnessSnapshot = useWellnessStore.getState();
    // Dashboard data (latest mood/journal/preferences/recommendation) fails open - a rejected
    // call there is already handled inside useDashboardStore (prior data preserved, no throw), so
    // no .catch()/toast needed here the way the wellness load() above needs one.
    dashboardRefresh(token, {
      streakCount: wellnessSnapshot.streakCount,
      allGoalsDoneToday:
        wellnessSnapshot.goals.length > 0 && wellnessSnapshot.goals.every((g) => g.done),
    });
    // Notification badge - already fails silently inside the store (see its own doc comment), so
    // no .catch()/toast needed here, same as the dashboardRefresh call above.
    refreshUnreadCount(token);
  }, [token, load, toast, dashboardRefresh, refreshUnreadCount]);

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
    <View style={[s.root, isDark && s.rootDark]}>
      <LiquidBackground preset="wellness" opacityScale={0.55} />
      {/* ── Calm Home header ── */}
      <HeroHeader
        gradient={[calm.forest, calm.forest]}
        contentBg={calm.bg}
        title={`${getGreeting()}, ${firstName}`}
        subtitle={TODAY_LABEL}
        scrollY={scrollY}
        rightSlot={
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
              <Text style={s.avatarInitial}>
                {(user?.fullName?.[0] ?? 'M').toUpperCase()}
              </Text>
            </Pressable>
          </View>
        }
        stats={[
          {
            key: 'streak',
            icon: (
              <Animated.View style={{ transform: [{ scale: streakPulse }] }}>
                <Ionicons
                  name={streakCount > 0 ? 'flame' : 'water-outline'}
                  size={18}
                  color={streakCount > 0 ? '#FFC857' : 'rgba(255,255,255,0.8)'}
                />
              </Animated.View>
            ),
            value: streakCount,
            label: 'day streak',
          },
          {
            key: 'tree',
            icon: <Ionicons name="leaf-outline" size={18} color="rgba(255,255,255,0.9)" />,
            value: treeStage,
            label: 'tree stage',
          },
          {
            key: 'goals',
            icon: <Ionicons name="checkmark-circle-outline" size={18} color="rgba(255,255,255,0.9)" />,
            value: `${doneCount}/${goals.length}`,
            label: 'goals done',
          },
        ]}
      >
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
      </HeroHeader>

      <Animated.ScrollView
        style={s.scroll}
        contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true, listener: handleTabAwareScroll },
        )}
      >
        {/* ── SOS shortcut - always visible, never gated on data/auth state ── */}
        <SosShortcut onPress={() => navigation.navigate('SOS')} />

        <DailyAffirmationCard onCheckIn={() => navigation.navigate('CheckIn')} />

        {/* ── Daily Mission ── */}
        {!isGuest && (
          <>
            <Text style={[s.sectionTitle, isDark && s.textDark]}>Daily mission</Text>
            <DailyMissionCard completed={missionDone} onPress={handleMissionTap} />
          </>
        )}

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
                message={`Badge unlocked: "${badgeToast}"!`}
                icon="ribbon"
                color="#F59E0B"
                onDismiss={() => setBadgeToast(null)}
              />
            )}
            {!badgeToast && nudge && (
              <MicroNudge message={nudge.msg} icon={nudge.icon} color={nudge.color} />
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
              <Text style={[s.sectionTitle, isDark && s.textDark]}>Today's activities</Text>
              <Text style={[s.sectionMeta, isDark && s.mutedTextDark]}>{todayActivities}/5 done</Text>
            </View>
            <View style={[s.activitiesCard, isDark && s.surfaceDark]}>
              {([
                { key: 'checkin',   icon: 'heart-outline',         iconColor: accents.wellness.accent, bg: accents.wellness.soft, name: 'Check in mood',     hint: 'How are you feeling today?',    done: actDone.checkin,   onTap: () => navigation.navigate('CheckIn') },
                { key: 'mission',   icon: 'flag-outline',          iconColor: accents.focus.accent, bg: accents.focus.soft, name: 'Daily mission',      hint: "Complete today's challenge",   done: actDone.mission,   onTap: handleMissionTap },
                { key: 'journal',   icon: 'book-outline',          iconColor: colors.journalAccent, bg: colors.journalAccentSoft, name: 'Write in journal',   hint: 'Reflect on your thoughts',     done: actDone.journal,   onTap: () => navigation.navigate('Journal') },
                { key: 'breathing', icon: 'leaf-outline',          iconColor: accents.calm.accent, bg: accents.calm.soft, name: 'Breathing session',  hint: '2 min to reset your mind',     done: actDone.breathing, onTap: () => navigation.navigate('BreathingSession', { session: 'Breathing Reset', duration: 120 }) },
                { key: 'gratitude', icon: 'flower-outline',        iconColor: accents.gratitude.accent, bg: accents.gratitude.soft, name: 'Add gratitude note', hint: 'What are you grateful for?',  done: actDone.gratitude, onTap: () => navigation.navigate('GratitudeJar') },
              ] as const).map((act, idx, arr) => (
                <Pressable
                  key={act.key}
                  style={[s.actRow, idx < arr.length - 1 && s.actRowBorder, isDark && idx < arr.length - 1 && s.borderDark]}
                  onPress={() => { hapticLight(); if (!act.done) act.onTap(); }}
                  accessibilityRole="button"
                  accessibilityLabel={act.name}
                >
                  <View style={[s.actIcon, { backgroundColor: act.bg }]}>
                    <Ionicons name={act.icon as any} size={20} color={act.iconColor} />
                  </View>
                  <View style={s.actText}>
                    <Text style={[s.actName, isDark && s.textDark, act.done && s.actNameDone, isDark && act.done && s.mutedTextDark]}>{act.name}</Text>
                    <Text style={[s.actHint, isDark && s.mutedTextDark]}>{act.done ? 'Completed' : act.hint}</Text>
                  </View>
                  {act.done
                    ? <View style={s.actCheck}><Ionicons name="checkmark" size={14} color="#FFFFFF" /></View>
                    : <Ionicons name="chevron-forward" size={18} color={isDark ? darkPalette.textMuted : colors.inkFaint} />}
                </Pressable>
              ))}
            </View>
          </>
        )}

        {/* ── Daily Affirmation ── */}
        {!isGuest && <DailyAffirmationCard />}

        {/* ── MoodBird companion ── */}
        {!isGuest && <MoodBirdCard totalXp={totalXp} />}

        {/* ── Quick actions ── */}
        <Text style={[s.sectionTitle, isDark && s.textDark]}>Quick actions</Text>
        <View style={s.quickGrid}>
          {QUICK_ACTIONS.map((a) => (
            <QuickActionCard
              key={a.key}
              action={a}
              onPress={() => handleQuickAction(a.key)}
            />
          ))}
        </View>

        <Text style={[s.sectionTitle, isDark && s.textDark]}>Your badges</Text>
        <View style={s.badgeBleed}>
          <BadgeShelf unlockedBadges={unlockedBadges} />
        </View>

        {/* ── Wellness tree ── */}
        <Text style={[s.sectionTitle, isDark && s.textDark]}>Your wellness tree</Text>
        <View style={[s.treeCard, isDark && s.surfaceDark]}>
          <View style={s.treeTop}>
            <View style={[s.treeArt, isDark && s.surfaceGreenDark]}>
              <TreeBlob size={88} />
            </View>
            <View style={s.treeInfo}>
              <Text style={[s.treeName, isDark && s.textDark]}>{treeStage} stage</Text>
              <Text style={[s.treeXpText, isDark && s.mutedTextDark]}>{treeXp} / {treeXpMax} XP</Text>
              <View style={[s.progressTrack, isDark && s.trackDark]}>
                <LinearGradient
                  colors={gradients.coralBtn}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[s.progressFill, { width: `${treePct}%` as any }]}
                />
              </View>
              {stageIndex < JOURNEY_STAGES.length - 1 && (
                <Text style={[s.treeNext, isDark && s.mutedTextDark]}>Next: {JOURNEY_STAGES[stageIndex + 1]}</Text>
              )}
            </View>
          </View>
          <Pressable style={[s.treeBtn, isDark && s.treeBtnDark]} onPress={() => navigation.navigate('WellnessTree')}>
            <Text style={[s.treeBtnText, isDark && s.accentTextDark]}>View my tree</Text>
            <Ionicons name="arrow-forward" size={16} color={isDark ? darkPalette.primary : calm.primary} />
          </Pressable>
        </View>

        {/* ── Daily goals ── */}
        <View style={s.sectionRow}>
          <Text style={[s.sectionTitle, isDark && s.textDark]}>Today's goals</Text>
          <Text style={[s.sectionMeta, isDark && s.mutedTextDark]}>{doneCount}/{goals.length} done</Text>
        </View>
        <View style={[s.goalsCard, isDark && s.surfaceDark]}>
          {goals.length === 0 ? (
            <Text style={[s.emptyText, isDark && s.mutedTextDark]}>No goals set yet - check your wellness tree</Text>
          ) : (
            goals.map((goal, i) => (
              <GoalRow key={goal.id} goal={goal} onToggle={handleToggle} isLast={i === goals.length - 1} />
            ))
          )}
        </View>

        {/* ── AI Insight (Pro teaser) ── */}
        <Pressable onPress={() => openProUpgrade(navigation, 'home')}>
          <LinearGradient
            colors={gradients.ai}
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
      </Animated.ScrollView>

      <ConfettiBurst ref={confettiRef} />
      <XPGainFloat ref={xpFloatRef} bottom={160} />
      <LevelUpModal ref={levelUpRef} />
      <StreakBumpCard ref={streakBumpRef} />
    </View>
  );
}

const CARD_R = radii.card;

const s = StyleSheet.create({
  // ── Root ── unified bg
  root: { flex: 1, backgroundColor: calm.bg },
  rootDark: { backgroundColor: darkPalette.bg },
  surfaceDark: { backgroundColor: darkPalette.surface, borderColor: darkPalette.border },
  surfaceGreenDark: { backgroundColor: darkPalette.primarySoft },
  textDark: { color: darkPalette.text },
  mutedTextDark: { color: darkPalette.textMuted },
  accentTextDark: { color: darkPalette.primary },
  borderDark: { borderBottomColor: darkPalette.divider },
  trackDark: { backgroundColor: darkPalette.surfaceSunken },

  // Avatar with coral ring glow
  avatarBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.55)',
  },
  avatarInitial: {
    fontFamily: fonts.display,
    fontSize: fontSizes.lg,
    color: '#FFFFFF',
  },
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
    backgroundColor: calm.amber,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: calm.forest,
  },
  bellBadgeText: { fontFamily: fonts.bodyBold, fontSize: 9, color: '#FFFFFF' },

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
    color: calm.forest,
    marginTop: spacing.sm,
  },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  sectionMeta: { fontFamily: fonts.bodyBold, fontSize: fontSizes.xs, color: colors.inkFaint },

  // Activities card
  activitiesCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: CARD_R,
    borderWidth: 1,
    borderColor: calm.border,
    overflow: 'hidden',
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
    backgroundColor: colors.sage,
    alignItems: 'center', justifyContent: 'center',
  },

  badgeBleed: { marginHorizontal: -spacing.lg },

  // Quick actions 2x2
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  quickCard: {
    width: (SW - spacing.lg * 2 - spacing.md) / 2,
    borderRadius: CARD_R + 2,
    overflow: 'hidden',
    ...shadow.coralGlow, // shadowColor overridden per-action inline (see QuickActionCard)
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
    borderWidth: 1,
    borderColor: calm.border,
    padding: spacing.lg,
    ...shadow.sm,
  },
  treeTop: {
    flexDirection: 'row', gap: spacing.md,
    alignItems: 'center', marginBottom: spacing.md,
  },
  treeArt: {
    width: 88,
    height: 88,
    borderRadius: 22,
    backgroundColor: calm.mintBg,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
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
    backgroundColor: calm.mintBg,
    borderRadius: radii.pill,
    paddingVertical: 12,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  treeBtnDark: {
    backgroundColor: darkPalette.primarySoft,
    borderWidth: 1,
    borderColor: darkPalette.border,
  },
  treeBtnText: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.sm,
    color: calm.primary,
  },

  // Goals card
  goalsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: CARD_R,
    borderWidth: 1,
    borderColor: calm.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: 4,
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
    ...shadow.lavenderGlow,
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
