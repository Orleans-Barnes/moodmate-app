import React, { useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Animated, StatusBar, Dimensions,
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

const WEEK_SCORES = [3, 4, 5, 3, 4, 2, 4];
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const moodColor = (s: number) => s >= 5 ? '#52B788' : s >= 4 ? '#7C3AED' : s >= 3 ? '#93C5FD' : s >= 2 ? '#F87171' : '#EF4444';
const moodLabel = (s: number) => s >= 5 ? 'Great' : s >= 4 ? 'Good' : s >= 3 ? 'Okay' : s >= 2 ? 'Low' : 'Very Low';
const BAR_MAX = 70;

const HIGHLIGHTS = [
  { icon: 'flame' as const, color: '#F87171', label: '7-day streak', sub: 'Longest this month' },
  { icon: 'trophy-outline' as const, color: '#FCD34D', label: '+180 XP', sub: 'This week' },
  { icon: 'leaf-outline' as const, color: '#86EFAC', label: '3 tools used', sub: 'Breathe, Journal, DBT' },
  { icon: 'people-outline' as const, color: '#93C5FD', label: '1 session', sub: 'With Dr. Osei' },
];

export function WeeklyReportScreen() {
  const nav    = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const bars   = useRef(WEEK_SCORES.map(() => new Animated.Value(0))).current;
  const fadeIn = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeIn, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    Animated.stagger(80, bars.map(b =>
      Animated.spring(b, { toValue: 1, friction: 6, tension: 100, useNativeDriver: false })
    )).start();
  }, []);

  const avg   = Math.round(WEEK_SCORES.reduce((a, b) => a + b, 0) / WEEK_SCORES.length * 10) / 10;
  const best  = WEEK_SCORES.indexOf(Math.max(...WEEK_SCORES));

  return (
    <View style={[s.root, { backgroundColor: BG }]}>
      <StatusBar barStyle="light-content" />

      <LinearGradient colors={GRAD_H} style={[s.header, { paddingTop: insets.top + 16 }]}>
        <Animated.View style={{ opacity: fadeIn }}>
          <View style={s.topRow}>
            <TouchableOpacity onPress={() => nav.goBack()} style={s.backBtn}>
              <Ionicons name="chevron-back" size={24} color={WHITE} />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={s.headerTitle}>Weekly Report</Text>
              <Text style={s.headerSub}>Your wellness summary</Text>
            </View>
            <View style={s.datePill}>
              <Ionicons name="calendar-outline" size={12} color={PM} />
              <Text style={s.dateTxt}>Jul 6–12</Text>
            </View>
          </View>
        </Animated.View>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 100 }]}>

        {/* Highlights grid */}
        <View style={s.highlightGrid}>
          {HIGHLIGHTS.map(h => (
            <View key={h.label} style={[s.highlightCard, CARD_SH]}>
              <View style={[s.highlightIcon, { backgroundColor: h.color + '20' }]}>
                <Ionicons name={h.icon} size={20} color={h.color} />
              </View>
              <Text style={s.highlightVal}>{h.label}</Text>
              <Text style={s.highlightSub}>{h.sub}</Text>
            </View>
          ))}
        </View>

        {/* Mood chart */}
        <View style={[s.card, CARD_SH]}>
          <View style={s.cardTitleRow}>
            <Text style={s.cardTitle}>Mood This Week</Text>
            <View style={[s.avgBadge, { backgroundColor: `${moodColor(avg)}20` }]}>
              <Text style={[s.avgTxt, { color: moodColor(Math.round(avg)) }]}>Avg {avg}</Text>
            </View>
          </View>
          <View style={s.chartRow}>
            {WEEK_SCORES.map((score, i) => (
              <View key={i} style={s.barCol}>
                <Animated.View style={[
                  s.bar,
                  {
                    height: bars[i].interpolate({ inputRange: [0, 1], outputRange: [0, (score / 5) * BAR_MAX] }),
                    backgroundColor: moodColor(score),
                  }
                ]} />
                <Text style={s.barLabel}>{DAYS[i].slice(0, 1)}</Text>
              </View>
            ))}
          </View>
          <View style={s.bestRow}>
            <Ionicons name="star" size={14} color="#F59E0B" />
            <Text style={s.bestTxt}>Best day: {DAYS[best]} — {moodLabel(WEEK_SCORES[best])}</Text>
          </View>
        </View>

        {/* Tools used */}
        <View style={[s.card, CARD_SH]}>
          <Text style={s.cardTitle}>Tools Used</Text>
          {[
            { label: 'Breathe', icon: 'wind-outline' as const, color: '#2563EB', count: '3 sessions', xp: 30 },
            { label: 'Journal', icon: 'book-outline' as const, color: '#059669', count: '4 entries', xp: 60 },
            { label: 'DBT Skills', icon: 'library-outline' as const, color: '#DC2626', count: '2 skills', xp: 40 },
            { label: 'Meditation', icon: 'moon-outline' as const, color: '#7C3AED', count: '1 session', xp: 20 },
          ].map(tool => (
            <View key={tool.label} style={s.toolRow}>
              <View style={[s.toolIcon, { backgroundColor: tool.color + '15' }]}>
                <Ionicons name={tool.icon} size={18} color={tool.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.toolLabel}>{tool.label}</Text>
                <Text style={s.toolCount}>{tool.count}</Text>
              </View>
              <Text style={s.toolXP}>+{tool.xp} XP</Text>
            </View>
          ))}
        </View>

        {/* AI summary */}
        <View style={[s.aiCard, CARD_SH]}>
          <LinearGradient colors={['#7C3AED', '#9333EA']} style={s.aiGrad}>
            <View style={s.aiHeader}>
              <View style={s.aiAvatar}>
                <Ionicons name="hardware-chip-outline" size={18} color={WHITE} />
              </View>
              <Text style={s.aiTitle}>AI Weekly Summary</Text>
            </View>
            <Text style={s.aiText}>
              This was a meaningful week for you. Your mood averaged {avg}/5, with your best day on {DAYS[best]}. You consistently engaged with wellness tools — especially journaling, which often coincided with higher mood scores. Consider maintaining your journaling habit next week. One dip on Saturday — think about what could support you on weekends.
            </Text>
            <View style={s.aiTip}>
              <Ionicons name="bulb-outline" size={14} color="rgba(255,255,255,0.8)" />
              <Text style={s.aiTipTxt}>Tip: Plan one pleasant activity for next Saturday</Text>
            </View>
          </LinearGradient>
        </View>

        {/* Next week goals */}
        <View style={[s.card, CARD_SH]}>
          <Text style={s.cardTitle}>Next Week Goals</Text>
          {[
            'Complete a 7-day streak',
            'Try the Meditation Library',
            'Book a session with a counsellor',
          ].map((goal, i) => (
            <View key={i} style={s.goalRow}>
              <View style={s.goalDot} />
              <Text style={s.goalTxt}>{goal}</Text>
            </View>
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
  datePill:    { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.12)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  dateTxt:     { fontFamily: fonts.body, fontSize: fontSizes.xs, color: WHITE },

  scroll: { padding: 16 },

  highlightGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 14 },
  highlightCard: { width: (W - 52) / 2, backgroundColor: WHITE, borderRadius: 16, padding: 14, gap: 6 },
  highlightIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  highlightVal:  { fontFamily: fonts.displaySemibold, fontSize: fontSizes.base, color: DARK },
  highlightSub:  { fontFamily: fonts.body, fontSize: fontSizes.xs, color: MUTED },

  card:         { backgroundColor: WHITE, borderRadius: 18, padding: 18, marginBottom: 14 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  cardTitle:    { fontFamily: fonts.displaySemibold, fontSize: fontSizes.md, color: DARK },
  avgBadge:     { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  avgTxt:       { fontFamily: fonts.bodyBold, fontSize: fontSizes.sm },

  chartRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: BAR_MAX + 24, marginBottom: 12 },
  barCol:   { alignItems: 'center', flex: 1 },
  bar:      { width: 18, borderRadius: 5, marginBottom: 6 },
  barLabel: { fontFamily: fonts.body, fontSize: fontSizes.xs, color: MUTED },
  bestRow:  { flexDirection: 'row', alignItems: 'center', gap: 6 },
  bestTxt:  { fontFamily: fonts.body, fontSize: fontSizes.sm, color: DARK },

  toolRow:   { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderTopWidth: 1, borderTopColor: PL },
  toolIcon:  { width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  toolLabel: { fontFamily: fonts.bodyBold, fontSize: fontSizes.base, color: DARK, marginBottom: 2 },
  toolCount: { fontFamily: fonts.body, fontSize: fontSizes.xs, color: MUTED },
  toolXP:    { fontFamily: fonts.bodyBold, fontSize: fontSizes.sm, color: PURPLE },

  aiCard: { borderRadius: 20, overflow: 'hidden', marginBottom: 14 },
  aiGrad: { padding: 20, gap: 12 },
  aiHeader:{ flexDirection: 'row', alignItems: 'center', gap: 10 },
  aiAvatar:{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  aiTitle: { fontFamily: fonts.displaySemibold, fontSize: fontSizes.md, color: WHITE },
  aiText:  { fontFamily: fonts.body, fontSize: fontSizes.base, color: 'rgba(255,255,255,0.88)', lineHeight: 22 },
  aiTip:   { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 10, padding: 10 },
  aiTipTxt:{ fontFamily: fonts.bodyMedium, fontSize: fontSizes.sm, color: WHITE, flex: 1 },

  goalRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderTopWidth: 1, borderTopColor: PL },
  goalDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: PURPLE, flexShrink: 0 },
  goalTxt: { fontFamily: fonts.body, fontSize: fontSizes.base, color: DARK },
});
