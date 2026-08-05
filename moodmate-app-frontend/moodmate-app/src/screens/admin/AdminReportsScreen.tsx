import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import * as Print from 'expo-print';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { getCheckinAnalytics, getHealthPulse, getInstitutionAnalytics, getMoodAnalytics, type HealthPulse } from '@/api/support';
import { ApiRequestError } from '@/api/client';
import { useAuthStore } from '@/state/useAuthStore';
import { calm, fonts, fontSizes, radii, spacing } from '@/theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'AdminReports'>;
type Row = Record<string, unknown>;

function value(row: Row, key: string): string {
  const result = row[key];
  return result === null || result === undefined ? '—' : String(result);
}

export function AdminReportsScreen({ navigation }: Props) {
  const token = useAuthStore((state) => state.token) ?? '';
  const [pulse, setPulse] = useState<HealthPulse | null>(null);
  const [moods, setMoods] = useState<Row[]>([]);
  const [institutions, setInstitutions] = useState<Row[]>([]);
  const [checkins, setCheckins] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [pulseResult, moodResult, institutionResult, checkinResult] = await Promise.all([
        getHealthPulse(token),
        getMoodAnalytics(token),
        getInstitutionAnalytics(token),
        getCheckinAnalytics(token),
      ]);
      setPulse(pulseResult);
      setMoods(moodResult);
      setInstitutions(institutionResult);
      setCheckins(checkinResult);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Could not load the live report.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const exportPdf = async () => {
    if (!pulse) return;
    setExporting(true);
    try {
      const moodRows = moods.map((row) => `<tr><td>${value(row, 'emotion_key')}</td><td>${value(row, 'count')}</td></tr>`).join('');
      const schoolRows = institutions.slice(0, 10).map((row) => `<tr><td>${value(row, 'institution')}</td><td>${value(row, 'count')}</td></tr>`).join('');
      const html = `<html><body style="font-family: Arial; color: #24412A; padding: 28px"><h1>MoodMate Wellness Report</h1><p>Generated ${new Date().toLocaleString()}</p><h2>Health pulse</h2><ul><li>Total users: ${pulse.totalUsers}</li><li>Active today: ${pulse.activeToday}</li><li>Check-ins today: ${pulse.checkinsToday}</li><li>Average stress: ${pulse.avgStressLevel}</li><li>Open counsellor requests: ${pulse.pendingCounsellors}</li><li>Flagged posts: ${pulse.flaggedPosts}</li></ul><h2>Mood distribution, last 30 days</h2><table border="1" cellpadding="8" cellspacing="0"><tr><th>Mood</th><th>Count</th></tr>${moodRows}</table><h2>Institution breakdown</h2><table border="1" cellpadding="8" cellspacing="0"><tr><th>Institution</th><th>Students</th></tr>${schoolRows}</table><p>Daily check-in records included: ${checkins.length}</p></body></html>`;
      const { uri } = await Print.printToFileAsync({ html });
      await Share.share({ url: uri, title: 'MoodMate Wellness Report' });
    } catch {
      Alert.alert('Export unavailable', 'The report could not be exported on this device.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <View style={s.root}>
      <View style={s.header}><Pressable onPress={() => navigation.goBack()} hitSlop={10}><Ionicons name="chevron-back" size={23} color={calm.forest} /></Pressable><View style={s.headerCopy}><Text style={s.kicker}>ADMIN OPERATIONS</Text><Text style={s.title}>Wellness reports</Text></View><Ionicons name="bar-chart-outline" size={24} color={calm.primary} /></View>
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        {loading ? <ActivityIndicator color={calm.primary} style={s.loader} /> : error ? <View style={s.error}><Text style={s.errorText}>{error}</Text><Pressable style={s.retry} onPress={load}><Text style={s.retryText}>Retry</Text></Pressable></View> : pulse && <>
          <View style={s.pulseCard}><Text style={s.cardKicker}>LIVE HEALTH PULSE</Text><View style={s.metricGrid}>{[['Users', pulse.totalUsers], ['Active today', pulse.activeToday], ['Check-ins', pulse.checkinsToday], ['Avg stress', pulse.avgStressLevel]].map(([label, metric]) => <View key={String(label)} style={s.metric}><Text style={s.metricValue}>{String(metric)}</Text><Text style={s.metricLabel}>{String(label)}</Text></View>)}</View></View>
          <Text style={s.section}>Mood distribution</Text>{moods.slice(0, 6).map((row, index) => <View key={`${value(row, 'emotion_key')}-${index}`} style={s.row}><Text style={s.rowLabel}>{value(row, 'emotion_key')}</Text><Text style={s.rowValue}>{value(row, 'count')}</Text></View>)}
          <Text style={s.section}>Top institutions</Text>{institutions.slice(0, 6).map((row, index) => <View key={`${value(row, 'institution')}-${index}`} style={s.row}><Text style={s.rowLabel}>{value(row, 'institution')}</Text><Text style={s.rowValue}>{value(row, 'count')}</Text></View>)}
          <Pressable style={s.export} onPress={exportPdf} disabled={exporting}><Ionicons name="document-text-outline" size={19} color="#FFFFFF" /><Text style={s.exportText}>{exporting ? 'Preparing PDF…' : 'Export PDF report'}</Text></Pressable>
        </>}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({ root: { flex: 1, backgroundColor: calm.bg }, header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg, paddingTop: spacing.xl, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: calm.border }, headerCopy: { flex: 1 }, kicker: { fontFamily: fonts.bodyBold, fontSize: 10, letterSpacing: 1.2, color: calm.primary }, title: { fontFamily: fonts.display, fontSize: 21, color: calm.forest, marginTop: 3 }, content: { padding: spacing.lg, paddingBottom: 40 }, loader: { marginTop: 40 }, pulseCard: { backgroundColor: calm.forest, borderRadius: radii.lg, padding: spacing.lg }, cardKicker: { fontFamily: fonts.bodyBold, fontSize: 10, letterSpacing: 1.2, color: calm.mint }, metricGrid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: spacing.lg }, metric: { width: '50%', paddingVertical: spacing.sm }, metricValue: { fontFamily: fonts.display, fontSize: 24, color: '#FFFFFF' }, metricLabel: { fontFamily: fonts.body, fontSize: 11, color: calm.mutedOnDark, marginTop: 2 }, section: { fontFamily: fonts.display, fontSize: 18, color: calm.forest, marginTop: spacing.xl, marginBottom: spacing.sm }, row: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#FFFFFF', padding: spacing.md, borderBottomWidth: 1, borderBottomColor: calm.trackAlt }, rowLabel: { flex: 1, fontFamily: fonts.body, fontSize: 13, color: calm.ink }, rowValue: { fontFamily: fonts.bodyBold, fontSize: 13, color: calm.primary }, export: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, backgroundColor: calm.primary, borderRadius: radii.md, minHeight: 54, marginTop: spacing.xl }, exportText: { fontFamily: fonts.bodyBold, color: '#FFFFFF', fontSize: 14 }, error: { alignItems: 'center', paddingTop: 40 }, errorText: { fontFamily: fonts.body, color: calm.rust, textAlign: 'center' }, retry: { marginTop: spacing.md, padding: spacing.md }, retryText: { fontFamily: fonts.bodyBold, color: calm.primary },
});
