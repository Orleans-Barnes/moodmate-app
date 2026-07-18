import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Card } from '@/components/Card';
import { Skeleton } from '@/components/Skeleton';
import { useAuthStore } from '@/state/useAuthStore';
import { useToast } from '@/state/useToast';
import { listCheckIns } from '@/api/checkin';
import type { CheckInResponse } from '@/api/types';
import { ApiRequestError } from '@/api/client';
import { colors, fonts, fontSizes, spacing } from '@/theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'MoodHistory'>;

// ── Emotion metadata ─────────────────────────────────────────────────────────
const EMOTION_META: Record<string, { emoji: string; color: string; bg: string; pixelColor: string }> = {
  HAPPY:        { emoji: '😊', color: colors.sun,       bg: colors.sunSoft,     pixelColor: '#FBBF24' },
  CALM:         { emoji: '😌', color: colors.sage,      bg: colors.sageSoft,    pixelColor: '#52B788' },
  HOPEFUL:      { emoji: '🌱', color: colors.sage,      bg: colors.sageSoft,    pixelColor: '#74C69D' },
  GRATEFUL:     { emoji: '🙏', color: colors.blue,      bg: colors.blueSoft,    pixelColor: '#5C8AE6' },
  MOTIVATED:    { emoji: '💪', color: colors.coral,     bg: colors.coralSoft,   pixelColor: '#F97316' },
  ANXIOUS:      { emoji: '😰', color: colors.coral,     bg: colors.coralSoft,   pixelColor: '#FB923C' },
  STRESSED:     { emoji: '😤', color: colors.coral,     bg: colors.coralSoft,   pixelColor: '#EF4444' },
  LONELY:       { emoji: '💙', color: colors.blue,      bg: colors.blueSoft,    pixelColor: '#93C5FD' },
  OVERWHELMED:  { emoji: '😵', color: colors.coral,     bg: colors.coralSoft,   pixelColor: '#DC2626' },
  SAD:          { emoji: '😔', color: colors.blue,      bg: colors.blueSoft,    pixelColor: '#818CF8' },
};

function toLabel(key: string): string {
  return key.charAt(0) + key.slice(1).toLowerCase();
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
  });
}

function StressBar({ value, color }: { value: number; color: string }) {
  const pct = Math.round(((value - 1) / 4) * 100);
  return (
    <View style={barStyles.track}>
      <View style={[barStyles.fill, { width: `${pct}%` as `${number}%`, backgroundColor: color }]} />
    </View>
  );
}
const barStyles = StyleSheet.create({
  track: { flex: 1, height: 5, backgroundColor: colors.line, borderRadius: 3, overflow: 'hidden' },
  fill:  { height: 5, borderRadius: 3 },
});

function insightLine(entries: CheckInResponse[]): string | null {
  if (entries.length === 0) return null;
  const counts: Record<string, number> = {};
  for (const e of entries) counts[e.emotionKey] = (counts[e.emotionKey] ?? 0) + 1;
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  const meta = EMOTION_META[top[0]];
  if (!meta) return null;
  const avgStress = entries.reduce((s, e) => s + e.stressLevel, 0) / entries.length;
  const stressWord = avgStress < 2.5 ? 'low' : avgStress < 3.5 ? 'moderate' : 'high';
  return `Most common: ${meta.emoji} ${toLabel(top[0])} · Average stress: ${stressWord}`;
}

// ── 30-day pixel grid ────────────────────────────────────────────────────────
const DAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function buildPixelGrid(entries: CheckInResponse[]) {
  // Map: dateStr (YYYY-MM-DD) → most recent emotionKey that day
  const map: Record<string, string> = {};
  for (const e of entries) {
    const d = e.createdAt.slice(0, 10); // YYYY-MM-DD
    if (!map[d]) map[d] = e.emotionKey; // first (most recent) wins
  }

  // Build last 30 days array newest → oldest, padded so grid starts on Sunday
  const today = new Date();
  const days: Array<{ dateStr: string; emotionKey: string | null; dayOfWeek: number; dayNum: number }> = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    days.push({ dateStr, emotionKey: map[dateStr] ?? null, dayOfWeek: d.getDay(), dayNum: d.getDate() });
  }
  return days;
}

interface PixelGridProps {
  entries: CheckInResponse[];
}
function PixelGrid({ entries }: PixelGridProps) {
  const days = buildPixelGrid(entries);
  // Pad left so first cell aligns to correct weekday column
  const firstDow = days[0].dayOfWeek;
  const padCount = firstDow; // 0 = Sunday

  return (
    <View style={pg.wrap}>
      {/* Weekday labels */}
      <View style={pg.row}>
        {DAY_LABELS.map((l) => (
          <Text key={l} style={pg.dayLabel}>{l}</Text>
        ))}
      </View>
      {/* Grid */}
      <View style={pg.grid}>
        {/* Leading empty cells */}
        {Array.from({ length: padCount }).map((_, i) => (
          <View key={`pad-${i}`} style={pg.cell} />
        ))}
        {days.map((day) => {
          const meta = day.emotionKey ? EMOTION_META[day.emotionKey] : null;
          return (
            <View
              key={day.dateStr}
              style={[
                pg.cell,
                { backgroundColor: meta ? meta.pixelColor : '#EDE8E3' },
              ]}
            >
              {day.dayNum === 1 && (
                <Text style={pg.monthLabel}>
                  {new Date(day.dateStr).toLocaleDateString('en-US', { month: 'short' })}
                </Text>
              )}
            </View>
          );
        })}
      </View>
      {/* Legend */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={pg.legend}>
        {Object.entries(EMOTION_META).map(([key, m]) => (
          <View key={key} style={pg.legendItem}>
            <View style={[pg.legendDot, { backgroundColor: m.pixelColor }]} />
            <Text style={pg.legendTxt}>{toLabel(key)}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const CELL = 34;
const pg = StyleSheet.create({
  wrap:        { backgroundColor: '#FFFFFF', borderRadius: 20, padding: spacing.lg, marginBottom: spacing.sm,
                 shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  row:         { flexDirection: 'row', marginBottom: 6 },
  dayLabel:    { width: CELL, textAlign: 'center', fontFamily: fonts.bodyBold, fontSize: 9, color: colors.inkFaint },
  grid:        { flexDirection: 'row', flexWrap: 'wrap' },
  cell:        { width: CELL, height: CELL, margin: 1.5, borderRadius: 8 },
  monthLabel:  { position: 'absolute', bottom: 1, left: 2, fontSize: 7, color: 'rgba(255,255,255,0.7)', fontFamily: fonts.bodyBold },
  legend:      { flexDirection: 'row', gap: 10, paddingTop: 10 },
  legendItem:  { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot:   { width: 10, height: 10, borderRadius: 3 },
  legendTxt:   { fontFamily: fonts.bodyMedium, fontSize: 9, color: colors.inkSoft },
});

// ── Screen ───────────────────────────────────────────────────────────────────
export function MoodHistoryScreen({ navigation }: Props) {
  const token = useAuthStore((s) => s.token);
  const toast = useToast();
  const [entries, setEntries] = useState<CheckInResponse[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    if (!token) return;
    setLoading(true);
    // Fetch up to 30 to cover the pixel grid
    listCheckIns(token, 0, 30)
      .then((page) => setEntries(page.content))
      .catch((err) => toast(err instanceof ApiRequestError ? err.message : 'Could not load mood history.'))
      .finally(() => setLoading(false));
  }, [token, toast]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const insight = insightLine(entries);

  return (
    <Screen
      backgroundColor={colors.bg}
      contentContainerStyle={styles.content}
      edges={{ top: true, bottom: false }}
      refreshing={loading && entries.length > 0}
      onRefresh={load}
      refreshTintColor={colors.coral}
    >
      <ScreenHeader title="Mood History" onClose={() => navigation.goBack()} />

      {/* ── 30-day pixel grid ── */}
      {entries.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Last 30 days</Text>
          <PixelGrid entries={entries} />
        </>
      )}

      {/* ── Insight card ── */}
      {insight && (
        <Card tint="lavender" style={styles.insightCard}>
          <Text style={styles.insightLabel}>This week at a glance</Text>
          <Text style={styles.insightText}>{insight}</Text>
        </Card>
      )}

      {/* ── Skeletons ── */}
      {loading && entries.length === 0 && (
        <>
          {[0, 1, 2, 3].map((i) => (
            <Card key={`skel-${i}`}>
              <View style={styles.skeletonRow}>
                <Skeleton width={36} height={36} style={{ borderRadius: 18 }} />
                <View style={styles.flex}>
                  <Skeleton width={100} height={12} />
                  <Skeleton width={60} height={10} style={{ marginTop: 6 }} />
                </View>
              </View>
            </Card>
          ))}
        </>
      )}

      {!loading && entries.length === 0 && (
        <Text style={styles.empty}>No check-ins yet. Tap "Check in" on the Home screen to log your first mood.</Text>
      )}

      {/* ── Entry list ── */}
      {entries.length > 0 && <Text style={styles.sectionTitle}>All entries</Text>}
      {entries.map((entry) => {
        const meta = EMOTION_META[entry.emotionKey] ?? { emoji: '😶', color: colors.inkSoft, bg: colors.surface, pixelColor: '#ccc' };
        return (
          <Card key={entry.id} style={styles.entryCard}>
            <View style={styles.entryTop}>
              <View style={[styles.emotionDot, { backgroundColor: meta.bg }]}>
                <Text style={styles.emotionEmoji}>{meta.emoji}</Text>
              </View>
              <View style={styles.flex}>
                <Text style={[styles.emotionLabel, { color: meta.color }]}>
                  {toLabel(entry.emotionKey)}
                </Text>
                <Text style={styles.dateText}>{formatDate(entry.createdAt)}</Text>
              </View>
            </View>

            <View style={styles.barsRow}>
              <View style={styles.barGroup}>
                <Text style={styles.barLabel}>Stress</Text>
                <StressBar value={entry.stressLevel} color={colors.coral} />
              </View>
              <View style={styles.barGroup}>
                <Text style={styles.barLabel}>Energy</Text>
                <StressBar value={entry.energyLevel} color={colors.sage} />
              </View>
            </View>

            {entry.note ? (
              <Text style={styles.note}>&ldquo;{entry.note}&rdquo;</Text>
            ) : null}
          </Card>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxxl * 2 },
  sectionTitle: { fontFamily: fonts.bodyBold, fontSize: fontSizes.sm, color: colors.ink, marginBottom: 8, marginTop: 4 },
  insightCard: { marginBottom: spacing.sm },
  insightLabel: { fontFamily: fonts.bodyBold, fontSize: 9, color: colors.blue, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 5 },
  insightText: { fontFamily: fonts.bodyMedium, fontSize: fontSizes.sm, color: colors.ink },
  skeletonRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  empty: { fontFamily: fonts.bodyMedium, fontSize: fontSizes.sm, color: colors.inkSoft, lineHeight: 20 },
  entryCard: { gap: spacing.sm },
  entryTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  emotionDot: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  emotionEmoji: { fontSize: 18 },
  emotionLabel: { fontFamily: fonts.bodyBold, fontSize: fontSizes.sm },
  dateText: { fontFamily: fonts.bodyMedium, fontSize: 10.5, color: colors.inkFaint, marginTop: 2 },
  barsRow: { flexDirection: 'row', gap: spacing.md },
  barGroup: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  barLabel: { fontFamily: fonts.bodyBold, fontSize: 9.5, color: colors.inkSoft, width: 38 },
  note: { fontFamily: fonts.bodyMedium, fontSize: fontSizes.xs, color: colors.inkSoft, fontStyle: 'italic', lineHeight: 18 },
});
