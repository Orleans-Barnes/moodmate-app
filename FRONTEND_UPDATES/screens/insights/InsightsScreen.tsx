import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Animated, Dimensions, StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { fonts, fontSizes } from '@/theme/tokens';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

const WEEK_MOODS = [4, 3, 5, 3, 4, 2, 4]; // Mon–Sun scores (1–5)
const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const BAR_H = 80;

const moodLabel = (s: number) => s >= 5 ? 'Great' : s >= 4 ? 'Good' : s >= 3 ? 'Okay' : s >= 2 ? 'Low' : 'Very Low';
const moodColor = (s: number) => s >= 5 ? '#52B788' : s >= 4 ? '#7C3AED' : s >= 3 ? '#93C5FD' : s >= 2 ? '#F87171' : '#EF4444';

const QUICK_ACTIONS = [
  { label: 'Mood Analytics', icon: 'analytics-outline' as const, nav: 'MoodAnalytics', color: '#7C3AED', bg: PL },
  { label: 'Weekly Report',  icon: 'bar-chart-outline' as const,  nav: 'WeeklyReport',  color: '#2563EB', bg: '#EFF6FF' },
  { label: 'AI Insights',    icon: 'hardware-chip-outline' as const, nav: 'AiChat',     color: '#059669', bg: '#ECFDF5' },
  { label: 'Thought Diary',  icon: 'journal-outline' as const,    nav: 'ThoughtDiary',  color: '#D97706', bg: '#FFFBEB' },
];

export function InsightsScreen() {
  const nav    = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const [xp, setXp] = useState(240);
  const [streak, setStreak] = useState(3);

  const bars = useRef(WEEK_MOODS.map(() => new Animated.Value(0))).current;
  const headerOp = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(headerOp, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    Animated.stagger(80, bars.map(b =>
      Animated.spring(b, { toValue: 1, friction: 6, tension: 100, useNativeDriver: false })
    )).start();
  }, []);

  const avg = Math.round(WEEK_MOODS.reduce((a, b) => a + b, 0) / WEEK_MOODS.length * 10) / 10;
  const today = WEEK_MOODS[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1];

  return (
    <View style={[s.root, { backgroundColor: BG }]}>
      <StatusBar barStyle="light-content" />

      <LinearGradient colors={GRAD_H} style={[s.header, { paddingTop: insets.top + 16 }]}>
        <Animated.View style={{ opacity: headerOp }}>
          <Text style={s.headerTitle}>Your Insights</Text>
          <Text style={s.headerSub}>Track your wellness journey</Text>

          {/* XP + Streak strip */}
          <View style={s.statsRow}>
            <View style={s.statPill}>
              <Ionicons name="flame" size={14} color="#F87171" />
              <Text style={s.statTxt}>{streak} day streak</Text>
            </View>
            <View style={s.statPill}>
              <Ionicons name="trophy-outline" size={14} color="#FCD34D" />
              <Text style={s.statTxt}>{xp} XP total</Text>
            </View>
            <View style={s.statPill}>
              <Ionicons name="leaf-outline" size={14} color="#86EFAC" />
              <Text style={s.statTxt}>Sprout level</Text>
            </View>
          </View>
        </Animated.View>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 100 }]}>

        {/* Today's mood */}
        <View style={[s.card, CARD_SH]}>
          <View style={s.rowBetween}>
            <Text style={s.cardTitle}>Today's Mood</Text>
            <TouchableOpacity onPress={() => nav.navigate('MoodGate')}>
              <Text style={s.linkTxt}>Log now</Text>
            </TouchableOpacity>
          </View>
          <View style={s.todayRow}>
            <View style={[s.todayBadge, { backgroundColor: `${moodColor(today)}18` }]}>
              <Ionicons name="happy-outline" size={32} color={moodColor(today)} />
            </View>
            <View>
              <Text style={[s.todayMood, { color: moodColor(today) }]}>{moodLabel(today)}</Text>
              <Text style={s.todaySub}>Score: {today}/5</Text>
            </View>
          </View>
        </View>

        {/* Weekly chart */}
        <View style={[s.card, CARD_SH]}>
          <View style={s.rowBetween}>
            <Text style={s.cardTitle}>This Week</Text>
            <Text style={s.avgBadge}>Avg {avg}</Text>
          </View>
          <View style={s.chartRow}>
            {WEEK_MOODS.map((score, i) => (
              <View key={i} style={s.barCol}>
                <Animated.View style={[
                  s.bar,
                  {
                    height: bars[i].interpolate({ inputRange: [0, 1], outputRange: [0, (score / 5) * BAR_H] }),
                    backgroundColor: moodColor(score),
                  }
                ]} />
                <Text style={s.dayLabel}>{DAYS[i]}</Text>
              </View>
            ))}
          </View>
          <View style={s.legend}>
            {[[5, 'Great'], [4, 'Good'], [3, 'Okay'], [2, 'Low']].map(([score, lbl]) => (
              <View key={lbl} style={s.legendItem}>
                <View style={[s.legendDot, { backgroundColor: moodColor(+score) }]} />
                <Text style={s.legendTxt}>{lbl}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Quick actions */}
        <Text style={s.sectionTitle}>Quick Actions</Text>
        <View style={s.actionsGrid}>
          {QUICK_ACTIONS.map(a => (
            <TouchableOpacity
              key={a.label}
              style={[s.actionCard, CARD_SH, { backgroundColor: WHITE }]}
              onPress={() => nav.navigate(a.nav as any)}
            >
              <View style={[s.actionIcon, { backgroundColor: a.bg }]}>
                <Ionicons name={a.icon} size={24} color={a.color} />
              </View>
              <Text style={s.actionLabel}>{a.label}</Text>
              <Ionicons name="chevron-forward" size={14} color={PM} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Insights */}
        <Text style={s.sectionTitle}>AI Insights</Text>
        {[
          { icon: 'trending-up-outline' as const, color: '#52B788', text: 'Your mood improved on days when you journaled. Try journaling this week.' },
          { icon: 'moon-outline' as const, color: '#7C3AED', text: 'Your lowest mood scores tend to be on Saturdays. Consider a weekend self-care routine.' },
          { icon: 'flash-outline' as const, color: '#F59E0B', text: "You're on a 3-day check-in streak. Keep it up for bonus XP on day 7!" },
        ].map((ins, i) => (
          <View key={i} style={[s.insightCard, CARD_SH]}>
            <View style={[s.insightIcon, { backgroundColor: `${ins.color}15` }]}>
              <Ionicons name={ins.icon} size={20} color={ins.color} />
            </View>
            <Text style={s.insightTxt}>{ins.text}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root:   { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 22 },
  headerTitle: { fontFamily: fonts.display, fontSize: fontSizes.xl, color: WHITE, marginBottom: 4 },
  headerSub:   { fontFamily: fonts.body, fontSize: fontSizes.base, color: 'rgba(255,255,255,0.65)', marginBottom: 16 },
  statsRow:    { flexDirection: 'row', gap: 8 },
  statPill:    { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.14)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  statTxt:     { fontFamily: fonts.bodyMedium, fontSize: 11, color: 'rgba(255,255,255,0.88)' },

  scroll: { padding: 16 },

  card:      { backgroundColor: WHITE, borderRadius: 18, padding: 18, marginBottom: 14 },
  cardTitle: { fontFamily: fonts.displaySemibold, fontSize: fontSizes.md, color: DARK },
  rowBetween:{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  linkTxt:   { fontFamily: fonts.bodyBold, fontSize: fontSizes.sm, color: PURPLE },
  avgBadge:  { fontFamily: fonts.bodyBold, fontSize: fontSizes.sm, color: PURPLE, backgroundColor: PL, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },

  todayRow:   { flexDirection: 'row', alignItems: 'center', gap: 16 },
  todayBadge: { width: 60, height: 60, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  todayMood:  { fontFamily: fonts.display, fontSize: fontSizes.xl },
  todaySub:   { fontFamily: fonts.body, fontSize: fontSizes.sm, color: MUTED, marginTop: 2 },

  chartRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: BAR_H + 28, marginBottom: 12 },
  barCol:   { alignItems: 'center', flex: 1 },
  bar:      { width: 20, borderRadius: 6, marginBottom: 6 },
  dayLabel: { fontFamily: fonts.body, fontSize: fontSizes.xs, color: MUTED },
  legend:   { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  legendItem:{ flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendTxt: { fontFamily: fonts.body, fontSize: fontSizes.xs, color: MUTED },

  sectionTitle: { fontFamily: fonts.displaySemibold, fontSize: fontSizes.md, color: DARK, marginBottom: 12, marginTop: 8 },
  actionsGrid:  { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  actionCard:   { width: (W - 52) / 2, flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: PL },
  actionIcon:   { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  actionLabel:  { fontFamily: fonts.bodyMedium, fontSize: fontSizes.sm, color: DARK, flex: 1 },

  insightCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, backgroundColor: WHITE, borderRadius: 16, padding: 14, marginBottom: 10 },
  insightIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  insightTxt:  { fontFamily: fonts.body, fontSize: fontSizes.base, color: DARK, flex: 1, lineHeight: 21 },
});
