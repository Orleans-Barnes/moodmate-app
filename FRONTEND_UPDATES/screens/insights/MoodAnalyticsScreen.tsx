import React, { useRef, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Animated, Dimensions, StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { fonts, fontSizes } from '@/theme/tokens';

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

const WEEK  = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const SCORES_7  = [3, 4, 4, 2, 5, 4, 3];
const SCORES_30 = [3,3,4,2,5,4,3,4,3,3,2,5,4,4,3,2,3,4,5,4,4,3,4,3,4,4,2,3,5,4];

const moodColor = (s: number) => s >= 5 ? '#52B788' : s >= 4 ? '#7C3AED' : s >= 3 ? '#93C5FD' : s >= 2 ? '#F87171' : '#EF4444';
const moodLabel = (s: number) => s >= 5 ? 'Great' : s >= 4 ? 'Good' : s >= 3 ? 'Okay' : s >= 2 ? 'Low' : 'Very Low';

const BAR_MAX = 90;

const TABS = ['7 Days', '30 Days'] as const;

export function MoodAnalyticsScreen() {
  const nav    = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<'7 Days' | '30 Days'>('7 Days');

  const scores  = tab === '7 Days' ? SCORES_7 : SCORES_30;
  const labels  = tab === '7 Days' ? WEEK : scores.map((_, i) => `${i + 1}`);
  const avg     = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length * 10) / 10;
  const best    = Math.max(...scores);
  const worst   = Math.min(...scores);

  const bars = useRef(scores.map(() => new Animated.Value(0))).current;
  const headerOp = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(headerOp, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    bars.forEach(b => b.setValue(0));
    Animated.stagger(40, bars.map(b =>
      Animated.spring(b, { toValue: 1, friction: 6, tension: 100, useNativeDriver: false })
    )).start();
  }, [tab]);

  const moodDist = [5, 4, 3, 2, 1].map(lvl => ({
    label: moodLabel(lvl),
    color: moodColor(lvl),
    count: scores.filter(s => s === lvl).length,
    pct: Math.round(scores.filter(s => s === lvl).length / scores.length * 100),
  }));

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
              <Text style={s.headerTitle}>Mood Analytics</Text>
              <Text style={s.headerSub}>Track your emotional trends</Text>
            </View>
          </View>

          {/* Tab toggle */}
          <View style={s.tabs}>
            {TABS.map(t => (
              <TouchableOpacity
                key={t}
                style={[s.tab, tab === t && s.tabActive]}
                onPress={() => setTab(t)}
              >
                <Text style={[s.tabTxt, tab === t && s.tabTxtActive]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 100 }]}>

        {/* Summary row */}
        <View style={s.summaryRow}>
          {[
            { label: 'Average', val: avg.toString(), icon: 'stats-chart-outline' as const, color: PURPLE },
            { label: 'Best',    val: `${best}/5`,   icon: 'trending-up-outline' as const, color: '#52B788' },
            { label: 'Lowest',  val: `${worst}/5`,  icon: 'trending-down-outline' as const, color: '#F87171' },
          ].map(item => (
            <View key={item.label} style={[s.summaryCard, CARD_SH]}>
              <View style={[s.summaryIcon, { backgroundColor: `${item.color}18` }]}>
                <Ionicons name={item.icon} size={18} color={item.color} />
              </View>
              <Text style={[s.summaryVal, { color: item.color }]}>{item.val}</Text>
              <Text style={s.summaryLbl}>{item.label}</Text>
            </View>
          ))}
        </View>

        {/* Bar chart */}
        <View style={[s.card, CARD_SH]}>
          <Text style={s.cardTitle}>Mood Over Time</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={s.chartRow}>
              {scores.map((score, i) => (
                <View key={i} style={s.barCol}>
                  <Animated.View style={[
                    s.bar,
                    {
                      height: bars[i].interpolate({ inputRange: [0, 1], outputRange: [0, (score / 5) * BAR_MAX] }),
                      backgroundColor: moodColor(score),
                    }
                  ]} />
                  <Text style={s.barLabel}>{labels[i]}</Text>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Mood distribution */}
        <View style={[s.card, CARD_SH]}>
          <Text style={s.cardTitle}>Mood Distribution</Text>
          {moodDist.map(m => (
            <View key={m.label} style={s.distRow}>
              <View style={[s.distDot, { backgroundColor: m.color }]} />
              <Text style={s.distLabel}>{m.label}</Text>
              <View style={s.distBarWrap}>
                <View style={[s.distBar, { width: `${m.pct}%` as any, backgroundColor: m.color + '50' }]}>
                  <View style={[s.distBarFill, { width: `${m.pct}%` as any, backgroundColor: m.color }]} />
                </View>
              </View>
              <Text style={s.distPct}>{m.pct}%</Text>
            </View>
          ))}
        </View>

        {/* Insights */}
        <View style={[s.card, CARD_SH]}>
          <Text style={s.cardTitle}>AI Insights</Text>
          {[
            { icon: 'bulb-outline' as const, color: '#F59E0B', text: `Your average mood is ${avg}/5. ${avg >= 4 ? "You're doing great!" : avg >= 3 ? 'Moderate — consider adding more self-care.' : 'Reach out to a counsellor for support.'}` },
            { icon: 'moon-outline' as const, color: '#7C3AED', text: 'Your mood tends to dip mid-week. Try scheduling a short walk or breathing exercise on Wednesdays.' },
            { icon: 'trophy-outline' as const, color: '#52B788', text: `Your best mood was ${moodLabel(best)} (${best}/5). Reflect on what made those days special.` },
          ].map((ins, i) => (
            <View key={i} style={s.insightRow}>
              <View style={[s.insightIcon, { backgroundColor: ins.color + '15' }]}>
                <Ionicons name={ins.icon} size={18} color={ins.color} />
              </View>
              <Text style={s.insightTxt}>{ins.text}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root:   { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 20 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  backBtn:     { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: fonts.display, fontSize: fontSizes.xl, color: WHITE },
  headerSub:   { fontFamily: fonts.body, fontSize: fontSizes.sm, color: 'rgba(255,255,255,0.65)' },

  tabs:       { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 12, padding: 3 },
  tab:        { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 10 },
  tabActive:  { backgroundColor: WHITE },
  tabTxt:     { fontFamily: fonts.bodyMedium, fontSize: fontSizes.sm, color: 'rgba(255,255,255,0.65)' },
  tabTxtActive:{ fontFamily: fonts.bodyBold, fontSize: fontSizes.sm, color: PURPLE },

  scroll: { padding: 16 },

  summaryRow:  { flexDirection: 'row', gap: 10, marginBottom: 14 },
  summaryCard: { flex: 1, backgroundColor: WHITE, borderRadius: 16, padding: 14, alignItems: 'center', gap: 6 },
  summaryIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  summaryVal:  { fontFamily: fonts.display, fontSize: fontSizes.xl },
  summaryLbl:  { fontFamily: fonts.body, fontSize: fontSizes.xs, color: MUTED },

  card:      { backgroundColor: WHITE, borderRadius: 18, padding: 18, marginBottom: 14 },
  cardTitle: { fontFamily: fonts.displaySemibold, fontSize: fontSizes.md, color: DARK, marginBottom: 14 },

  chartRow: { flexDirection: 'row', alignItems: 'flex-end', height: BAR_MAX + 24, gap: 6, paddingHorizontal: 4 },
  barCol:   { alignItems: 'center', width: 22 },
  bar:      { width: 14, borderRadius: 5, marginBottom: 6 },
  barLabel: { fontFamily: fonts.body, fontSize: 9, color: MUTED },

  distRow:    { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  distDot:    { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  distLabel:  { fontFamily: fonts.body, fontSize: fontSizes.xs, color: DARK, width: 50 },
  distBarWrap:{ flex: 1, height: 8, backgroundColor: PL, borderRadius: 4, overflow: 'hidden' },
  distBar:    { height: '100%', borderRadius: 4 },
  distBarFill:{ height: '100%', borderRadius: 4 },
  distPct:    { fontFamily: fonts.bodyMedium, fontSize: fontSizes.xs, color: MUTED, width: 32, textAlign: 'right' },

  insightRow:  { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 12 },
  insightIcon: { width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  insightTxt:  { fontFamily: fonts.body, fontSize: fontSizes.base, color: DARK, flex: 1, lineHeight: 21 },
});
