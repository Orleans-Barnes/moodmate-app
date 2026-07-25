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
import { MUSIC_TRACKS } from '@/data/musicTracks';
import { hapticLight } from '@/utils/haptics';
import { colors, fonts, fontSizes, radii, spacing, shadow } from '@/theme/tokens';

const { width: SW } = Dimensions.get('window');
const TOOL_W = SW * 0.58;

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Explore'>,
  NativeStackScreenProps<RootStackParamList>
>;

const SESSIONS = [
  { icon: 'body-outline',    name: 'Body scan',         time: '8 min', from: '#2A5C45', to: '#3D7A5C', duration: 480 },
  { icon: 'leaf-outline',    name: 'Anxiety release',  time: '6 min', from: '#3D7A5C', to: '#5F9E7C', duration: 360 },
  { icon: 'sunny-outline',   name: 'Morning intention', time: '5 min', from: '#D4A017', to: '#B8860B', duration: 300 },
];

const GAMES = [
  { icon: 'ellipse-outline',    name: 'Bubble Pop',      sub: 'Tap away your stress',     tag: 'Game',          from: '#5C8AE6', to: '#3B6FD4', key: 'BubblePop' },
  { icon: 'hand-left-outline',  name: 'Grounding',       sub: '5-4-3-2-1 technique',      tag: 'Technique',     from: '#5F9E7C', to: '#3D7A5A', key: 'Grounding' },
  { icon: 'leaf-outline',       name: 'Breathe',         sub: 'Guided breathing reset',    tag: 'Breathing',     from: '#FF6F4D', to: '#E04A28', key: 'BreathingSession' },
  { icon: 'lock-closed-outline',name: 'Worry Box',       sub: 'Lock your worries away',    tag: 'Journaling',    from: '#2A7A72', to: '#145C54', key: 'WorryBox' },
  { icon: 'image-outline',      name: 'Safe Place',      sub: 'Guided visualization',      tag: 'Visualization', from: '#4A90C4', to: '#1E5F8A', key: 'SafePlace' },
  { icon: 'flower-outline',     name: 'Proud Dandelion', sub: 'Celebrate your wins',       tag: 'Celebration',   from: '#6B9E3A', to: '#3D6B14', key: 'ProudDandelion' },
];

const AFFIRMATIONS = [
  "You are doing better than you think. 💚",
  "It's okay to rest. Growth doesn't stop when you pause.",
  "You don't have to have it all figured out today.",
  "Your feelings are valid. Every single one.",
  "Small steps still move you forward. 🌿",
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
          <Text style={s.toolArrow}>→</Text>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

export function ExploreScreen({ navigation }: Props) {
  const toast = useToast();
  const insets = useSafeAreaInsets();

  // Music store
  const { currentTrackId, isPlaying, timerMinutes, play, pause, resume, stop, setTimer, toggleFavorite, isFavorite } = useMusicStore();
  const [musicFilter, setMusicFilter] = useState<'all' | 'favorites'>('all');

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
              toast('Stretch break complete! 🎉');
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
    <View style={s.root}>
      {/* ── Header ── */}
      <LinearGradient
        colors={['#1E3D2F', '#2A5C45', '#3D7A5C']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[s.header, { paddingTop: insets.top + spacing.md }]}
      >
        <Text style={s.headerTitle}>Explore</Text>
        <Text style={s.headerSub}>Music · Mindfulness · Games</Text>
        <View style={s.affirmCard}>
          <Ionicons name="sparkles" size={16} color="rgba(255,255,255,0.9)" style={{ marginTop: 2 }} />
          <Text style={s.affirmText}>{affirmation}</Text>
        </View>
      </LinearGradient>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 180 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Curated Music ── */}
        <View style={s.musicHeader}>
          <View style={s.musicTitleRow}><Ionicons name="musical-notes-outline" size={16} color={colors.ink} /><Text style={[s.sectionTitle, { marginLeft: 6 }]}>Curated Music</Text></View>
          <View style={s.filterRow}>
            {(['all', 'favorites'] as const).map((f) => (
              <Pressable key={f} style={[s.filterPill, musicFilter === f && s.filterPillActive]} onPress={() => setMusicFilter(f)}>
                {f === 'favorites' && <Ionicons name="heart" size={11} color={musicFilter === f ? '#fff' : '#888'} style={{ marginRight: 3 }} />}
                <Text style={[s.filterPillTxt, musicFilter === f && s.filterPillTxtActive]}>{f === 'all' ? 'All' : 'Favorites'}</Text>
              </Pressable>
            ))}
          </View>
          {currentTrackId && (
            <Pressable style={s.stopAllBtn} onPress={handleStop}>
              <Ionicons name="stop-circle" size={14} color="#EF4444" />
              <Text style={s.stopAllTxt}>Stop</Text>
            </Pressable>
          )}
        </View>

        {/* Sleep timer chips (only shown when a track is active) */}
        {currentTrackId && (
          <View style={s.timerRow}>
            <Text style={s.timerLabel}>Sleep timer:</Text>
            {TIMER_OPTIONS.map((opt) => (
              <Pressable
                key={opt.value}
                style={[s.timerChip, timerMinutes === opt.value && s.timerChipActive]}
                onPress={() => handleTimer(opt.value)}
              >
                <Text style={[s.timerChipTxt, timerMinutes === opt.value && s.timerChipTxtActive]}>
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
                style={[s.trackCard, active && { borderColor: track.color, borderWidth: 2 }]}
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
                  <Text style={[s.trackName, active && { color: track.color }]} numberOfLines={1}>
                    {track.name}
                  </Text>
                  <Text style={s.trackGenre} numberOfLines={1}>{track.genre}</Text>
                  {active && (
                    <WaveformVisualizer
                      isPlaying={playing}
                      color={track.color}
                      barCount={6}
                      height={14}
                    />
                  )}
                </View>
                {/* Play/pause button */}
                <Pressable
                  style={[s.playBtn, { backgroundColor: active ? track.color : colors.line }]}
                  onPress={() => handleMusicPress(track.id)}
                  hitSlop={6}
                >
                  <Ionicons name={playing ? 'pause' : 'play'} size={14} color={active ? '#fff' : '#888'} style={playing ? undefined : { marginLeft: 2 }} />
                </Pressable>
                <Pressable style={s.heartBtn} onPress={() => toggleFavorite(track.id)} hitSlop={8}>
                  <Ionicons name={isFavorite(track.id) ? 'heart' : 'heart-outline'} size={18} color={isFavorite(track.id) ? '#F43F5E' : '#aaa'} />
                </Pressable>
              </Pressable>
            );
          })}
        </View>

        {/* ── Mindfulness sessions ── */}
        <Text style={[s.sectionTitle, { marginTop: spacing.lg }]}>Mindfulness sessions</Text>
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
          <Text style={s.sectionTitle}>Stress relief tools</Text>
          <Text style={s.toolsCount}>{GAMES.length} tools</Text>
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
          <LinearGradient colors={['#2A5C45', '#3D7A5C']}
            style={s.libGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            <View style={s.libLeft}>
              <View style={s.libIconWrap}><Ionicons name="library" size={22} color="#fff" /></View>
              <View>
                <Text style={s.libTitle}>Wellness Library</Text>
                <Text style={s.libSub}>18 curated articles · 6 topics</Text>
              </View>
            </View>
            <Ionicons name="arrow-forward-circle" size={28} color="rgba(255,255,255,0.85)" />
          </LinearGradient>
        </Pressable>

        {/* ── Therapeutic Tools ── */}
        <Text style={s.sectionTitle}>Therapeutic tools</Text>
        <View style={s.therapyRow}>
          <Pressable
            style={[s.therapyCard, { backgroundColor: '#EEF2FF' }]}
            onPress={() => navigation.navigate('ThoughtDiary')}
          >
            <View style={[s.therapyIconWrap, { backgroundColor: '#C7D2FE' }]}><Ionicons name="bulb" size={20} color="#4338CA" /></View>
            <Text style={s.therapyName}>Thought Diary</Text>
            <Text style={s.therapySub}>CBT thought record in 5 steps</Text>
            <View style={s.therapyTag}><Text style={s.therapyTagTxt}>CBT</Text></View>
          </Pressable>

          <Pressable
            style={[s.therapyCard, { backgroundColor: '#F0FFF4' }]}
            onPress={() => navigation.navigate('HabitTracker')}
          >
            <View style={[s.therapyIconWrap, { backgroundColor: '#A7F3D0' }]}><Ionicons name="checkmark-circle" size={20} color="#065F46" /></View>
            <Text style={s.therapyName}>Habit Tracker</Text>
            <Text style={s.therapySub}>Build daily streaks & routines</Text>
            <View style={[s.therapyTag, { backgroundColor: '#D1FAE5' }]}><Text style={[s.therapyTagTxt, { color: '#065F46' }]}>Habits</Text></View>
          </Pressable>

          <Pressable
            style={[s.therapyCard, { backgroundColor: '#FFF5F5' }]}
            onPress={() => navigation.navigate('SleepTracker')}
          >
            <View style={[s.therapyIconWrap, { backgroundColor: '#FECACA' }]}><Ionicons name="moon" size={20} color="#991B1B" /></View>
            <Text style={s.therapyName}>Sleep Tracker</Text>
            <Text style={s.therapySub}>Log sleep & spot patterns</Text>
            <View style={[s.therapyTag, { backgroundColor: '#FED7D7' }]}><Text style={[s.therapyTagTxt, { color: '#742A2A' }]}>Sleep</Text></View>
          </Pressable>
        </View>

                {/* ── Desk stretch break ── */}
        <Text style={s.sectionTitle}>Desk stretch break</Text>
        <View style={s.stretchCard}>
          {stretchActive ? (
            <>
              <View style={s.stretchProgress}>
                <Text style={s.stretchStepLabel}>Step {stretchStep + 1}/{STRETCH_STEPS.length}</Text>
                <Text style={s.stretchTimer}>{stretchSecsLeft}s</Text>
              </View>
              <ProgressBar
                progress={(STRETCH_STEPS[stretchStep].duration - stretchSecsLeft) / STRETCH_STEPS[stretchStep].duration}
                fillColor={colors.sage}
              />
              <Text style={s.stretchName}>{step.name}</Text>
              <Text style={s.stretchCue}>{step.cue}</Text>
            </>
          ) : (
            <>
              <Ionicons name="body-outline" size={48} color={colors.sage} />
              <Text style={s.stretchIdleTitle}>5-step desk stretch</Text>
              <Text style={s.stretchIdleSub}>A guided ~2 minute break for your body</Text>
              <Pressable style={s.stretchStartBtn} onPress={startStretch}>
                <Text style={s.stretchStartTxt}>Start stretch</Text>
              </Pressable>
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const CARD_R = 18;
const GAME_W = (SW - spacing.lg * 2 - spacing.md) / 3;

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },

  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  headerTitle: {
    fontFamily: fonts.display,
    fontSize: fontSizes.xl,
    color: '#FFFFFF',
  },
  headerSub: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.xs,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 2,
    marginBottom: spacing.md,
  },
  affirmCard: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: CARD_R,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  affirmIcon: { fontSize: 16, marginTop: 2 },  // unused — now Ionicons
  musicTitleRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.xs },
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
    color: colors.ink,
    marginTop: spacing.xs,
  },

  // Music header row
  musicHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  stopAllBtn: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: radii.pill,
  },
  stopAllTxt: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.xs,
    color: '#EF4444',
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
    color: colors.inkFaint,
  },
  timerChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.pill,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.line,
  },
  timerChipActive: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },
  timerChipTxt: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    color: colors.inkSoft,
  },
  timerChipTxtActive: { color: '#FFFFFF' },

  // Track cards
  trackGrid: { gap: spacing.sm },
  trackCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    gap: 12,
    borderWidth: 1.5,
    borderColor: 'transparent',
    ...shadow.sm,
  },
  trackCover: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trackEmoji: { fontSize: 26 },
  trackInfo: { flex: 1, gap: 3, minWidth: 0 },
  trackName: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.sm,
    color: colors.ink,
  },
  trackGenre: {
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
    color: colors.inkFaint,
  },
  playBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playBtnIcon: {
    fontSize: 14,
    color: '#FFFFFF',
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
  sessionIcon: { fontSize: 28 },
  sessionName: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.sm,
    color: '#FFFFFF',
  },
  sessionTimePill: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
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
    color: colors.inkFaint,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 8,
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
    borderRadius: 20,
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
  toolArrow: {
    fontFamily: fonts.bodyBold,
    fontSize: 20,
    color: 'rgba(255,255,255,0.7)',
    alignSelf: 'flex-end',
    marginTop: spacing.sm,
  },

  // Stretch
  stretchCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: CARD_R,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.md,
    ...shadow.sm,
  },
  stretchIdleIcon: { fontSize: 40 },
  stretchIdleTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.md,
    color: colors.ink,
  },
  stretchIdleSub: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.sm,
    color: colors.inkFaint,
    textAlign: 'center',
  },
  stretchStartBtn: {
    backgroundColor: colors.sage,
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
    color: colors.inkSoft,
  },
  stretchTimer: {
    fontFamily: fonts.display,
    fontSize: fontSizes.lg,
    color: colors.sage,
  },
  stretchName: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.md,
    color: colors.ink,
    alignSelf: 'flex-start',
  },
  stretchCue: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.sm,
    color: colors.inkSoft,
    alignSelf: 'flex-start',
    lineHeight: 20,
  },
  libBanner: { marginHorizontal: spacing.lg, marginTop: spacing.md, marginBottom: 4,
    borderRadius: radii.xl, overflow: 'hidden',
    shadowColor: 'rgba(91,47,160,0.40)', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1, shadowRadius: 16, elevation: 8 },
  libGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.xl, paddingVertical: spacing.lg },
  libLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  libEmoji: { fontSize: 28 },
  libIconWrap: { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  libTitle: { fontFamily: fonts.bodyBold, fontSize: fontSizes.md, color: '#fff' },
  libSub:   { fontFamily: fonts.body, fontSize: fontSizes.sm, color: 'rgba(255,255,255,0.75)', marginTop: 2 },

  therapyRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg, flexWrap: 'wrap' },
  therapyCard: {
    flex: 1, minWidth: 100, borderRadius: 16, padding: spacing.md,
    alignItems: 'flex-start', gap: 4,
  },
  therapyIcon: { fontSize: 28, marginBottom: 2 },
  therapyIconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  filterRow: { flexDirection: 'row', gap: 8, marginBottom: 10, marginTop: 2 },
  filterPill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.06)', borderWidth: 1, borderColor: 'rgba(0,0,0,0.08)' },
  filterPillActive: { backgroundColor: '#6366F1', borderColor: '#6366F1' },
  filterPillTxt: { fontSize: 12, color: '#666', fontWeight: '500' as const },
  filterPillTxtActive: { color: '#fff' },
  heartBtn: { marginLeft: 6, padding: 4 },
  therapyName: { fontFamily: fonts.bodyBold, fontSize: fontSizes.sm, color: colors.ink },
  therapySub:  { fontFamily: fonts.bodyMedium, fontSize: 11, color: colors.inkSoft, lineHeight: 15 },
  therapyTag:  { backgroundColor: '#E0E7FF', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, marginTop: 4 },
  therapyTagTxt:{ fontFamily: fonts.bodyBold, fontSize: 10, color: '#3730A3' },

});