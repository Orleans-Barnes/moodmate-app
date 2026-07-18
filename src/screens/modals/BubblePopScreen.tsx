import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { ScreenHeader } from '@/components/ScreenHeader';
import { ConfettiBurst, ConfettiHandle } from '@/components/Confetti';
import { useGamificationStore, XP_VALUES } from '@/state/useGamificationStore';
import { useAuthStore } from '@/state/useAuthStore';
import { useWellnessStore } from '@/state/useWellnessStore';
import { hapticLight, hapticSuccess } from '@/utils/haptics';
import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import { colors, fonts, fontSizes, radii, spacing, shadow } from '@/theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'BubblePop'>;

const { width: W, height: H } = Dimensions.get('window');

// Pre-load pop sound for instant playback
setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});
function playPopSound() {
  try {
    const player = createAudioPlayer(require('../../../assets/sounds/bubble_pop.mp3') as number);
    player.volume = 0.7;
    player.play();
    // Dispose after playback (120ms clip)
    setTimeout(() => { try { player.remove(); } catch {} }, 400);
  } catch {}
}
const BUBBLE_EMOJIS = ['🫧', '💚', '🌿', '✨', '🌸', '💙', '🌊', '☁️'];
const BUBBLE_SIZE   = 64;
const SPAWN_INTERVAL = 1400;
const RISE_DURATION  = 5500;
const MAX_SCORE      = 20; // pop this many bubbles to win

interface Bubble {
  id: number;
  emoji: string;
  x: number;
  y: Animated.Value;
  scale: Animated.Value;
  opacity: Animated.Value;
  popped: boolean;
}

let nextId = 0;

function makeBubble(): Bubble {
  return {
    id: nextId++,
    emoji: BUBBLE_EMOJIS[Math.floor(Math.random() * BUBBLE_EMOJIS.length)],
    x: Math.random() * (W - BUBBLE_SIZE - spacing.lg * 2),
    y: new Animated.Value(H),
    scale: new Animated.Value(1),
    opacity: new Animated.Value(1),
    popped: false,
  };
}

export function BubblePopScreen({ navigation }: Props) {
  const [bubbles, setBubbles]   = useState<Bubble[]>([]);
  const [score, setScore]       = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const scoreRef        = useRef(0);
  const gameOverRef     = useRef(false);
  const intervalRef     = useRef<ReturnType<typeof setInterval> | null>(null);
  const activeAnimations = useRef<Map<number, Animated.CompositeAnimation>>(new Map());
  const confettiRef     = useRef<ConfettiHandle>(null);

  const isGuest     = useAuthStore((s) => s.user?.guest ?? false);
  const awardXp     = useGamificationStore((s) => s.awardXp);
  const recordAction = useGamificationStore((s) => s.recordAction);
  const streakCount  = useWellnessStore((s) => s.streakCount);

  // ── Spawn ──────────────────────────────────────────────────────────────
  const spawnBubble = useCallback(() => {
    if (gameOverRef.current) return;
    const b = makeBubble();
    const rise = Animated.timing(b.y, {
      toValue: -BUBBLE_SIZE,
      duration: RISE_DURATION + Math.random() * 1500,
      useNativeDriver: true,
    });
    rise.start(({ finished }) => {
      if (finished) {
        setBubbles((prev) => prev.filter((x) => x.id !== b.id));
        activeAnimations.current.delete(b.id);
      }
    });
    activeAnimations.current.set(b.id, rise);
    setBubbles((prev) => [...prev, b]);
  }, []);

  useEffect(() => {
    spawnBubble();
    intervalRef.current = setInterval(spawnBubble, SPAWN_INTERVAL);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      activeAnimations.current.forEach((a) => a.stop());
      activeAnimations.current.clear();
    };
  }, [spawnBubble]);

  // ── End game ──────────────────────────────────────────────────────────
  const endGame = useCallback(() => {
    if (gameOverRef.current) return;
    gameOverRef.current = true;
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    // Stop all flying bubbles
    activeAnimations.current.forEach((a) => a.stop());
    setBubbles([]);
    hapticSuccess();
    if (!isGuest) {
      awardXp(XP_VALUES.breathing, streakCount);
      recordAction('breathing', streakCount);
    }
    setGameOver(true);
    setTimeout(() => confettiRef.current?.fire(), 150);
  }, [isGuest, awardXp, recordAction, streakCount]);

  // ── Pop ───────────────────────────────────────────────────────────────
  const popBubble = (b: Bubble) => {
    if (b.popped || gameOverRef.current) return;
    b.popped = true;
    const rise = activeAnimations.current.get(b.id);
    rise?.stop();
    activeAnimations.current.delete(b.id);

    hapticLight();
    playPopSound();

    Animated.parallel([
      Animated.timing(b.scale,   { toValue: 2.2, duration: 220, useNativeDriver: true }),
      Animated.timing(b.opacity, { toValue: 0,   duration: 220, useNativeDriver: true }),
    ]).start(() => setBubbles((prev) => prev.filter((x) => x.id !== b.id)));

    scoreRef.current += 1;
    setScore(scoreRef.current);
    if (scoreRef.current >= MAX_SCORE) {
      endGame();
    } else if (scoreRef.current % 5 === 0) {
      hapticSuccess();
    }
  };

  // ── Restart ───────────────────────────────────────────────────────────
  const restart = () => {
    scoreRef.current = 0;
    gameOverRef.current = false;
    setScore(0);
    setGameOver(false);
    spawnBubble();
    intervalRef.current = setInterval(spawnBubble, SPAWN_INTERVAL);
  };

  // ── Game over screen ──────────────────────────────────────────────────
  if (gameOver) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="Bubble Pop" onClose={() => navigation.goBack()} />
        <ConfettiBurst ref={confettiRef} />
        <View style={styles.celebCenter}>
          <Text style={styles.celebEmoji}>🫧</Text>
          <Text style={styles.celebTitle}>You did it!</Text>
          <Text style={styles.celebScore}>You popped {MAX_SCORE} bubbles</Text>
          <Text style={styles.celebSub}>
            Stress released. Well done — that's a small but real act of self-care.
          </Text>

          {!isGuest && (
            <View style={styles.xpPill}>
              <Text style={styles.xpPillText}>+{XP_VALUES.breathing} XP earned 🌱</Text>
            </View>
          )}

          <View style={styles.btnsRow}>
            <Pressable
              style={styles.restartBtn}
              onPress={restart}
              accessibilityRole="button"
              accessibilityLabel="Play again"
            >
              <Text style={styles.restartTxt}>Play again</Text>
            </Pressable>
            <Pressable
              style={styles.doneBtn}
              onPress={() => navigation.goBack()}
              accessibilityRole="button"
              accessibilityLabel="Done"
            >
              <LinearGradient
                colors={['#5C8AE6', '#7BAEF5']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={styles.doneBtnGrad}
              >
                <Text style={styles.doneBtnTxt}>Done ✓</Text>
              </LinearGradient>
            </Pressable>
          </View>
        </View>
      </View>
    );
  }

  // ── Game screen ───────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <ScreenHeader title="Bubble Pop" onClose={() => navigation.goBack()} />

      {/* Score row */}
      <View style={styles.scoreRow}>
        <View>
          <Text style={styles.scoreLabel}>Popped</Text>
          <Text style={styles.scoreValue}>{score}</Text>
        </View>
        {/* Progress to MAX_SCORE */}
        <View style={styles.progressWrap}>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${(score / MAX_SCORE) * 100}%` as any }]} />
          </View>
          <Text style={styles.progressLabel}>{score}/{MAX_SCORE} to win</Text>
        </View>
      </View>

      <Text style={styles.hint}>tap the bubbles 🫧</Text>

      <View style={styles.field}>
        {bubbles.map((b) => (
          <Animated.View
            key={b.id}
            style={[
              styles.bubble,
              { left: b.x, transform: [{ translateY: b.y }, { scale: b.scale }], opacity: b.opacity },
            ]}
          >
            <Pressable
              onPress={() => popBubble(b)}
              style={styles.bubbleInner}
              accessibilityRole="button"
              accessibilityLabel={`Pop ${b.emoji} bubble`}
            >
              <Text style={styles.bubbleEmoji}>{b.emoji}</Text>
            </Pressable>
          </Animated.View>
        ))}
      </View>

      <Text style={styles.footer}>A gentle way to let stress float away 🌿</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: spacing.lg },

  // ── Score area ──
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  scoreLabel: { fontFamily: fonts.bodyMedium, fontSize: fontSizes.xs, color: colors.inkSoft },
  scoreValue: { fontFamily: fonts.display, fontSize: 52, color: colors.ink, lineHeight: 58 },
  progressWrap: { alignItems: 'flex-end', gap: 6, flex: 1, paddingLeft: spacing.md },
  progressTrack: {
    height: 8,
    backgroundColor: colors.blueSoft,
    borderRadius: 4,
    overflow: 'hidden',
    width: '100%',
  },
  progressFill: { height: 8, backgroundColor: colors.blue, borderRadius: 4 },
  progressLabel: { fontFamily: fonts.bodyMedium, fontSize: fontSizes.xs, color: colors.inkFaint },

  hint: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.xs,
    color: colors.inkFaint,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  field: { flex: 1, position: 'relative', overflow: 'hidden' },
  bubble: { position: 'absolute', width: BUBBLE_SIZE, height: BUBBLE_SIZE },
  bubbleInner: {
    width: BUBBLE_SIZE,
    height: BUBBLE_SIZE,
    borderRadius: BUBBLE_SIZE / 2,
    backgroundColor: colors.blueSoft,
    borderWidth: 1.5,
    borderColor: colors.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubbleEmoji: { fontSize: 26 },
  footer: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.xs,
    color: colors.inkFaint,
    textAlign: 'center',
    paddingBottom: spacing.lg,
  },

  // ── Game over / celebration ──
  celebCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
  },
  celebEmoji:  { fontSize: 72 },
  celebTitle: {
    fontFamily: fonts.display,
    fontSize: fontSizes.xxl,
    color: colors.ink,
  },
  celebScore: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.lg,
    color: colors.blue,
  },
  celebSub: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.sm,
    color: colors.inkSoft,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
  },
  xpPill: {
    backgroundColor: colors.sageSoft,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
  },
  xpPillText: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.sm,
    color: colors.sage,
  },
  btnsRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm },
  restartBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: radii.pill,
    borderWidth: 2,
    borderColor: colors.blue,
    alignItems: 'center',
  },
  restartTxt: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.base,
    color: colors.blue,
  },
  doneBtn: { flex: 1, borderRadius: radii.pill, overflow: 'hidden' },
  doneBtnGrad: { paddingVertical: 14, alignItems: 'center' },
  doneBtnTxt: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.base,
    color: '#FFFFFF',
  },
});
