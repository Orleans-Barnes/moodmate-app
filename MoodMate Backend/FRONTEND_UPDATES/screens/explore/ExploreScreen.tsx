import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Animated, Dimensions, StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { fonts, fontSizes, spacing } from '@/theme/tokens';
import { useAuthStore } from '@/state/useAuthStore';

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

const MOODS = [
  { label: 'Great',   icon: 'sunny-outline' as const,         color: '#F59E0B', score: 5 },
  { label: 'Good',    icon: 'happy-outline' as const,          color: '#52B788', score: 4 },
  { label: 'Okay',    icon: 'remove-circle-outline' as const,  color: '#93C5FD', score: 3 },
  { label: 'Low',     icon: 'sad-outline' as const,            color: '#F87171', score: 2 },
  { label: 'Rough',   icon: 'thunderstorm-outline' as const,   color: '#A78BFA', score: 1 },
];

const TOOLS = [
  { label: 'Breathe',     icon: 'wind-outline' as const,        color: '#2563EB', bg: '#EFF6FF', nav: 'BreathingSession', params: { session: 'box', duration: 4 } },
  { label: 'Journal',     icon: 'book-outline' as const,        color: '#059669', bg: '#ECFDF5', nav: 'JournalEntry',     params: { template: 'daily', icon: 'book' } },
  { label: 'Meditate',    icon: 'moon-outline' as const,        color: '#7C3AED', bg: '#F5F3FF', nav: 'MeditationLibrary',params: {} },
  { label: 'DBT Skills',  icon: 'library-outline' as const,     color: '#DC2626', bg: '#FEF2F2', nav: 'DBTSkills',        params: {} },
  { label: 'Thought Sort',icon: 'shuffle-outline' as const,     color: '#D97706', bg: '#FFFBEB', nav: 'ThoughtSorter',   params: {} },
  { label: 'Calm Garden', icon: 'leaf-outline' as const,        color: '#059669', bg: '#ECFDF5', nav: 'CalmGarden',      params: {} },
  { label: 'Grounding',   icon: 'radio-button-on-outline' as const, color: '#0891B2', bg: '#F0F9FF', nav: 'Grounding',   params: {} },
  { label: 'SOS Help',    icon: 'alert-circle-outline' as const,color: '#EF4444', bg: '#FFF1F2', nav: 'SOS',            params: {} },
];

const AFFIRMATIONS = [
  'You are doing better than you think.',
  "It's okay to rest. Growth doesn't stop when you pause.",
  'You are enough, exactly as you are right now.',
  'Small steps still move you forward.',
  'Your feelings are valid. Every single one.',
  'This moment is temporary. You are resilient.',
];

export function ExploreScreen() {
  const nav    = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const user   = useAuthStore(s => s.user);

  const [affIdx, setAffIdx] = useState(() => Math.floor(Math.random() * AFFIRMATIONS.length));
  const affOp = useRef(new Animated.Value(1)).current;

  const headerOp = useRef(new Animated.Value(0)).current;
  const headerY  = useRef(new Animated.Value(-20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerOp, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(headerY, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  const nextAff = () => {
    Animated.timing(affOp, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
      setAffIdx(i => (i + 1) % AFFIRMATIONS.length);
      Animated.timing(affOp, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    });
  };

  const name = user?.firstName ?? 'there';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <View style={[s.root, { backgroundColor: BG }]}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <LinearGradient colors={GRAD_H} style={[s.header, { paddingTop: insets.top + 16 }]}>
        <Animated.View style={{ opacity: headerOp, transform: [{ translateY: headerY }] }}>
          <Text style={s.greeting}>{greeting}, {name}</Text>
          <Text style={s.headerSub}>How are you feeling today?</Text>
        </Animated.View>

        {/* Quick stats */}
        <View style={s.statsRow}>
          {[
            { icon: 'flame-outline' as const, val: '3', lbl: 'day streak' },
            { icon: 'trophy-outline' as const, val: '240', lbl: 'XP' },
            { icon: 'star-outline' as const, val: 'Sprout', lbl: 'level' },
          ].map(stat => (
            <View key={stat.lbl} style={s.statPill}>
              <Ionicons name={stat.icon} size={13} color="rgba(255,255,255,0.8)" />
              <Text style={s.statTxt}>{stat.val} {stat.lbl}</Text>
            </View>
          ))}
        </View>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 100 }]}>

        {/* Mood check-in */}
        <View style={[s.card, CARD_SH]}>
          <View style={s.cardHeader}>
            <View style={s.cardIconBox}>
              <Ionicons name="heart-outline" size={18} color={PURPLE} />
            </View>
            <Text style={s.cardTitle}>Daily Mood Check-In</Text>
          </View>
          <Text style={s.cardSub}>Tap how you're feeling right now</Text>
          <View style={s.moodRow}>
            {MOODS.map(m => (
              <TouchableOpacity
                key={m.label}
                style={s.moodItem}
                onPress={() => nav.navigate('MoodGate')}
              >
                <View style={[s.moodIcon, { backgroundColor: `${m.color}18` }]}>
                  <Ionicons name={m.icon} size={26} color={m.color} />
                </View>
                <Text style={s.moodLbl}>{m.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Affirmation */}
        <TouchableOpacity activeOpacity={0.85} style={[s.affCard, CARD_SH]} onPress={nextAff}>
          <LinearGradient colors={['#7C3AED', '#9333EA']} style={s.affGrad}>
            <Ionicons name="sparkles" size={20} color="rgba(255,255,255,0.7)" />
            <Animated.Text style={[s.affTxt, { opacity: affOp }]}>
              {AFFIRMATIONS[affIdx]}
            </Animated.Text>
            <View style={s.affFooter}>
              <Text style={s.affHint}>Tap for another</Text>
              <Ionicons name="refresh-outline" size={14} color="rgba(255,255,255,0.6)" />
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* Wellness Tools */}
        <View style={s.sectionHeader}>
          <View style={s.sectionIconBox}>
            <Ionicons name="apps-outline" size={16} color={PURPLE} />
          </View>
          <Text style={s.sectionTitle}>Wellness Tools</Text>
        </View>

        <View style={s.toolGrid}>
          {TOOLS.map(tool => (
            <TouchableOpacity
              key={tool.label}
              activeOpacity={0.80}
              style={[s.toolCard, CARD_SH, { backgroundColor: WHITE }]}
              onPress={() => nav.navigate(tool.nav as any, tool.params)}
            >
              <View style={[s.toolIcon, { backgroundColor: tool.bg }]}>
                <Ionicons name={tool.icon} size={26} color={tool.color} />
              </View>
              <Text style={s.toolLabel}>{tool.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Quick access */}
        <View style={s.sectionHeader}>
          <View style={s.sectionIconBox}>
            <Ionicons name="flash-outline" size={16} color={PURPLE} />
          </View>
          <Text style={s.sectionTitle}>Quick Access</Text>
        </View>

        {[
          { label: 'Talk to AI Companion', sub: 'Available 24/7', icon: 'hardware-chip-outline' as const, nav: 'AiChat', color: '#7C3AED' },
          { label: 'Find a Counsellor', sub: 'Book a real session', icon: 'people-outline' as const, nav: 'CounsellorList', color: '#2563EB' },
          { label: 'Weekly Report', sub: 'See your progress', icon: 'bar-chart-outline' as const, nav: 'WeeklyReport', color: '#059669' },
        ].map(item => (
          <TouchableOpacity
            key={item.label}
            style={[s.quickCard, CARD_SH]}
            onPress={() => nav.navigate(item.nav as any)}
          >
            <View style={[s.quickIcon, { backgroundColor: `${item.color}15` }]}>
              <Ionicons name={item.icon} size={22} color={item.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.quickLabel}>{item.label}</Text>
              <Text style={s.quickSub}>{item.sub}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={PM} />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root:   { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 20 },
  greeting:   { fontFamily: fonts.display, fontSize: fontSizes.xl, color: WHITE, marginBottom: 4 },
  headerSub:  { fontFamily: fonts.body, fontSize: fontSizes.base, color: 'rgba(255,255,255,0.68)', marginBottom: 16 },
  statsRow:   { flexDirection: 'row', gap: 8 },
  statPill:   { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.14)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  statTxt:    { fontFamily: fonts.bodyMedium, fontSize: 11, color: 'rgba(255,255,255,0.88)' },

  scroll:   { padding: 16 },

  card:      { backgroundColor: WHITE, borderRadius: 18, padding: 18, marginBottom: 14 },
  cardHeader:{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
  cardIconBox:{ width: 32, height: 32, borderRadius: 10, backgroundColor: PL, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontFamily: fonts.displaySemibold, fontSize: fontSizes.md, color: DARK },
  cardSub:   { fontFamily: fonts.body, fontSize: fontSizes.sm, color: MUTED, marginBottom: 16 },

  moodRow:  { flexDirection: 'row', justifyContent: 'space-between' },
  moodItem: { alignItems: 'center', gap: 6 },
  moodIcon: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  moodLbl:  { fontFamily: fonts.body, fontSize: fontSizes.xs, color: MUTED },

  affCard: { marginBottom: 20, borderRadius: 18, overflow: 'hidden' },
  affGrad: { padding: 20, gap: 12 },
  affTxt:  { fontFamily: fonts.displaySemibold, fontSize: fontSizes.lg, color: WHITE, lineHeight: 26 },
  affFooter:{ flexDirection: 'row', alignItems: 'center', gap: 6 },
  affHint: { fontFamily: fonts.body, fontSize: fontSizes.xs, color: 'rgba(255,255,255,0.55)' },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  sectionIconBox:{ width: 28, height: 28, borderRadius: 8, backgroundColor: PL, alignItems: 'center', justifyContent: 'center' },
  sectionTitle:  { fontFamily: fonts.displaySemibold, fontSize: fontSizes.md, color: DARK },

  toolGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  toolCard: { width: (W - 52) / 4, alignItems: 'center', borderRadius: 16, padding: 12, borderWidth: 1, borderColor: PL },
  toolIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  toolLabel:{ fontFamily: fonts.body, fontSize: 10, color: DARK, textAlign: 'center' },

  quickCard:  { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: WHITE, borderRadius: 16, padding: 14, marginBottom: 10 },
  quickIcon:  { width: 44, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  quickLabel: { fontFamily: fonts.bodyBold, fontSize: fontSizes.base, color: DARK, marginBottom: 2 },
  quickSub:   { fontFamily: fonts.body, fontSize: fontSizes.xs, color: MUTED },
});
