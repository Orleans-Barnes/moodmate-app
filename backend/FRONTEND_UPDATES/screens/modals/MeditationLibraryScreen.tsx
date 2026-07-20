import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Animated, StatusBar, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { fonts, fontSizes } from '@/theme/tokens';
import { useToast } from '@/state/useToast';

const { width: W } = Dimensions.get('window');

// ─── Design system ─────────────────────────────────────────────────────────
const BG     = '#F0EBFF';
const PURPLE = '#7C3AED';
const PL     = '#EDE9FE';
const PM     = '#C4B5FD';
const DARK   = '#1A0D40';
const MUTED  = '#8B6FC8';
const WHITE  = '#FFFFFF';
const GRAD_H = ['#1A0A3C', '#3B1275', '#7C3AED'] as const;
const CARD_SH = { shadowColor: PURPLE, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.10, shadowRadius: 12, elevation: 4 };

const PACKS = [
  { id: 'calm', label: 'Daily Calm', icon: 'moon-outline' as const, color: '#7C3AED', sessions: 6 },
  { id: 'focus', label: 'Deep Focus', icon: 'eye-outline' as const, color: '#2563EB', sessions: 5 },
  { id: 'sleep', label: 'Sleep Well', icon: 'cloudy-night-outline' as const, color: '#059669', sessions: 4 },
  { id: 'anxiety', label: 'Ease Anxiety', icon: 'leaf-outline' as const, color: '#D97706', sessions: 6 },
];

const SESSIONS: Record<string, { id: string; title: string; dur: string; desc: string; }[]> = {
  calm: [
    { id: 'c1', title: 'Morning Breath Awareness', dur: '5 min', desc: 'Start your day with intentional breathing' },
    { id: 'c2', title: 'Body Scan', dur: '10 min', desc: 'Release tension from head to toe' },
    { id: 'c3', title: 'Loving-Kindness', dur: '12 min', desc: 'Cultivate compassion for yourself and others' },
    { id: 'c4', title: 'Mindful Observation', dur: '7 min', desc: 'Notice the world around you without judgment' },
    { id: 'c5', title: 'Breath & Body', dur: '15 min', desc: 'Deep relaxation through breath' },
    { id: 'c6', title: 'Evening Unwind', dur: '8 min', desc: 'Let go of the day with ease' },
  ],
  focus: [
    { id: 'f1', title: 'Focus Anchor', dur: '5 min', desc: 'Ground your attention in the present moment' },
    { id: 'f2', title: 'Single-Pointed Attention', dur: '10 min', desc: 'Train the mind to stay on task' },
    { id: 'f3', title: 'Study Prep', dur: '6 min', desc: 'Clear your mind before a study session' },
    { id: 'f4', title: 'Mind Clearing', dur: '8 min', desc: 'Release mental clutter' },
    { id: 'f5', title: 'Flow State', dur: '12 min', desc: 'Enter a state of effortless concentration' },
  ],
  sleep: [
    { id: 's1', title: '4-7-8 Breathing', dur: '5 min', desc: 'Fall asleep naturally with this breathing pattern' },
    { id: 's2', title: 'Twilight Body Scan', dur: '15 min', desc: 'Deep relaxation for bedtime' },
    { id: 's3', title: 'Sleep Stories', dur: '20 min', desc: 'Guided imagery to drift off peacefully' },
    { id: 's4', title: 'Progressive Relaxation', dur: '12 min', desc: 'Tense and release each muscle group' },
  ],
  anxiety: [
    { id: 'a1', title: 'Box Breathing', dur: '5 min', desc: 'Calm your nervous system instantly' },
    { id: 'a2', title: '5-4-3-2-1 Grounding', dur: '8 min', desc: 'Anchor yourself to the present' },
    { id: 'a3', title: 'Worry Release', dur: '10 min', desc: 'Let go of anxious thoughts' },
    { id: 'a4', title: 'Safe Place Visualisation', dur: '12 min', desc: 'Create a mental sanctuary' },
    { id: 'a5', title: 'Breath Regulation', dur: '6 min', desc: 'Use breath to lower anxiety' },
    { id: 'a6', title: 'Acceptance Practice', dur: '15 min', desc: 'Sit with discomfort without fighting it' },
  ],
};

export function MeditationLibraryScreen() {
  const nav    = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const toast  = useToast();

  const [activePack, setActivePack] = useState('calm');
  const [playing, setPlaying]       = useState<string | null>(null);
  const [seconds, setSeconds]       = useState(0);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const headerOp = useRef(new Animated.Value(0)).current;
  const ringAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(headerOp, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, []);

  useEffect(() => {
    if (playing) {
      timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000);
      Animated.loop(
        Animated.sequence([
          Animated.timing(ringAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
          Animated.timing(ringAnim, { toValue: 0, duration: 2000, useNativeDriver: true }),
        ])
      ).start();
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      ringAnim.stopAnimation();
      ringAnim.setValue(0);
      setSeconds(0);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [playing]);

  const fmt = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  const pack = PACKS.find(p => p.id === activePack)!;
  const sessions = SESSIONS[activePack] ?? [];

  return (
    <View style={[s.root, { backgroundColor: BG }]}>
      <StatusBar barStyle="light-content" />

      <LinearGradient colors={GRAD_H} style={[s.header, { paddingTop: insets.top + 16 }]}>
        <Animated.View style={{ opacity: headerOp }}>
          <View style={s.topRow}>
            <TouchableOpacity onPress={() => nav.goBack()} style={s.backBtn}>
              <Ionicons name="chevron-back" size={24} color={WHITE} />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={s.headerTitle}>Meditation Library</Text>
              <Text style={s.headerSub}>Find peace, one breath at a time</Text>
            </View>
          </View>
        </Animated.View>
      </LinearGradient>

      {/* Pack selector */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.packRow}>
        {PACKS.map(p => {
          const active = p.id === activePack;
          return (
            <TouchableOpacity key={p.id} onPress={() => setActivePack(p.id)}>
              {active
                ? <LinearGradient colors={['#7C3AED', '#9333EA']} style={s.packPill}>
                    <Ionicons name={p.icon} size={14} color={WHITE} />
                    <Text style={[s.packTxt, { color: WHITE }]}>{p.label}</Text>
                  </LinearGradient>
                : <View style={[s.packPill, { backgroundColor: WHITE, borderWidth: 1, borderColor: PL }]}>
                    <Ionicons name={p.icon} size={14} color={MUTED} />
                    <Text style={[s.packTxt, { color: MUTED }]}>{p.label}</Text>
                  </View>
              }
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 100 }]}>

        {/* Active player */}
        {playing && (
          <View style={[s.playerCard, CARD_SH]}>
            <LinearGradient colors={['#7C3AED', '#9333EA']} style={s.playerGrad}>
              <Animated.View style={[s.ring, { opacity: ringAnim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0] }), transform: [{ scale: ringAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 2] }) }] }]} />
              <Text style={s.playerTime}>{fmt(seconds)}</Text>
              <Text style={s.playerLabel}>In session</Text>
              <TouchableOpacity onPress={() => { setPlaying(null); toast.show({ type: 'success', message: 'Session complete!' }); }} style={s.stopBtn}>
                <Ionicons name="stop-circle" size={44} color={WHITE} />
              </TouchableOpacity>
            </LinearGradient>
          </View>
        )}

        {/* Session list */}
        <View style={[s.card, CARD_SH]}>
          <View style={s.cardHeader}>
            <View style={[s.packIcon, { backgroundColor: pack.color + '15' }]}>
              <Ionicons name={pack.icon} size={20} color={pack.color} />
            </View>
            <View>
              <Text style={s.cardTitle}>{pack.label}</Text>
              <Text style={s.cardSub}>{sessions.length} guided sessions</Text>
            </View>
          </View>
          {sessions.map(sess => (
            <TouchableOpacity
              key={sess.id}
              style={[s.sessionRow, playing === sess.id && s.sessionActive]}
              onPress={() => setPlaying(p => p === sess.id ? null : sess.id)}
            >
              <View style={[s.playBtn, { backgroundColor: playing === sess.id ? PURPLE : PL }]}>
                <Ionicons name={playing === sess.id ? 'pause' : 'play'} size={18} color={playing === sess.id ? WHITE : PURPLE} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.sessionTitle}>{sess.title}</Text>
                <Text style={s.sessionDesc}>{sess.desc}</Text>
              </View>
              <View style={s.durBadge}>
                <Ionicons name="time-outline" size={11} color={MUTED} />
                <Text style={s.durTxt}>{sess.dur}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root:   { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 16 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  backBtn:     { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: fonts.display, fontSize: fontSizes.xl, color: WHITE },
  headerSub:   { fontFamily: fonts.body, fontSize: fontSizes.sm, color: 'rgba(255,255,255,0.65)' },

  packRow:  { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  packPill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  packTxt:  { fontFamily: fonts.bodyMedium, fontSize: fontSizes.sm },

  scroll: { padding: 16 },

  playerCard: { borderRadius: 20, overflow: 'hidden', marginBottom: 14 },
  playerGrad: { padding: 32, alignItems: 'center', gap: 8 },
  ring:       { position: 'absolute', width: 120, height: 120, borderRadius: 60, borderWidth: 2, borderColor: WHITE },
  playerTime: { fontFamily: fonts.display, fontSize: 42, color: WHITE },
  playerLabel:{ fontFamily: fonts.body, fontSize: fontSizes.base, color: 'rgba(255,255,255,0.7)' },
  stopBtn:    { marginTop: 8 },

  card:        { backgroundColor: WHITE, borderRadius: 18, padding: 18, marginBottom: 14 },
  cardHeader:  { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  packIcon:    { width: 44, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  cardTitle:   { fontFamily: fonts.displaySemibold, fontSize: fontSizes.md, color: DARK },
  cardSub:     { fontFamily: fonts.body, fontSize: fontSizes.xs, color: MUTED },

  sessionRow:    { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderTopWidth: 1, borderTopColor: PL },
  sessionActive: { backgroundColor: PL + '50', borderRadius: 12, paddingHorizontal: 8, marginHorizontal: -8 },
  playBtn:       { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  sessionTitle:  { fontFamily: fonts.bodyBold, fontSize: fontSizes.base, color: DARK, marginBottom: 2 },
  sessionDesc:   { fontFamily: fonts.body, fontSize: fontSizes.xs, color: MUTED },
  durBadge:      { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: BG, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  durTxt:        { fontFamily: fonts.body, fontSize: fontSizes.xs, color: MUTED },
});
