import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, Animated, Easing } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { Ionicons } from '@expo/vector-icons';
import { useMusicStore } from '@/state/useMusicStore';
import { useAuthStore } from '@/state/useAuthStore';
import { useGuestStore } from '@/state/useGuestStore';
import { useGamificationStore, XP_VALUES } from '@/state/useGamificationStore';
import { useWellnessStore } from '@/state/useWellnessStore';
import { ConfettiBurst, ConfettiHandle } from '@/components/Confetti';
import { hapticLight } from '@/utils/haptics';
import { fonts, fontSizes, spacing, radii, calm } from '@/theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'BreathingSession'>;

// ─── Phase definitions — Figma's "Box breathing" shows a symmetric 4·4·4·4 chip row, but the
// real technique here is 4·3·5·2 (in / hold / out / rest) diaphragmatic breathing, which is
// what was actually tuned and tested — the chips below show the true per-phase seconds rather
// than relabeling them to match the mockup's simplified box-breathing chip.
type Phase = { label: string; chip: string; duration: number; scale: number };

const PHASES: Phase[] = [
  { label: 'Breathe in', chip: 'In', duration: 4000, scale: 1.15 },
  { label: 'Hold', chip: 'Hold', duration: 3000, scale: 1.15 },
  { label: 'Breathe out', chip: 'Out', duration: 5000, scale: 1.0 },
  { label: 'Rest', chip: 'Rest', duration: 2000, scale: 1.0 },
];
const CYCLE_MS = PHASES.reduce((sum, p) => sum + p.duration, 0);

const BLOB_SIZE = 168;
const DEFAULT_SESSION_LEN = 120;

export function BreathingSessionScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const sessionTitle = route.params?.session ?? 'Breathing Reset';
  const sessionLen = route.params?.duration ?? DEFAULT_SESSION_LEN;
  const totalCycles = Math.max(1, Math.round((sessionLen * 1000) / CYCLE_MS));

  const [phaseIdx, setPhaseIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [done, setDone] = useState(false);
  const pausedRef = useRef(false);
  const doneRef = useRef(false);
  const phaseIdxRef = useRef(0);

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const labelOpacity = useRef(new Animated.Value(1)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const overlayScale = useRef(new Animated.Value(0.85)).current;

  const confettiRef = useRef<ConfettiHandle>(null);

  const isGuest = useAuthStore((s) => s.user?.guest ?? false);
  const showProgressModal = useGuestStore((s) => s.showProgressModal);
  const awardXp = useGamificationStore((s) => s.awardXp);
  const recordAction = useGamificationStore((s) => s.recordAction);
  const streakCount = useWellnessStore((s) => s.streakCount);

  const { play, pause: pauseMusic } = useMusicStore();
  const [musicActive, setMusicActive] = useState(false);

  const showCelebration = useCallback(() => {
    confettiRef.current?.fire();
    Animated.parallel([
      Animated.timing(overlayOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.spring(overlayScale, { toValue: 1, friction: 6, tension: 120, useNativeDriver: true }),
    ]).start();
  }, [overlayOpacity, overlayScale]);

  const handleSessionComplete = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    pausedRef.current = true;
    scaleAnim.stopAnimation();

    if (!isGuest) {
      awardXp(XP_VALUES.breathing, streakCount);
      recordAction('breathing', streakCount);
    } else {
      showProgressModal('Breathing session completed', XP_VALUES.breathing);
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setDone(true);
    setTimeout(() => showCelebration(), 100);
  }, [isGuest, awardXp, recordAction, showProgressModal, streakCount, showCelebration, scaleAnim]);

  const runPhase = useCallback((idx: number) => {
    if (pausedRef.current) return;
    const phase = PHASES[idx];
    phaseIdxRef.current = idx;

    Animated.sequence([
      Animated.timing(labelOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(labelOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();

    Haptics.impactAsync(idx === 0 || idx === 2 ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light);
    setPhaseIdx(idx);

    Animated.timing(scaleAnim, {
      toValue: phase.scale,
      duration: phase.duration,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished && !pausedRef.current) runPhase((idx + 1) % PHASES.length);
    });
  }, [scaleAnim, labelOpacity]);

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
    if (next) { scaleAnim.stopAnimation(); hapticLight(); }
    else runPhase(phaseIdxRef.current);
  };

  const toggleMusic = () => {
    if (!musicActive) { play('serenity'); setMusicActive(true); }
    else { pauseMusic(); setMusicActive(false); }
  };

  const phase = PHASES[phaseIdx];
  const remaining = sessionLen - elapsed;
  const mm = String(Math.floor(remaining / 60)).padStart(2, '0');
  const ss = String(remaining % 60).padStart(2, '0');
  const currentCycle = Math.min(totalCycles, Math.floor((elapsed * 1000) / CYCLE_MS) + 1);

  return (
    <View style={[s.root, { paddingTop: insets.top + spacing.md }]}>
      <View style={s.header}>
        <Text style={s.headerTitle} numberOfLines={1}>{sessionTitle}</Text>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={s.closeBtn}>
          <Text style={s.closeText}>✕</Text>
        </Pressable>
      </View>

      <View style={s.center}>
        <View style={s.ringOuter}>
          <View style={s.ringMid}>
            <Animated.View style={[s.blob, { transform: [{ scale: scaleAnim }] }]}>
              <Animated.Text style={[s.phaseLabel, { opacity: labelOpacity }]}>{phase.label}</Animated.Text>
              <Text style={s.phaseDuration}>{Math.round(phase.duration / 1000)}</Text>
            </Animated.View>
          </View>
        </View>

        <Text style={s.hint}>Follow the circle</Text>

        <View style={s.phaseRow}>
          {PHASES.map((p, i) => (
            <View key={p.chip + i} style={[s.phaseChip, i === phaseIdx && s.phaseChipActive]}>
              <Text style={s.phaseChipNum}>{Math.round(p.duration / 1000)}</Text>
              <Text style={s.phaseChipLabel}>{p.chip}</Text>
            </View>
          ))}
        </View>

        <Text style={s.cycleText}>Cycle {currentCycle} of {totalCycles} · {mm}:{ss} remaining</Text>
      </View>

      <View style={[s.controls, { marginBottom: insets.bottom + spacing.xl }]}>
        <Pressable style={[s.pauseBtn, done && s.disabled]} onPress={togglePause} disabled={done}>
          <Ionicons name={paused ? 'play' : 'pause'} size={16} color={calm.forest} />
          <Text style={s.pauseText}>{paused ? 'Resume' : 'Pause'}</Text>
        </Pressable>
        <Pressable style={[s.soundBtn, musicActive && s.soundBtnActive]} onPress={toggleMusic}>
          <Ionicons name="musical-notes" size={18} color="#FFFFFF" />
        </Pressable>
      </View>

      <ConfettiBurst ref={confettiRef} />

      {done && (
        <Animated.View style={[s.overlay, { opacity: overlayOpacity, transform: [{ scale: overlayScale }] }]}>
          <View style={s.celebCard}>
            <Text style={s.celebTitle}>Session complete</Text>
            <Text style={s.celebSub}>Well done. You breathed through the whole session.</Text>
            {!isGuest && (
              <View style={s.xpPill}>
                <Text style={s.xpPillText}>+{XP_VALUES.breathing} XP earned</Text>
              </View>
            )}
            <Pressable style={s.doneBtn} onPress={() => navigation.goBack()}>
              <Text style={s.doneBtnText}>Done</Text>
            </Pressable>
          </View>
        </Animated.View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: calm.forest },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl, marginBottom: spacing.xxxl },
  headerTitle: { fontFamily: fonts.bodyBold, fontSize: fontSizes.base + 1, color: '#FFFFFF' },
  closeBtn: { position: 'absolute', right: spacing.xl },
  closeText: { fontFamily: fonts.bodyBold, fontSize: 20, color: '#FFFFFF' },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.xl },

  ringOuter: {
    width: BLOB_SIZE * 1.9, height: BLOB_SIZE * 1.9, borderRadius: (BLOB_SIZE * 1.9) / 2,
    backgroundColor: calm.forestPanel, alignItems: 'center', justifyContent: 'center',
  },
  ringMid: {
    width: BLOB_SIZE * 1.4, height: BLOB_SIZE * 1.4, borderRadius: (BLOB_SIZE * 1.4) / 2,
    backgroundColor: '#3A6B44', alignItems: 'center', justifyContent: 'center',
  },
  blob: {
    width: BLOB_SIZE, height: BLOB_SIZE, borderRadius: BLOB_SIZE / 2,
    backgroundColor: calm.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  phaseLabel: { fontFamily: fonts.displayExtraBold, fontSize: fontSizes.xl + 3, color: '#FFFFFF' },
  phaseDuration: { fontFamily: fonts.displayExtraBold, fontSize: 42, color: '#FFFFFF' },

  hint: { fontFamily: fonts.body, fontSize: fontSizes.md - 1, color: calm.mutedOnDark },

  phaseRow: { flexDirection: 'row', gap: spacing.sm },
  phaseChip: {
    width: 76, paddingVertical: spacing.md, borderRadius: radii.lg + 2,
    backgroundColor: calm.forestPanel, alignItems: 'center', gap: 4,
  },
  phaseChipActive: { backgroundColor: calm.primary },
  phaseChipNum: { fontFamily: fonts.bodyBold, fontSize: fontSizes.lg, color: '#FFFFFF' },
  phaseChipLabel: { fontFamily: fonts.body, fontSize: fontSizes.sm - 1, color: calm.mutedOnDark },

  cycleText: { fontFamily: fonts.body, fontSize: fontSizes.sm, color: calm.mutedOnDark },

  controls: { flexDirection: 'row', justifyContent: 'center', gap: spacing.md, paddingHorizontal: spacing.xl },
  pauseBtn: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: '#FFFFFF', borderRadius: radii.pill,
    paddingHorizontal: spacing.xxl, paddingVertical: 17,
  },
  disabled: { opacity: 0.4 },
  pauseText: { fontFamily: fonts.bodyBold, fontSize: fontSizes.base - 1, color: calm.forest },
  soundBtn: { width: 54, height: 54, borderRadius: 27, backgroundColor: calm.forestPanel, alignItems: 'center', justifyContent: 'center' },
  soundBtnActive: { backgroundColor: calm.primary },

  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  celebCard: { backgroundColor: '#FFFFFF', borderRadius: radii.card, padding: spacing.xxl, alignItems: 'center', gap: spacing.md, width: '100%', maxWidth: 340 },
  celebTitle: { fontFamily: fonts.displayExtraBold, fontSize: fontSizes.xxl, color: calm.forest, textAlign: 'center' },
  celebSub: { fontFamily: fonts.body, fontSize: fontSizes.sm, color: calm.muted, textAlign: 'center', lineHeight: 20 },
  xpPill: { backgroundColor: calm.mintBg, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: radii.pill, marginTop: spacing.xs },
  xpPillText: { fontFamily: fonts.bodyBold, fontSize: fontSizes.sm, color: calm.primary },
  doneBtn: { width: '100%', backgroundColor: calm.primary, borderRadius: radii.pill, paddingVertical: 16, alignItems: 'center', marginTop: spacing.sm },
  doneBtnText: { fontFamily: fonts.bodyBold, fontSize: fontSizes.base, color: '#FFFFFF' },
});
