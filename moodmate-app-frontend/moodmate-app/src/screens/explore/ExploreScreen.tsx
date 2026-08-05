import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, Pressable, StyleSheet, ScrollView, Animated, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainTabParamList, RootStackParamList } from '@/navigation/types';
import { ProgressBar } from '@/components/ProgressBar';
import { WaveformVisualizer } from '@/components/WaveformVisualizer';
import { useToast } from '@/state/useToast';
import { useMusicStore } from '@/state/useMusicStore';
import { usePaymentsStore } from '@/state/usePaymentsStore';
import { useAuthStore } from '@/state/useAuthStore';
import { MUSIC_TRACKS } from '@/data/musicTracks';
import { hapticLight } from '@/utils/haptics';
import { colors, darkPalette, fonts, fontSizes, radii, spacing, shadow, accents, calm } from '@/theme/tokens';
import { HeroHeader } from '@/components/HeroHeader';
import { LiquidBackground } from '@/components/LiquidBackground';
import { useHideTabBarOnScroll } from '@/hooks/useHideTabBarOnScroll';
import { useResolvedAppearance } from '@/hooks/useResolvedAppearance';
import { openProUpgrade } from '@/utils/openProUpgrade';

const { width: SW } = Dimensions.get('window');
const TOOL_W = SW * 0.58;
const FOREST_GRAD = [calm.forest, calm.forest] as const;

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Explore'>,
  NativeStackScreenProps<RootStackParamList>
>;

// Each tool draws its tile color from the shared semantic accent table (tokens.ts) rather than
// a one-off hex — keeps every tile visually distinct while staying within the app's curated
// content palette (see the "content colors" rule in tokens.ts's `accents` comment).
const SESSIONS = [
  { icon: 'body-outline',    name: 'Body scan',         time: '8 min', from: accents.creativity.accent, to: accents.creativity.pressed, duration: 480 },
  { icon: 'leaf-outline',    name: 'Anxiety release',  time: '6 min', from: accents.anxiety.accent, to: accents.anxiety.pressed, duration: 360 },
  { icon: 'sunny-outline',   name: 'Morning intention', time: '5 min', from: accents.energy.accent, to: accents.energy.pressed, duration: 300 },
];

const GAMES = [
  { icon: 'ellipse-outline',    name: 'Bubble Pop',      sub: 'Tap away your stress',     tag: 'Game',          from: accents.focus.accent, to: accents.focus.pressed, key: 'BubblePop' },
  { icon: 'hand-left-outline',  name: 'Grounding',       sub: '5-4-3-2-1 technique',      tag: 'Technique',     from: accents.wellness.accent, to: accents.wellness.pressed, key: 'Grounding' },
  { icon: 'leaf-outline',       name: 'Breathe',         sub: 'Guided breathing reset',    tag: 'Breathing',     from: accents.calm.accent, to: accents.calm.pressed, key: 'BreathingSession' },
  { icon: 'lock-closed-outline',name: 'Worry Box',       sub: 'Lock your worries away',    tag: 'Journaling',    from: accents.learning.accent, to: accents.learning.pressed, key: 'WorryBox' },
  { icon: 'image-outline',      name: 'Safe Place',      sub: 'Guided visualization',      tag: 'Visualization', from: accents.sleep.accent, to: accents.sleep.pressed, key: 'SafePlace' },
  { icon: 'flower-outline',     name: 'Proud Dandelion', sub: 'Celebrate your wins',       tag: 'Celebration',   from: accents.gratitude.accent, to: accents.gratitude.pressed, key: 'ProudDandelion' },
];

const AFFIRMATIONS = [
  "You are doing better than you think.",
  "It's okay to rest. Growth doesn't stop when you pause.",
  "You don't have to have it all figured out today.",
  "Your feelings are valid. Every single one.",
  "Small steps still move you forward.",
  "You are enough, exactly as you are right now.",
  "This moment is temporary. You are resilient.",
];

const STRETCH_STEPS = [
  { name: 'Neck rolls',      cue: 'Slowly roll your head in a circle, 3× each direction.', duration: 30 },
  { name: 'Shoulder shrugs', cue: 'Lift shoulders to ears, hold 3s, release. Repeat 5×.', duration: 25 },
  { name: 'Chest opener',    cue: 'Clasp hands behind your back, open chest, hold 20s.',   duration: 25 },
  { name: 'Wrist circles',   cue: 'Extend arms and rotate wrists both directions, 5×.',    duration: 20 },
  { name: 'Forward fold',    cue: 'Stand, feet hip-width apart. Fold forward gently for 30s.', duration: 35 },
];

const TIMER_OPTIONS = [
  { label: '15 min', value: 15 },
  { label: '30 min', value: 30 },
  { label: '45 min', value: 45 },
  { label: '60 min', value: 60 },
];

// ── Animated tool card with spring press ─────────────────────────────────────
function ToolCard({ tool, onPress }: {
  tool: typeof GAMES[number];
  onPress: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const pressIn  = () => Animated.spring(scale, { toValue: 0.93, speed: 60, bounciness: 0, useNativeDriver: true }).start();
  const pressOut = () => Animated.spring(scale, { toValue: 1,    speed: 30, bounciness: 8, useNativeDriver: true }).start();

  return (
    <Animated.View style={[s.toolCardWrap, { transform: [{ scale }] }]}>
      <Pressable onPressIn={pressIn} onPressOut={pressOut} onPress={onPress} style={{ flex: 1 }}>
        <LinearGradient
          colors={[tool.from, tool.to]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={s.toolCard}
        >
          {/* Tag chip */}
          <View style={s.toolTag}>
            <Text style={s.toolTagText}>{tool.tag}</Text>
          </View>
          {/* Icon */}
          <View style={s.toolIconWrap}><Ionicons name={tool.icon as any} size={44} color="rgba(255,255,255,0.95)" /></View>
          {/* Info */}
          <Text style={s.toolName}>{tool.name}</Text>
          <Text style={s.toolSub}>{tool.sub}</Text>
          {/* Arrow */}
          <Ionicons name="arrow-forward" size={20} color="rgba(255,255,255,0.75)" style={{ alignSelf: 'flex-end', marginTop: spacing.sm }} />
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

export function ExploreScreen({ navigation }: Props) {
  const toast = useToast();
  const { isDark } = useResolvedAppearance();
  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;
  const handleTabAwareScroll = useHideTabBarOnScroll();

  // Music store
  const { currentTrackId, isPlaying, timerMinutes, play, pause, resume, stop, setTimer, toggleFavorite, isFavorite } = useMusicStore();
  const [musicFilter, setMusicFilter] = useState<'all' | 'favorites'>('all');

  // Premium gating breadth (Milestone item 7) - "Full meditation & soundscape library" is a
  // Pro perk; free users get the 4 tracks tagged proOnly:false in musicTracks.ts. Loads fresh
  // subscription state on mount since ProScreen is the only other place that loads it.
  const token = useAuthStore((s) => s.token);
  const isPro = usePaymentsStore((s) => s.subscription.pro);
  const loadPayments = usePaymentsStore((s) => s.load);
  useEffect(() => {
    if (token && token !== 'guest') loadPayments(token);
  }, [token, loadPayments]);

  // Stretch break
  const [stretchStep, setStretchStep]     = useState(0);
  const [stretchActive, setStretchActive] = useState(false);
  const [stretchSecsLeft, setStretchSecsLeft] = useState(0);
  const stretchTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86_400_000
  );
  const affirmation = AFFIRMATIONS[dayOfYear % AFFIRMATIONS.length];

  const handleMusicPress = (trackId: string) => {
    const track = MUSIC_TRACKS.find((t) => t.id === trackId);
    if (track?.proOnly && !isPro) {
      toast('This track is Pro-exclusive. Upgrade to unlock the full library.');
      openProUpgrade(navigation, 'music-track');
      return;
    }
    hapticLight();
    if (currentTrackId === trackId) {
      // Same track — toggle play/pause
      isPlaying ? pause() : resume();
    } else {
      play(trackId);
    }
  };

  const handleStop = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    stop();
  };

  const handleTimer = (minutes: number) => {
    hapticLight();
    setTimer(timerMinutes === minutes ? 0 : minutes);
  };

  const startStretch = () => {
    setStretchStep(0);
    setStretchActive(true);
    setStretchSecsLeft(STRETCH_STEPS[0].duration);
    stretchTimer.current = setInterval(() => {
      setStretchSecsLeft((prev) => {
        if (prev <= 1) {
          setStretchStep((step) => {
            const next = step + 1;
            if (next >= STRETCH_STEPS.length) {
              clearInterval(stretchTimer.current!);
              setStretchActive(false);
              toast('Stretch break complete!');
              return 0;
            }
            setStretchSecsLeft(STRETCH_STEPS[next].duration);
            return next;
          });
          return STRETCH_STEPS[0].duration;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleGame = (key: string) => {
    hapticLight();
    if (key === 'BubblePop')             navigation.navigate('BubblePop');
    else if (key === 'Grounding')        navigation.navigate('Grounding');
    else if (key === 'BreathingSession') navigation.navigate('BreathingSession', { session: 'Breathing Reset', duration: 120 });
    else if (key === 'WorryBox')         navigation.navigate('WorryBox');
    else if (key === 'SafePlace')        navigation.navigate('SafePlace');
    else if (key === 'ProudDandelion')   navigation.navigate('ProudDandelion');
  };

  const step = STRETCH_STEPS[stretchStep];

  return (
    <View style={[s.root, isDark && s.rootDark]}>
      <HeroHeader
        gradient={FOREST_GRAD}
        title="Explore"
        subtitle="Music · Mindfulness · Games"
        scrollY={scrollY}
        stats={[
          {
            key: 'tools',
            icon: <Ionicons name="sparkles" size={12} color={calm.mint} />,
            value: GAMES.length,
            label: 'tools',
          },
          {
            key: 'tracks',
            icon: <Ionicons name="musical-notes" size={12} color={calm.mint} />,
            value: MUSIC_TRACKS.length,
            label: 'tracks',
          },
        ]}
      >
        <View style={s.affirmCard}>
          <Ionicons name="sunny-outline" size={16} color="rgba(255,255,255,0.9)" style={{ marginTop: 2 }} />
          <Text style={s.affirmText}>{affirmation}</Text>
        </View>
      </HeroHeader>

      <View style={s.body}>
        <LiquidBackground preset="wellness" opacityScale={isDark ? 0.14 : 0.45} />
        <Animated.ScrollView
          style={s.scroll}
          contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 180 }]}
          showsVerticalScrollIndicator={false}
          scrollEventThrottle={16}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: true, listener: handleTabAwareScroll },
          )}
        >
        {/* ── Curated Music ── */}
        <View style={s.musicHeader}>
          <View style={s.musicTitleRow}><Ionicons name="musical-notes-outline" size={16} color={isDark ? darkPalette.primary : calm.forest} /><Text style={[s.sectionTitle, isDark && s.textDark, { marginLeft: 6 }]}>Curated Music</Text></View>
          <View style={s.filterRow}>
            {(['all', 'favorites'] as const).map((f) => (
              <Pressable key={f} style={[s.filterPill, isDark && s.filterPillDark, musicFilter === f && s.filterPillActive]} onPress={() => setMusicFilter(f)}>
                {f === 'favorites' && <Ionicons name="heart" size={11} color={musicFilter === f ? '#FFFFFF' : isDark ? darkPalette.textMuted : calm.muted} style={{ marginRight: 3 }} />}
                <Text style={[s.filterPillTxt, isDark && s.mutedTextDark, musicFilter === f && s.filterPillTxtActive]}>{f === 'all' ? 'All' : 'Favorites'}</Text>
              </Pressable>
            ))}
          </View>
          {currentTrackId && (
            <Pressable style={s.stopAllBtn} onPress={handleStop}>
              <Ionicons name="stop-circle" size={14} color={colors.error} />
              <Text style={s.stopAllTxt}>Stop</Text>
            </Pressable>
          )}
        </View>

        {/* Sleep timer chips (only shown when a track is active) */}
        {currentTrackId && (
          <View style={s.timerRow}>
            <Text style={[s.timerLabel, isDark && s.mutedTextDark]}>Sleep timer:</Text>
            {TIMER_OPTIONS.map((opt) => (
              <Pressable
                key={opt.value}
                style={[s.timerChip, isDark && s.timerChipDark, timerMinutes === opt.value && s.timerChipActive]}
                onPress={() => handleTimer(opt.value)}
              >
                <Text style={[s.timerChipTxt, isDark && s.mutedTextDark, timerMinutes === opt.value && s.timerChipTxtActive]}>
                  {opt.label}
                </Text>
              </Pressable>
            ))}
          </View>
        )}

        {/* Track cards */}
        <View style={s.trackGrid}>
          {MUSIC_TRACKS.filter((t) => musicFilter === 'all' || isFavorite(t.id)).map((track) => {
            const active = currentTrackId === track.id;
            const playing = active && isPlaying;
            return (
              <Pressable
                key={track.id}
                style={[s.trackCard, isDark && s.surfaceDark, active && { borderColor: track.color, borderWidth: 2 }]}
                onPress={() => handleMusicPress(track.id)}
              >
                {/* Cover */}
                <View style={[s.trackCover, { backgroundColor: active ? track.color + '28' : track.color + '14' }]}>
                  <Ionicons
                    name={
                      track.genre.includes('Sleep') ? 'moon' :
                      track.genre.includes('Focus') || track.genre.includes('ADHD') ? 'bulb' :
                      track.genre.includes('Meditat') ? 'infinite' :
                      track.genre.includes('Noise') ? 'radio' :
                      track.genre.includes('Rain') || track.genre.includes('Nature') ? 'leaf' :
                      track.genre.includes('Morning') ? 'sunny' :
                      'musical-note'
                    }
                    size={20}
                    color={active ? track.color : track.color + 'AA'}
                  />
                </View>
                {/* Info */}
                <View style={s.trackInfo}>
                  <Text style={[s.trackName, isDark && s.textDark, active && { color: track.color }]} numberOfLines={1}>
                    {track.name}
                  </Text>
                  <Text style={[s.trackGenre, isDark && s.mutedTextDark]} numberOfLines={1}>{track.genre}</Text>
                  {active && (
                    <WaveformVisualizer
                      isPlaying={playing}
                      color={track.color}
                      barCount={6}
                      height={14}
                    />
                  )}
                </View>
                {/* Play/pause button - Premium gating breadth: locked tracks show a lock icon
                    instead of play/pause, tapping still routes through handleMusicPress's Pro
                    check above. */}
                <Pressable
                  style={[s.playBtn, { backgroundColor: track.proOnly && !isPro ? colors.sunSoft : active ? track.color : isDark ? darkPalette.surfaceSunken : colors.line }]}
                  onPress={() => handleMusicPress(track.id)}
                  hitSlop={6}
                >
                  {track.proOnly && !isPro ? (
                    <Ionicons name="lock-closed" size={12} color={colors.sun} />
                  ) : (
                    <Ionicons name={playing ? 'pause' : 'play'} size={14} color={active ? '#FFFFFF' : isDark ? darkPalette.textMuted : calm.muted} style={playing ? undefined : { marginLeft: 2 }} />
                  )}
                </Pressable>
                <Pressable style={s.heartBtn} onPress={() => toggleFavorite(track.id)} hitSlop={8}>
                  <Ionicons name={isFavorite(track.id) ? 'heart' : 'heart-outline'} size={18} color={isFavorite(track.id) ? calm.terracotta : calm.faint} />
                </Pressable>
              </Pressable>
            );
          })}
        </View>

        {/* ── Mindfulness sessions ── */}
        <Text style={[s.sectionTitle, isDark && s.textDark, { marginTop: spacing.lg }]}>Mindfulness sessions</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.hRow}>
          {SESSIONS.map((sess) => (
            <Pressable
              key={sess.name}
              style={s.sessionCardWrap}
              onPress={() => navigation.navigate('BreathingSession', { session: sess.name, duration: sess.duration })}
            >
              <LinearGradient
                colors={[sess.from, sess.to]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={s.sessionCard}
              >
                <Ionicons name={sess.icon as any} size={30} color="#FFFFFF" />
                <Text style={s.sessionName}>{sess.name}</Text>
                <View style={s.sessionTimePill}>
                  <Text style={s.sessionTime}>{sess.time}</Text>
                </View>
              </LinearGradient>
            </Pressable>
          ))}
        </ScrollView>

        {/* ── Stress relief tools ── */}
        <View style={s.toolsHeader}>
          <Text style={[s.sectionTitle, isDark && s.textDark]}>Stress relief tools</Text>
          <Text style={[s.toolsCount, isDark && s.mutedTextDark]}>{GAMES.length} tools</Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          decelerationRate="fast"
          snapToInterval={TOOL_W + spacing.md}
          snapToAlignment="start"
          contentContainerStyle={s.toolsRow}
        >
          {GAMES.map((g) => (
            <ToolCard key={g.key} tool={g} onPress={() => handleGame(g.key)} />
          ))}
        </ScrollView>


        {/* ── Wellness Library banner ── */}
        <Pressable onPress={() => navigation.navigate('Resources')} style={s.libBanner}>
          <LinearGradient colors={[calm.primaryDeep, calm.primary]}
            style={s.libGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            <View style={s.libLeft}>
              <View style={s.libIconWrap}><Ionicons name="library" size={22} color="#FFFFFF" /></View>
              <View>
                <Text style={s.libTitle}>Wellness Library</Text>
                <Text style={s.libSub}>18 curated articles · 6 topics</Text>
              </View>
            </View>
            <Ionicons name="arrow-forward-circle" size={28} color="rgba(255,255,255,0.85)" />
          </LinearGradient>
        </Pressable>



        <Pressable onPress={() => navigation.navigate('StoryPacks')} style={s.libBanner}>
          <LinearGradient colors={[accents.sleep.pressed, accents.sleep.accent]} style={s.libGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            <View style={s.libLeft}>
              <View style={s.libIconWrap}><Ionicons name="moon" size={22} color="#FFFFFF" /></View>
              <View>
                <Text style={s.libTitle}>Story Packs</Text>
                <Text style={s.libSub}>Original bedtime and hope stories</Text>
              </View>
            </View>
            <Ionicons name="arrow-forward-circle" size={28} color="rgba(255,255,255,0.85)" />
          </LinearGradient>
        </Pressable>

        {/* ── Wellness Hub banner ── */}
        {/* Bug fix (audit) - HubScreen (admin-curated articles + RSVP events, backed by the real
            Hub API) was fully built and wired into RootNavigator but had no entry point anywhere
            in the app, making it unreachable. This banner closes that gap. */}
        <Pressable onPress={() => navigation.navigate('Hub')} style={s.libBanner}>
          <LinearGradient colors={[accents.wellness.pressed, accents.wellness.accent]}
            style={s.libGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            <View style={s.libLeft}>
              <View style={s.libIconWrap}><Ionicons name="newspaper" size={22} color="#fff" /></View>
              <View>
                <Text style={s.libTitle}>Wellness Hub</Text>
                <Text style={s.libSub}>Campus articles & events</Text>
              </View>
            </View>
            <Ionicons name="arrow-forward-circle" size={28} color="rgba(255,255,255,0.85)" />
          </LinearGradient>
        </Pressable>

        {/* ── Therapeutic Tools ── */}
        <Text style={[s.sectionTitle, isDark && s.textDark]}>Therapeutic tools</Text>
        <View style={s.therapyRow}>
          <Pressable
            style={[s.therapyCard, { backgroundColor: isDark ? darkPalette.surface : accents.learning.soft }, isDark && s.surfaceDark]}
            onPress={() => navigation.navigate('ThoughtDiary')}
          >
            <View style={[s.therapyIconWrap, { backgroundColor: accents.learning.border }]}><Ionicons name="bulb" size={20} color={accents.learning.pressed} /></View>
            <Text style={[s.therapyName, isDark && s.textDark]}>Thought Diary</Text>
            <Text style={[s.therapySub, isDark && s.mutedTextDark]}>CBT thought record in 5 steps</Text>
            <View style={[s.therapyTag, { backgroundColor: accents.learning.border }]}><Text style={[s.therapyTagTxt, { color: accents.learning.pressed }]}>CBT</Text></View>
          </Pressable>

          <Pressable
            style={[s.therapyCard, { backgroundColor: isDark ? darkPalette.surface : accents.wellness.soft }, isDark && s.surfaceDark]}
            onPress={() => navigation.navigate('HabitTracker')}
          >
            <View style={[s.therapyIconWrap, { backgroundColor: accents.wellness.border }]}><Ionicons name="checkmark-circle" size={20} color={accents.wellness.pressed} /></View>
            <Text style={[s.therapyName, isDark && s.textDark]}>Habit Tracker</Text>
            <Text style={[s.therapySub, isDark && s.mutedTextDark]}>Build daily streaks & routines</Text>
            <View style={[s.therapyTag, { backgroundColor: accents.wellness.border }]}><Text style={[s.therapyTagTxt, { color: accents.wellness.pressed }]}>Habits</Text></View>
          </Pressable>

          <Pressable
            style={[s.therapyCard, { backgroundColor: isDark ? darkPalette.surface : accents.sleep.soft }, isDark && s.surfaceDark]}
            onPress={() => navigation.navigate('SleepTracker')}
          >
            <View style={[s.therapyIconWrap, { backgroundColor: accents.sleep.border }]}><Ionicons name="moon" size={20} color={accents.sleep.pressed} /></View>
            <Text style={[s.therapyName, isDark && s.textDark]}>Sleep Tracker</Text>
            <Text style={[s.therapySub, isDark && s.mutedTextDark]}>Log sleep & spot patterns</Text>
            <View style={[s.therapyTag, { backgroundColor: accents.sleep.border }]}><Text style={[s.therapyTagTxt, { color: accents.sleep.pressed }]}>Sleep</Text></View>
          </Pressable>
        </View>

                {/* ── Desk stretch break ── */}
        <Text style={[s.sectionTitle, isDark && s.textDark]}>Desk stretch break</Text>
        <View style={[s.stretchCard, isDark && s.surfaceDark]}>
          {stretchActive ? (
            <>
              <View style={s.stretchProgress}>
                <Text style={[s.stretchStepLabel, isDark && s.mutedTextDark]}>Step {stretchStep + 1}/{STRETCH_STEPS.length}</Text>
                <Text style={s.stretchTimer}>{stretchSecsLeft}s</Text>
              </View>
              <ProgressBar
                progress={(STRETCH_STEPS[stretchStep].duration - stretchSecsLeft) / STRETCH_STEPS[stretchStep].duration}
                fillColor={calm.primary}
              />
              <Text style={[s.stretchName, isDark && s.textDark]}>{step.name}</Text>
              <Text style={[s.stretchCue, isDark && s.mutedTextDark]}>{step.cue}</Text>
            </>
          ) : (
            <>
              <Ionicons name="body-outline" size={48} color={calm.primary} />
              <Text style={[s.stretchIdleTitle, isDark && s.textDark]}>5-step desk stretch</Text>
              <Text style={[s.stretchIdleSub, isDark && s.mutedTextDark]}>A guided ~2 minute break for your body</Text>
              <Pressable style={s.stretchStartBtn} onPress={startStretch}>
                <Text style={s.stretchStartTxt}>Start stretch</Text>
              </Pressable>
            </>
          )}
        </View>
      </Animated.ScrollView>
      </View>
    </View>
  );
}

const CARD_R = radii.xl;
const GAME_W = (SW - spacing.lg * 2 - spacing.md) / 3;

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: calm.bg },
  rootDark: { backgroundColor: darkPalette.bg },
  body: { flex: 1 },

  affirmCard: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: CARD_R,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    marginTop: spacing.md,
  },
  affirmText: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.sm,
    color: 'rgba(255,255,255,0.9)',
    flex: 1,
    lineHeight: 20,
  },

  scroll: { flex: 1 },
  content: { padding: spacing.lg, gap: spacing.md },

  sectionTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.md,
    color: calm.forest,
    marginTop: spacing.xs,
  },

  // Music header row
  musicHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  musicTitleRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.xs },
  stopAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.errorSoft,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: radii.pill,
  },
  stopAllTxt: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.xs,
    color: colors.error,
  },

  // Sleep timer
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
    marginTop: -4,
  },
  timerLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.xs,
    color: calm.faint,
  },
  timerChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: calm.border,
  },
  timerChipDark: {
    backgroundColor: darkPalette.surfaceSunken,
    borderColor: darkPalette.border,
  },
  timerChipActive: {
    backgroundColor: calm.forest,
    borderColor: calm.forest,
  },
  timerChipTxt: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    color: calm.muted,
  },
  timerChipTxtActive: { color: '#FFFFFF' },

  // Track cards
  trackGrid: { gap: spacing.sm },
  trackCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: 12,
    gap: 12,
    borderWidth: 1.5,
    borderColor: 'transparent',
    ...shadow.sm,
  },
  trackCover: {
    width: 48,
    height: 48,
    borderRadius: radii.md,
    backgroundColor: calm.mintBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trackInfo: { flex: 1, gap: 3, minWidth: 0 },
  trackName: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.sm,
    color: calm.forest,
  },
  trackGenre: {
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
    color: calm.muted,
  },
  playBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Sessions
  hRow: { gap: spacing.md, paddingBottom: 4 },
  sessionCardWrap: {
    width: 140,
    borderRadius: CARD_R,
    overflow: 'hidden',
    ...shadow.sm,
  },
  sessionCard: {
    padding: spacing.lg,
    paddingVertical: spacing.xl,
    gap: spacing.sm,
    alignItems: 'flex-start',
  },
  sessionName: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.sm,
    color: '#FFFFFF',
  },
  sessionTimePill: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.pill,
  },
  sessionTime: {
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    color: '#FFFFFF',
  },

  // Stress relief tools carousel
  toolsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  toolsCount: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.xs,
    color: calm.faint,
  },
  toolsRow: {
    gap: spacing.md,
    paddingBottom: 6,
    paddingRight: spacing.lg,
  },
  toolCardWrap: {
    width: TOOL_W,
    height: 220,
    borderRadius: CARD_R + 4,
    overflow: 'hidden',
    ...shadow.md,
  },
  toolCard: {
    flex: 1,
    padding: spacing.lg,
    paddingBottom: spacing.md,
    justifyContent: 'flex-end',
    gap: 4,
  },
  toolTag: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    backgroundColor: 'rgba(255,255,255,0.22)',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: radii.pill,
  },
  toolTagText: {
    fontFamily: fonts.bodyBold,
    fontSize: 9,
    color: '#FFFFFF',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  toolIconWrap: { position: 'absolute', top: spacing.xl, left: spacing.lg },
  toolName: {
    fontFamily: fonts.display,
    fontSize: fontSizes.lg,
    color: '#FFFFFF',
  },
  toolSub: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.sm,
    color: 'rgba(255,255,255,0.82)',
    lineHeight: 18,
  },

  // Stretch
  stretchCard: {
    backgroundColor: colors.surface,
    borderRadius: CARD_R,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: calm.border,
    ...shadow.sm,
  },
  stretchIdleTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.md,
    color: calm.forest,
  },
  stretchIdleSub: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.sm,
    color: calm.muted,
    textAlign: 'center',
  },
  stretchStartBtn: {
    backgroundColor: calm.primary,
    paddingHorizontal: spacing.xxl,
    paddingVertical: 12,
    borderRadius: radii.pill,
    marginTop: 4,
  },
  stretchStartTxt: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.base,
    color: '#FFFFFF',
  },
  stretchProgress: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  stretchStepLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.sm,
    color: calm.muted,
  },
  stretchTimer: {
    fontFamily: fonts.display,
    fontSize: fontSizes.lg,
    color: calm.primary,
  },
  stretchName: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.md,
    color: calm.forest,
    alignSelf: 'flex-start',
  },
  stretchCue: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.sm,
    color: calm.muted,
    alignSelf: 'flex-start',
    lineHeight: 20,
  },
  libBanner: {
    marginTop: spacing.md,
    marginBottom: 4,
    borderRadius: radii.xl,
    overflow: 'hidden',
    ...shadow.md,
  },
  libGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  libLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  libIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  libTitle: { fontFamily: fonts.bodyBold, fontSize: fontSizes.md, color: '#FFFFFF' },
  libSub: { fontFamily: fonts.body, fontSize: fontSizes.sm, color: 'rgba(255,255,255,0.75)', marginTop: 2 },

  therapyRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg, flexWrap: 'wrap' },
  therapyCard: {
    flex: 1, minWidth: 100, borderRadius: 16, padding: spacing.md,
    alignItems: 'flex-start', gap: 4,
  },
  therapyIconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  filterRow: { flexDirection: 'row', gap: 8, marginBottom: 10, marginTop: 2 },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: calm.trackAlt,
    borderWidth: 1,
    borderColor: calm.border,
  },
  filterPillDark: {
    backgroundColor: darkPalette.surfaceSunken,
    borderColor: darkPalette.border,
  },
  filterPillActive: { backgroundColor: calm.forest, borderColor: calm.forest },
  filterPillTxt: { fontFamily: fonts.bodyMedium, fontSize: 12, color: calm.muted },
  filterPillTxtActive: { color: '#FFFFFF' },
  heartBtn: { marginLeft: 6, padding: 4 },
  therapyName: { fontFamily: fonts.bodyBold, fontSize: fontSizes.sm, color: calm.forest },
  therapySub: { fontFamily: fonts.bodyMedium, fontSize: 11, color: calm.muted, lineHeight: 15 },
  therapyTag: { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, marginTop: 4 },
  therapyTagTxt: { fontFamily: fonts.bodyBold, fontSize: 10 },
  surfaceDark: {
    backgroundColor: darkPalette.surface,
    borderColor: darkPalette.border,
  },
  textDark: { color: darkPalette.text },
  mutedTextDark: { color: darkPalette.textMuted },
});
