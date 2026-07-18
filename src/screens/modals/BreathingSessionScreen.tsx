import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View, Text, Pressable, StyleSheet, Animated, Easing, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { useMusicStore } from '@/state/useMusicStore';
import { useAuthStore } from '@/state/useAuthStore';
import { useGuestStore } from '@/state/useGuestStore';
import { useGamificationStore, XP_VALUES } from '@/state/useGamificationStore';
import { useWellnessStore } from '@/state/useWellnessStore';
import { ConfettiBurst, ConfettiHandle } from '@/components/Confetti';
import { hapticSuccess, hapticLight } from '@/utils/haptics';
import { colors, fonts, fontSizes, spacing, radii } from '@/theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'BreathingSession'>;

// ─── Phase definitions ─────────────────────────────────────────────────────
type Phase = { label: string; duration: number; scale: number; color: string; bgFrom: string; bgTo: string };

const PHASES: Phase[] = [
  { label: 'Breathe in…',  duration: 4000, scale: 1.28, color: '#5DADE2', bgFrom: '#0D2B4A', bgTo: '#1B6CA8' },
  { label: 'Hold…',        duration: 3000, scale: 1.28, color: '#F5CBA7', bgFrom: '#2C1B00', bgTo: '#7D5A00' },
  { label: 'Breathe out…', duration: 5000, scale: 1.00, color: '#A29BFE', bgFrom: '#0A0B1E', bgTo: '#1a1035' },
  { label: 'Rest…',        duration: 2000, scale: 1.00, color: '#A8E6CF', bgFrom: '#0B1A15', bgTo: '#0D2B20' },
];

const BLOB_SIZE = 180;
const DEFAULT_SESSION_LEN = 120;

export function BreathingSessionScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const sessionTitle = route.params?.session ?? 'Breathing Reset';
  const sessionLen   = route.params?.duration ?? DEFAULT_SESSION_LEN;

  // Phase state
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [paused, setPaused]     = useState(false);
  const [elapsed, setElapsed]   = useState(0);
  const [done, setDone]         = useState(false);
  const pausedRef   = useRef(false);
  const doneRef     = useRef(false);
  const phaseIdxRef = useRef(0);

  // Animations
  const scaleAnim    = useRef(new Animated.Value(1)).current;
  const labelOpacity = useRef(new Animated.Value(1)).current;
  // Celebration overlay fade-in
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const overlayScale   = useRef(new Animated.Value(0.85)).current;

  // Ripple rings
  const ring1Scale   = useRef(new Animated.Value(1)).current;
  const ring1Opacity = useRef(new Animated.Value(0)).current;
  const ring2Scale   = useRef(new Animated.Value(1)).current;
  const ring2Opacity = useRef(new Animated.Value(0)).current;

  // Confetti ref
  const confettiRef = useRef<ConfettiHandle>(null);

  // Stores
  const isGuest        = useAuthStore((s) => s.user?.guest ?? false);
  const showProgressModal = useGuestStore((s) => s.showProgressModal);
  const awardXp        = useGamificationStore((s) => s.awardXp);
  const recordAction   = useGamificationStore((s) => s.recordAction);
  const streakCount    = useWellnessStore((s) => s.streakCount);

  // Music toggle
  const { currentTrackId, isPlaying, play, pause: pauseMusic, resume: resumeMusic } = useMusicStore();
  const [musicActive, setMusicActive] = useState(false);

  // ── Ripple burst on phase start ──────────────────────────────────────────
  const triggerRipple = useCallback(() => {
    ring1Scale.setValue(1);
    ring1Opacity.setValue(0.4);
    ring2Scale.setValue(1);
    ring2Opacity.setValue(0.25);

    Animated.parallel([
      Animated.timing(ring1Scale,   { toValue: 2.0, duration: 1400, useNativeDriver: true }),
      Animated.timing(ring1Opacity, { toValue: 0,   duration: 1400, useNativeDriver: true }),
      Animated.sequence([
        Animated.delay(300),
        Animated.parallel([
          Animated.timing(ring2Scale,   { toValue: 2.0, duration: 1400, useNativeDriver: true }),
          Animated.timing(ring2Opacity, { toValue: 0,   duration: 1400, useNativeDriver: true }),
        ]),
      ]),
    ]).start();
  }, []);

  // ── Celebration entry animation ───────────────────────────────────────────
  const showCelebration = useCallback(() => {
    confettiRef.current?.fire();
    Animated.parallel([
      Animated.timing(overlayOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.spring(overlayScale, { toValue: 1, friction: 6, tension: 120, useNativeDriver: true }),
    ]).start();
  }, [overlayOpacity, overlayScale]);

  // ── Session complete ──────────────────────────────────────────────────────
  const handleSessionComplete = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    pausedRef.current = true;  // stop phase runner
    scaleAnim.stopAnimation();

    // Award XP for logged-in users
    if (!isGuest) {
      awardXp(XP_VALUES.breathing, streakCount);
      recordAction('breathing', streakCount);
    } else {
      showProgressModal('Breathing session completed', XP_VALUES.breathing);
    }

    // Beep — iOS success haptic produces a chime when ringer is on
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    setDone(true);
    setTimeout(() => showCelebration(), 100);
  }, [isGuest, awardXp, recordAction, showProgressModal, streakCount, showCelebration, scaleAnim]);

  // ── Phase runner ─────────────────────────────────────────────────────────
  const runPhase = useCallback((idx: number) => {
    if (pausedRef.current) return;
    const phase = PHASES[idx];
    phaseIdxRef.current = idx;

    Animated.sequence([
      Animated.timing(labelOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(labelOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();

    triggerRipple();
    Haptics.impactAsync(idx === 0 || idx === 2
      ? Haptics.ImpactFeedbackStyle.Medium
      : Haptics.ImpactFeedbackStyle.Light
    );

    setPhaseIdx(idx);

    Animated.timing(scaleAnim, {
      toValue: phase.scale,
      duration: phase.duration,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished && !pausedRef.current) {
        runPhase((idx + 1) % PHASES.length);
      }
    });
  }, [scaleAnim, labelOpacity, triggerRipple]);

  useEffect(() => {
    runPhase(0);
    const tick = setInterval(() => {
      if (pausedRef.current) return;
      setElapsed((e) => {
        const next = e + 1;
        if (next >= sessionLen) {
          clearInterval(tick);
          handleSessionComplete();
          return sessionLen;
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(tick);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const togglePause = () => {
    if (done) return;
    const next = !paused;
    setPaused(next);
    pausedRef.current = next;
    if (next) {
      scaleAnim.stopAnimation();
      hapticLight();
    } else {
      runPhase(phaseIdxRef.current);
    }
  };

  const toggleMusic = () => {
    if (!musicActive) {
      play('serenity');
      setMusicActive(true);
    } else {
      pauseMusic();
      setMusicActive(false);
    }
  };

  const phase = PHASES[phaseIdx];
  const mm = String(Math.floor(elapsed / 60)).padStart(2, '0');
  const ss = String(elapsed % 60).padStart(2, '0');
  const totalMins = String(Math.floor(sessionLen / 60)).padStart(2, '0');
  const totalSecs = String(sessionLen % 60).padStart(2, '0');
  const progressPct = Math.min(elapsed / sessionLen, 1);

  return (
    <LinearGradient
      colors={[phase.bgFrom, phase.bgTo]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0.3, y: 1 }}
      style={styles.container}
    >
      {/* ── Header ── */}
      <View style={[styles.customHeader, { paddingTop: insets.top + spacing.md }]}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={styles.closePressable}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Close"
        >
          <Text style={styles.closeLabel}>✕</Text>
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>{sessionTitle}</Text>
        <View style={styles.closePlaceholder} />
      </View>
      <Text style={styles.techniqueLabel}>4 · 3 · 5 — Diaphragmatic breathing</Text>

      {/* ── Progress bar ── */}
      <View style={styles.progressTrack}>
        <Animated.View style={[styles.progressFill, { width: `${progressPct * 100}%` as any }]} />
      </View>

      {/* ── Breathing orb ── */}
      <View style={styles.center}>
        <Animated.View
          style={[styles.ring, { borderColor: phase.color, transform: [{ scale: ring1Scale }], opacity: ring1Opacity }]}
          pointerEvents="none"
        />
        <Animated.View
          style={[styles.ring, { borderColor: phase.color, transform: [{ scale: ring2Scale }], opacity: ring2Opacity }]}
          pointerEvents="none"
        />
        <Animated.View
          style={[
            styles.blob,
            { backgroundColor: phase.color + '33', borderColor: phase.color, transform: [{ scale: scaleAnim }] },
          ]}
        >
          <View style={[styles.blobInner, { backgroundColor: phase.color + '22' }]} />
          <Animated.Text style={[styles.phaseLabel, { color: phase.color, opacity: labelOpacity }]}>
            {phase.label}
          </Animated.Text>
        </Animated.View>

        <Text style={styles.timer}>{mm}:{ss} / {totalMins}:{totalSecs}</Text>
        <Text style={styles.phaseHint}>
          {phaseIdx === 0 ? 'Fill your lungs slowly' :
           phaseIdx === 1 ? 'Gently hold your breath' :
           phaseIdx === 2 ? 'Let go, release tension' :
           'Breathe naturally'}
        </Text>
      </View>

      {/* ── Controls ── */}
      <View style={[styles.actions, { marginBottom: 52 + insets.bottom }]}>
        <Pressable
          style={[styles.iconBtn, done && styles.iconBtnDisabled]}
          onPress={togglePause}
          hitSlop={8}
          disabled={done}
          accessibilityRole="button"
          accessibilityLabel={paused ? 'Resume' : 'Pause'}
        >
          <Text style={styles.iconText}>{paused ? '▶' : '⏸'}</Text>
        </Pressable>
        <Pressable
          style={[styles.iconBtn, musicActive && styles.iconBtnActive]}
          onPress={toggleMusic}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={musicActive ? 'Mute music' : 'Play music'}
        >
          <Text style={styles.iconText}>{musicActive ? '🎵' : '🔇'}</Text>
        </Pressable>
      </View>

      {/* ── Confetti ── */}
      <ConfettiBurst ref={confettiRef} />

      {/* ── Celebration overlay (shown when done) ── */}
      {done && (
        <Animated.View
          style={[
            styles.overlay,
            { opacity: overlayOpacity, transform: [{ scale: overlayScale }] },
          ]}
        >
          <View style={styles.celebCard}>
            <Text style={styles.celebEmoji}>🎉</Text>
            <Text style={styles.celebTitle}>Session complete!</Text>
            <Text style={styles.celebSub}>
              Well done. You breathed through the whole session.
            </Text>

            {!isGuest && (
              <View style={styles.xpPill}>
                <Text style={styles.xpPillText}>+{XP_VALUES.breathing} XP earned</Text>
              </View>
            )}

            <Pressable
              style={styles.doneBtn}
              onPress={() => navigation.goBack()}
              accessibilityRole="button"
              accessibilityLabel="Done"
            >
              <LinearGradient
                colors={['#5DADE2', '#A29BFE']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={styles.doneBtnGrad}
              >
                <Text style={styles.doneBtnText}>Done ✓</Text>
              </LinearGradient>
            </Pressable>
          </View>
        </Animated.View>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  customHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    // paddingTop is set inline (insets.top + spacing.md) - this screen has no header bar / no
    // <Screen> wrapper (full-bleed LinearGradient root), so it must account for the status bar
    // itself rather than relying on a fixed guess.
    paddingBottom: spacing.sm,
  },
  closePressable: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeLabel: { fontSize: 16, color: 'rgba(255,255,255,0.75)' },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.base,
    color: 'rgba(255,255,255,0.9)',
  },
  closePlaceholder: { width: 38 },

  // Progress bar
  techniqueLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.xs,
    color: 'rgba(255,255,255,0.45)',
    textAlign: 'center',
    letterSpacing: 0.8,
    marginTop: -4,
    marginBottom: 6,
  },
  progressTrack: {
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginHorizontal: spacing.lg,
    borderRadius: 2,
  },
  progressFill: {
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: 2,
  },

  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
  },

  ring: {
    position: 'absolute',
    width: BLOB_SIZE,
    height: BLOB_SIZE,
    borderRadius: BLOB_SIZE / 2,
    borderWidth: 1.5,
  },
  blob: {
    width: BLOB_SIZE,
    height: BLOB_SIZE,
    borderRadius: BLOB_SIZE * 0.45,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 12,
  },
  blobInner: {
    position: 'absolute',
    width: BLOB_SIZE * 0.7,
    height: BLOB_SIZE * 0.7,
    borderRadius: BLOB_SIZE * 0.35,
  },
  phaseLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.lg,
    textAlign: 'center',
  },
  timer: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.sm,
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 1,
  },
  phaseHint: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.sm,
    color: 'rgba(255,255,255,0.4)',
    textAlign: 'center',
  },

  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.lg,
    marginBottom: 52,
  },
  iconBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnActive: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderColor: 'rgba(255,255,255,0.4)',
  },
  iconBtnDisabled: { opacity: 0.35 },
  iconText: { fontSize: 20 },

  // ── Celebration overlay ──
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  celebCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radii.xl,
    padding: spacing.xxl,
    alignItems: 'center',
    gap: spacing.md,
    width: '100%',
    maxWidth: 340,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 20,
  },
  celebEmoji: { fontSize: 56 },
  celebTitle: {
    fontFamily: fonts.display,
    fontSize: fontSizes.xxl,
    color: colors.ink,
    textAlign: 'center',
  },
  celebSub: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.sm,
    color: colors.inkSoft,
    textAlign: 'center',
    lineHeight: 20,
  },
  xpPill: {
    backgroundColor: colors.lavenderSoft,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    marginTop: spacing.xs,
  },
  xpPillText: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.sm,
    color: colors.lavender,
  },
  doneBtn: {
    width: '100%',
    borderRadius: radii.pill,
    overflow: 'hidden',
    marginTop: spacing.sm,
  },
  doneBtnGrad: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  doneBtnText: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.base,
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
});
