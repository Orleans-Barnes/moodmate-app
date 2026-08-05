/**
 * SleepTrackerScreen — Log bedtime, wake time, quality and notes.
 * POST /api/sleep upserts on date, GET /api/sleep returns history desc.
 */
import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  Alert, TextInput, Modal, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { useAuthStore } from '@/state/useAuthStore';
import { apiGet, apiPost } from '@/api/client';
import { colors, fonts, fontSizes, spacing, radii, shadow, accents } from '@/theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'SleepTracker'>;

interface SleepLogView {
  id: number;
  logDate: string;       // "YYYY-MM-DD"
  bedtime: string;       // "HH:MM"
  wakeTime: string;      // "HH:MM"
  durationMins: number;
  quality: number;       // 1-5
  notes?: string;
}

const QUALITY_LABELS = ['', 'Very poor', 'Poor', 'Okay', 'Good', 'Excellent'];
const QUALITY_ICONS  = ['', '😫', '😞', '😐', '😊', '😁'];
const QUALITY_COLORS = ['', '#DC2626', '#F97316', '#D97706', '#16A34A', '#0891B2'];

function durationLabel(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function fmtDate(d: string): string {
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  if (d === today) return 'Today';
  if (d === yesterday) return 'Yesterday';
  return new Date(d + 'T00:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
}

/** Parse "HH:MM" into total minutes since midnight */
function toMins(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + (m || 0);
}

/** Calculate sleep duration (accounts for sleeping before midnight) */
function calcDuration(bed: string, wake: string): number {
  let bedM = toMins(bed);
  let wakeM = toMins(wake);
  if (wakeM <= bedM) wakeM += 1440; // crossed midnight
  return wakeM - bedM;
}

/** Pad single-digit to "HH:MM" */
function padTime(val: string): string {
  const digits = val.replace(/\D/g, '').slice(0, 4);
  if (digits.length <= 2) return digits;
  return digits.slice(0, 2) + ':' + digits.slice(2);
}

export function SleepTrackerScreen({ navigation }: Props) {
  const insets  = useSafeAreaInsets();
  const token   = useAuthStore((s) => s.token);
  const isGuest = useAuthStore((s) => s.user?.guest ?? false);

  const [logs, setLogs]       = useState<SleepLogView[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLog, setShowLog] = useState(false);

  // Form state
  const [bedtime, setBedtime]   = useState('22:30');
  const [wakeTime, setWakeTime] = useState('06:30');
  const [quality, setQuality]   = useState<number>(3);
  const [notes, setNotes]       = useState('');
  const [saving, setSaving]     = useState(false);

  const load = useCallback(async () => {
    if (!token || isGuest) { setLoading(false); return; }
    try {
      const data = await apiGet<SleepLogView[]>('/api/sleep', token);
      setLogs(data);
    } catch { /* offline */ }
    finally { setLoading(false); }
  }, [token, isGuest]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const openLog = () => {
    setBedtime('22:30'); setWakeTime('06:30'); setQuality(3); setNotes('');
    setShowLog(true);
  };

  const submit = async () => {
    if (!token) return;
    const bed  = bedtime.trim();
    const wake = wakeTime.trim();
    if (!/^\d{2}:\d{2}$/.test(bed) || !/^\d{2}:\d{2}$/.test(wake)) {
      Alert.alert('Invalid time', 'Enter times as HH:MM, e.g. 22:30');
      return;
    }
    const dur = calcDuration(bed, wake);
    if (dur < 60 || dur > 1200) {
      Alert.alert('Check your times', 'Duration looks wrong — make sure bedtime comes before wake time.');
      return;
    }
    setSaving(true);
    try {
      const log = await apiPost<SleepLogView>('/api/sleep', {
        logDate: new Date().toISOString().slice(0, 10),
        bedtime: bed,
        wakeTime: wake,
        durationMins: dur,
        quality,
        notes: notes.trim() || undefined,
      }, token);
      setLogs((prev) => {
        const filtered = prev.filter((l) => l.logDate !== log.logDate);
        return [log, ...filtered];
      });
      setShowLog(false);
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Could not save sleep log.');
    } finally { setSaving(false); }
  };

  // Stats from last 7 logs
  const recent7 = logs.slice(0, 7);
  const avgDur  = recent7.length > 0 ? Math.round(recent7.reduce((s, l) => s + l.durationMins, 0) / recent7.length) : 0;
  const avgQual = recent7.length > 0 ? (recent7.reduce((s, l) => s + l.quality, 0) / recent7.length).toFixed(1) : '—';

  return (
    <View style={s.root}>
      {/* Header */}
      <LinearGradient
        colors={['#24412A', '#579E65']}
        style={[s.header, { paddingTop: insets.top + spacing.md }]}
      >
        <Pressable onPress={() => navigation.goBack()} style={s.backBtn} hitSlop={12}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </Pressable>
        <View style={s.headerCenter}>
          <Text style={s.headerTitle}>Sleep Tracker</Text>
          <Text style={s.headerSub}>Rest is part of your wellness</Text>
        </View>
        <Pressable style={s.addBtn} onPress={openLog}>
          <Ionicons name="add" size={24} color="#fff" />
        </Pressable>
      </LinearGradient>

      {/* Stats bar */}
      {recent7.length >= 2 && (
        <View style={s.statsBar}>
          <View style={s.statPill}>
            <Text style={s.statVal}>{durationLabel(avgDur)}</Text>
            <Text style={s.statLbl}>Avg sleep</Text>
          </View>
          <View style={s.statDivider} />
          <View style={s.statPill}>
            <Text style={s.statVal}>{avgQual} / 5</Text>
            <Text style={s.statLbl}>Avg quality</Text>
          </View>
          <View style={s.statDivider} />
          <View style={s.statPill}>
            <Text style={s.statVal}>{recent7.length}</Text>
            <Text style={s.statLbl}>Days logged</Text>
          </View>
        </View>
      )}

      <ScrollView
        contentContainerStyle={[s.body, { paddingBottom: insets.bottom + 80 }]}
        showsVerticalScrollIndicator={false}
      >
        {isGuest ? (
          <View style={s.emptyWrap}>
            <Ionicons name="lock-closed-outline" size={40} color={colors.inkFaint} />
            <Text style={s.emptyTitle}>Create an account</Text>
            <Text style={s.emptySub}>Sleep tracking requires a free account to save your history.</Text>
          </View>
        ) : loading ? (
          <ActivityIndicator size="large" color={colors.coral} style={{ marginTop: 60 }} />
        ) : logs.length === 0 ? (
          <View style={s.emptyWrap}>
            <Ionicons name="moon" size={44} color={accents.sleep.accent} />
            <Text style={s.emptyTitle}>No sleep logs yet</Text>
            <Text style={s.emptySub}>Tap + to log last night's sleep and start tracking your rest patterns.</Text>
            <Pressable style={s.ctaBtn} onPress={openLog}>
              <Text style={s.ctaBtnTxt}>Log my sleep</Text>
            </Pressable>
          </View>
        ) : (
          <>
            {logs.map((log) => {
              const col = QUALITY_COLORS[log.quality];
              return (
                <View key={log.id} style={s.logCard}>
                  <View style={[s.qualityBar, { backgroundColor: col }]} />
                  <View style={s.logMain}>
                    <View style={s.logTop}>
                      <Text style={s.logDate}>{fmtDate(log.logDate)}</Text>
                      <Text style={[s.logQualityLbl, { color: col }]}>
                        {QUALITY_ICONS[log.quality]} {QUALITY_LABELS[log.quality]}
                      </Text>
                    </View>
                    <View style={s.logTimes}>
                      <View style={s.timeChip}>
                        <Ionicons name="moon-outline" size={13} color={colors.inkSoft} />
                        <Text style={s.timeChipTxt}>{log.bedtime}</Text>
                      </View>
                      <View style={s.timeLine} />
                      <View style={s.timeChip}>
                        <Ionicons name="sunny-outline" size={13} color={colors.inkSoft} />
                        <Text style={s.timeChipTxt}>{log.wakeTime}</Text>
                      </View>
                      <Text style={s.durTxt}>{durationLabel(log.durationMins)}</Text>
                    </View>
                    {log.notes ? <Text style={s.logNotes} numberOfLines={2}>{log.notes}</Text> : null}
                  </View>
                </View>
              );
            })}
          </>
        )}
      </ScrollView>

      {/* Log Sleep Modal */}
      <Modal visible={showLog} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <ScrollView
            style={s.modalScroll}
            contentContainerStyle={[s.modalSheet, { paddingBottom: insets.bottom + spacing.xl }]}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={s.modalTitle}>Log your sleep</Text>

            <View style={s.timeRow}>
              <View style={s.timeField}>
                <View style={{flexDirection:'row',alignItems:'center',gap:5}}><Ionicons name="moon" size={13} color={accents.sleep.accent} /><Text style={s.fieldLbl}>Bedtime</Text></View>
                <TextInput
                  style={s.timeInput}
                  value={bedtime}
                  onChangeText={(v) => setBedtime(padTime(v))}
                  placeholder="22:30"
                  placeholderTextColor={colors.inkFaint}
                  keyboardType="numeric"
                  maxLength={5}
                />
              </View>
              <View style={s.timeField}>
                <View style={{flexDirection:'row',alignItems:'center',gap:5}}><Ionicons name="sunny" size={13} color="#F59E0B" /><Text style={s.fieldLbl}>Wake time</Text></View>
                <TextInput
                  style={s.timeInput}
                  value={wakeTime}
                  onChangeText={(v) => setWakeTime(padTime(v))}
                  placeholder="06:30"
                  placeholderTextColor={colors.inkFaint}
                  keyboardType="numeric"
                  maxLength={5}
                />
              </View>
            </View>

            {bedtime.length === 5 && wakeTime.length === 5 && (
              <Text style={s.durationPreview}>
                Duration: {durationLabel(calcDuration(bedtime, wakeTime))}
              </Text>
            )}

            <Text style={s.fieldLbl}>Sleep quality</Text>
            <View style={s.qualityRow}>
              {[1, 2, 3, 4, 5].map((q) => (
                <Pressable
                  key={q}
                  style={[s.qualityBtn, quality === q && { backgroundColor: QUALITY_COLORS[q], borderColor: QUALITY_COLORS[q] }]}
                  onPress={() => setQuality(q)}
                >
                  <Text style={{ fontSize: 22 }}>{QUALITY_ICONS[q]}</Text>
                  <Text style={[s.qualityNum, quality === q && { color: '#fff' }]}>{q}</Text>
                </Pressable>
              ))}
            </View>
            {quality > 0 && (
              <Text style={[s.qualityCaption, { color: QUALITY_COLORS[quality] }]}>
                {QUALITY_LABELS[quality]}
              </Text>
            )}

            <Text style={s.fieldLbl}>Notes (optional)</Text>
            <TextInput
              style={[s.timeInput, { height: 80, textAlignVertical: 'top' }]}
              value={notes}
              onChangeText={setNotes}
              placeholder="How did you feel? Any disturbances?"
              placeholderTextColor={colors.inkFaint}
              multiline
            />

            <View style={s.modalBtns}>
              <Pressable style={s.cancelBtn} onPress={() => setShowLog(false)}>
                <Text style={s.cancelTxt}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[s.saveBtn, saving && { opacity: 0.5 }]}
                onPress={submit}
                disabled={saving}
              >
                <Text style={s.saveTxt}>{saving ? 'Saving…' : 'Save'}</Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },

  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingBottom: spacing.xl, gap: spacing.sm },
  backBtn: { padding: 4 },
  headerCenter: { flex: 1 },
  headerTitle: { fontFamily: fonts.display, fontSize: fontSizes.xl, color: '#fff' },
  headerSub:   { fontFamily: fonts.bodyMedium, fontSize: fontSizes.xs, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  addBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },

  statsBar:    { flexDirection: 'row', backgroundColor: colors.surface, marginHorizontal: spacing.lg, marginTop: -12, borderRadius: 14, padding: spacing.md, ...shadow.sm },
  statPill:    { flex: 1, alignItems: 'center' },
  statVal:     { fontFamily: fonts.display, fontSize: fontSizes.lg, color: '#24412A' },
  statLbl:     { fontFamily: fonts.bodyMedium, fontSize: fontSizes.xs, color: colors.inkSoft, marginTop: 2 },
  statDivider: { width: 1, backgroundColor: colors.line, marginVertical: 4 },

  body: { padding: spacing.lg, paddingTop: spacing.xl },

  emptyWrap:  { alignItems: 'center', paddingVertical: spacing.xxl },
  emptyIcon:  { fontSize: 52, marginBottom: spacing.lg },
  emptyTitle: { fontFamily: fonts.display, fontSize: fontSizes.xl, color: colors.ink, marginBottom: spacing.xs },
  emptySub:   { fontFamily: fonts.bodyMedium, fontSize: fontSizes.sm, color: colors.inkSoft, textAlign: 'center', lineHeight: 22, marginBottom: spacing.xl },
  ctaBtn:     { backgroundColor: '#579E65', paddingHorizontal: spacing.xxl, paddingVertical: 14, borderRadius: radii.pill },
  ctaBtnTxt:  { fontFamily: fonts.bodyBold, fontSize: fontSizes.base, color: '#fff' },

  logCard:    { flexDirection: 'row', backgroundColor: colors.surface, borderRadius: radii.lg, marginBottom: spacing.sm, overflow: 'hidden', ...shadow.sm },
  qualityBar: { width: 5 },
  logMain:    { flex: 1, padding: spacing.md, gap: 6 },
  logTop:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  logDate:    { fontFamily: fonts.bodyBold, fontSize: fontSizes.base, color: colors.ink },
  logQualityLbl: { fontFamily: fonts.bodyMedium, fontSize: fontSizes.sm },
  logTimes:   { flexDirection: 'row', alignItems: 'center', gap: 6 },
  timeChip:   { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: colors.bg, paddingHorizontal: 8, paddingVertical: 4, borderRadius: radii.sm },
  timeChipTxt:{ fontFamily: fonts.body, fontSize: fontSizes.xs, color: colors.inkSoft },
  timeLine:   { height: 1, flex: 1, backgroundColor: colors.line },
  durTxt:     { fontFamily: fonts.bodyBold, fontSize: fontSizes.xs, color: colors.inkSoft, marginLeft: 4 },
  logNotes:   { fontFamily: fonts.body, fontSize: fontSizes.xs, color: colors.inkSoft, fontStyle: 'italic' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalScroll:  { maxHeight: '90%' },
  modalSheet:   { backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: spacing.xl },
  modalTitle:   { fontFamily: fonts.display, fontSize: fontSizes.xl, color: colors.ink, marginBottom: spacing.lg },

  timeRow:   { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md },
  timeField: { flex: 1 },
  fieldLbl:  { fontFamily: fonts.bodyBold, fontSize: fontSizes.xs, color: colors.inkFaint, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: spacing.xs, marginTop: spacing.md },
  timeInput: { backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.line, borderRadius: radii.md, padding: spacing.md, fontFamily: fonts.body, fontSize: fontSizes.base, color: colors.ink },

  durationPreview: { fontFamily: fonts.bodyMedium, fontSize: fontSizes.sm, color: '#579E65', marginBottom: spacing.md },

  qualityRow:    { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  qualityBtn:    { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: radii.md, borderWidth: 1.5, borderColor: colors.line },
  qualityNum:    { fontFamily: fonts.bodyBold, fontSize: fontSizes.xs, color: colors.inkSoft, marginTop: 2 },
  qualityCaption:{ fontFamily: fonts.bodyBold, fontSize: fontSizes.sm, textAlign: 'center', marginTop: spacing.sm, marginBottom: spacing.md },

  modalBtns:  { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xl },
  cancelBtn:  { flex: 1, paddingVertical: 14, alignItems: 'center', borderRadius: radii.pill, borderWidth: 1.5, borderColor: colors.line },
  cancelTxt:  { fontFamily: fonts.bodyBold, fontSize: fontSizes.base, color: colors.inkSoft },
  saveBtn:    { flex: 1, paddingVertical: 14, alignItems: 'center', borderRadius: radii.pill, backgroundColor: '#24412A' },
  saveTxt:    { fontFamily: fonts.bodyBold, fontSize: fontSizes.base, color: '#fff' },
});
