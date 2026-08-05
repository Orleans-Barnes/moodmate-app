/**
 * MoodHistoryScreen — Calm Forest "Your patterns" (Figma "24 Insights · Mood History")
 *
 * The backend has no standalone "mood score" field (only a categorical emotionKey plus 1–5
 * stressLevel/energyLevel — see api/types.ts's CheckInRequest) and Figma's line chart plots a
 * continuous mood value. The chart here plots a derived valence (1–10) per emotionKey instead —
 * documented as an approximation, not a stored metric. Everything else (emotion frequencies,
 * the stress alert) is computed directly from real check-in history.
 */
import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { useAuthStore } from '@/state/useAuthStore';
import { useToast } from '@/state/useToast';
import { listCheckIns } from '@/api/checkin';
import type { CheckInResponse } from '@/api/types';
import { ApiRequestError } from '@/api/client';
import { fonts, fontSizes, spacing, radii, calm, accents } from '@/theme/tokens';
import { Ionicons } from '@expo/vector-icons';
import { EMOTION_ICONS, type IonName } from '@/theme/iconMap';

type Props = NativeStackScreenProps<RootStackParamList, 'MoodHistory'>;
type Range = 'week' | 'month' | 'term';

// Same emotion → semantic-accent mapping as components/EmotionWheel.tsx, so an emotion reads as
// the same color everywhere in the app rather than picking its own hex per screen.
const EMOTION_META: Record<string, { icon: IonName; color: string; valence: number }> = {
  HAPPY: { icon: EMOTION_ICONS.HAPPY, color: accents.focus.accent, valence: 9 },
  CALM: { icon: EMOTION_ICONS.CALM, color: accents.calm.accent, valence: 8 },
  HOPEFUL: { icon: EMOTION_ICONS.HOPEFUL, color: accents.wellness.accent, valence: 8 },
  GRATEFUL: { icon: EMOTION_ICONS.GRATEFUL, color: accents.gratitude.accent, valence: 8 },
  MOTIVATED: { icon: EMOTION_ICONS.MOTIVATED, color: accents.energy.accent, valence: 7 },
  ANXIOUS: { icon: EMOTION_ICONS.ANXIOUS, color: accents.anxiety.accent, valence: 4 },
  STRESSED: { icon: EMOTION_ICONS.STRESSED, color: accents.creativity.accent, valence: 3 },
  LONELY: { icon: EMOTION_ICONS.LONELY, color: accents.sleep.accent, valence: 3 },
  OVERWHELMED: { icon: EMOTION_ICONS.OVERWHELMED, color: accents.learning.accent, valence: 2 },
  FRUSTRATED: { icon: EMOTION_ICONS.FRUSTRATED, color: accents.social.accent, valence: 3 },
};
const FALLBACK_META = { icon: 'remove-outline' as IonName, color: calm.muted, valence: 5 };

function toLabel(key: string) { return key.charAt(0) + key.slice(1).toLowerCase(); }

const RANGE_DAYS: Record<Range, number> = { week: 7, month: 30, term: 90 };

function withinRange(entry: CheckInResponse, days: number) {
  const cutoff = Date.now() - days * 86400000;
  return new Date(entry.createdAt).getTime() >= cutoff;
}

function MoodLineChart({ points }: { points: { label: string; value: number }[] }) {
  const W = 280;
  const H = 95;
  const n = points.length;
  if (n === 0) return <View style={{ height: H }} />;
  const coords = points.map((p, i) => ({
    x: n === 1 ? W / 2 : (i / (n - 1)) * W,
    y: H - ((p.value - 1) / 9) * H,
  }));

  return (
    <View style={{ width: W, height: H }}>
      {coords.slice(1).map((c, i) => {
        const prev = coords[i];
        const dx = c.x - prev.x;
        const dy = c.y - prev.y;
        const length = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx);
        return (
          <View
            key={i}
            style={{
              position: 'absolute', left: prev.x, top: prev.y,
              width: length, height: 2, backgroundColor: calm.primary,
              transform: [{ translateY: -1 }, { rotate: `${angle}rad` }],
              transformOrigin: 'left center' as any,
            }}
          />
        );
      })}
      {coords.map((c, i) => (
        <View key={i} style={{ position: 'absolute', left: c.x - 4, top: c.y - 4, width: 8, height: 8, borderRadius: 4, backgroundColor: '#FFFFFF', borderWidth: 2, borderColor: calm.primary }} />
      ))}
    </View>
  );
}

export function MoodHistoryScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const token = useAuthStore((s) => s.token);
  const toast = useToast();
  const [entries, setEntries] = useState<CheckInResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<Range>('week');

  const load = useCallback(() => {
    if (!token) return;
    setLoading(true);
    listCheckIns(token, 0, 90)
      .then((page) => setEntries(page.content))
      .catch((err) => toast(err instanceof ApiRequestError ? err.message : 'Could not load mood history.'))
      .finally(() => setLoading(false));
  }, [token, toast]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const scoped = useMemo(
    () => entries.filter((e) => withinRange(e, RANGE_DAYS[range])).slice().reverse(),
    [entries, range],
  );

  const chartPoints = useMemo(() => {
    const bucketSize = range === 'week' ? 1 : range === 'month' ? 5 : 10;
    const buckets: number[][] = [];
    scoped.forEach((e, i) => {
      const idx = Math.floor(i / bucketSize);
      const meta = EMOTION_META[e.emotionKey] ?? FALLBACK_META;
      (buckets[idx] ??= []).push(meta.valence);
    });
    return buckets
      .filter((b) => b.length > 0)
      .map((b, i) => ({ label: String(i + 1), value: b.reduce((a, v) => a + v, 0) / b.length }));
  }, [scoped, range]);

  const avgMood = chartPoints.length > 0
    ? chartPoints.reduce((a, p) => a + p.value, 0) / chartPoints.length
    : 0;

  const emotionCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    scoped.forEach((e) => { counts[e.emotionKey] = (counts[e.emotionKey] ?? 0) + 1; });
    const total = scoped.length || 1;
    return Object.entries(counts)
      .map(([key, count]) => ({ key, pct: Math.round((count / total) * 100) }))
      .sort((a, b) => b.pct - a.pct)
      .slice(0, 4);
  }, [scoped]);

  // Burnout-style alert: real signal computed from actual data — 5+ recent high-stress check-ins.
  const recentHighStress = scoped.slice(-7).filter((e) => e.stressLevel >= 4);
  const showAlert = recentHighStress.length >= 5;

  return (
    <View style={[s.root, { paddingTop: insets.top + spacing.lg }]}>
      <ScrollView contentContainerStyle={[s.content, { paddingBottom: insets.bottom + spacing.xxxl }]} showsVerticalScrollIndicator={false}>
        <View style={s.headerRow}>
          <Text style={s.title}>Your patterns</Text>
          <Pressable onPress={() => navigation.goBack()} hitSlop={12} accessibilityRole="button" accessibilityLabel="Close">
            <Ionicons name="close" size={22} color={calm.muted} />
          </Pressable>
        </View>

        <View style={s.segmented}>
          {(['week', 'month', 'term'] as Range[]).map((r) => (
            <Pressable key={r} style={[s.segment, range === r && s.segmentActive]} onPress={() => setRange(r)}>
              <Text style={[s.segmentText, range === r && s.segmentTextActive]}>
                {r === 'week' ? 'Week' : r === 'month' ? 'Month' : 'Term'}
              </Text>
            </Pressable>
          ))}
        </View>

        {scoped.length === 0 ? (
          <Text style={s.empty}>No check-ins in this range yet. Log a mood check-in to see your patterns.</Text>
        ) : (
          <>
            <View style={s.chartCard}>
              <Text style={s.chartTitle}>Mood</Text>
              <Text style={s.chartAvg}>avg {avgMood.toFixed(1)} / 10</Text>
              <View style={{ alignItems: 'center', marginTop: spacing.sm }}>
                <MoodLineChart points={chartPoints} />
              </View>
            </View>

            <View style={s.emotionsCard}>
              <Text style={s.cardTitle}>Most-felt this {range === 'week' ? 'week' : range === 'month' ? 'month' : 'term'}</Text>
              {emotionCounts.map(({ key, pct }) => {
                const meta = EMOTION_META[key] ?? FALLBACK_META;
                return (
                  <View key={key} style={s.emotionRow}>
                    <Ionicons name={meta.icon} size={16} color={meta.color} />
                    <Text style={s.emotionLabel}>{toLabel(key)}</Text>
                    <View style={s.emotionTrack}>
                      <View style={[s.emotionFill, { width: `${pct}%`, backgroundColor: meta.color }]} />
                    </View>
                    <Text style={s.emotionPct}>{pct}%</Text>
                  </View>
                );
              })}
            </View>

            {showAlert && (
              <View style={s.alertCard}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <Ionicons name="warning-outline" size={16} color={calm.alertText} />
                  <Text style={s.alertLabel}>ACADEMIC STRESS ALERT</Text>
                </View>
                <Text style={s.alertBody}>
                  Stress has been high across most of your last {recentHighStress.length} check-ins. That combination is an early burnout signal.
                </Text>
                <Pressable style={s.alertBtn} onPress={() => (navigation as any).navigate('Main', { screen: 'Support' })}>
                  <Text style={s.alertBtnText}>Talk to a counsellor</Text>
                </Pressable>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: calm.bg },
  content: { paddingHorizontal: spacing.xl, gap: spacing.lg },

  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontFamily: fonts.displayExtraBold, fontSize: fontSizes.xxl + 4, color: calm.forest, letterSpacing: -0.45 },
  close: { fontFamily: fonts.bodyBold, fontSize: 20, color: calm.forest },

  segmented: { flexDirection: 'row', backgroundColor: '#E8EDE9', borderRadius: radii.pill, padding: 4, gap: 4 },
  segment: { flex: 1, paddingVertical: 9, borderRadius: radii.pill, alignItems: 'center' },
  segmentActive: { backgroundColor: calm.primary },
  segmentText: { fontFamily: fonts.bodyBold, fontSize: fontSizes.base - 2, color: calm.forest },
  segmentTextActive: { color: '#FFFFFF' },

  empty: { fontFamily: fonts.body, fontSize: fontSizes.sm, color: calm.muted, textAlign: 'center', paddingVertical: spacing.xxxl, lineHeight: 20 },

  chartCard: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: calm.border, borderRadius: radii.card, padding: spacing.lg, alignItems: 'center' },
  chartTitle: { fontFamily: fonts.bodyBold, fontSize: fontSizes.base, color: calm.forest },
  chartAvg: { fontFamily: fonts.bodyMedium, fontSize: fontSizes.sm, color: calm.primary, marginTop: 2 },

  emotionsCard: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: calm.border, borderRadius: radii.card, padding: spacing.lg, gap: spacing.md },
  cardTitle: { fontFamily: fonts.bodyBold, fontSize: fontSizes.base, color: calm.forest },
  emotionRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  emotionLabel: { fontFamily: fonts.bodyMedium, fontSize: fontSizes.base - 2, color: calm.forest, width: 78 },
  emotionTrack: { flex: 1, height: 10, backgroundColor: calm.trackAlt, borderRadius: radii.pill, overflow: 'hidden' },
  emotionFill: { height: 10, borderRadius: radii.pill },
  emotionPct: { fontFamily: fonts.body, fontSize: fontSizes.sm - 1, color: calm.muted, width: 32, textAlign: 'right' },

  alertCard: { backgroundColor: '#FFFFFF', borderRadius: radii.card, padding: spacing.lg, gap: spacing.sm, borderWidth: 1, borderColor: calm.border },
  alertLabel: { fontFamily: fonts.bodyBold, fontSize: fontSizes.xs, color: calm.alertText, letterSpacing: 0.5 },
  alertBody: { fontFamily: fonts.body, fontSize: fontSizes.base - 2, color: calm.alertTextSoft, lineHeight: 21 },
  alertBtn: { backgroundColor: calm.alertCta, borderRadius: radii.pill, paddingHorizontal: 18, paddingVertical: 12, alignSelf: 'flex-start', marginTop: spacing.xs },
  alertBtnText: { fontFamily: fonts.bodyBold, fontSize: fontSizes.sm + 1, color: '#FFFFFF' },
});
