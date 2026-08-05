/**
 * HabitTrackerScreen — Finch/Moodfit-inspired daily habit tracking.
 * Habits are stored on the backend; today's completions are toggled with one tap.
 * Shows streak for each habit.
 */
import React, { useCallback, useEffect, useState } from 'react';
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
import { apiGet, apiPost, apiDelete } from '@/api/client';
import { HABIT_ICONS, HABIT_PRESET_ICONS, resolveIcon, type IonName } from '@/theme/iconMap';
import { colors, fonts, fontSizes, radii, spacing, shadow, calm, accents } from '@/theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'HabitTracker'>;

interface HabitView {
  id: number;
  name: string;
  icon: string;
  color: string;
  completedToday: boolean;
  streakDays: number;
}

// Each preset's color is its nearest semantic accent token (tokens.ts) rather than an arbitrary
// hex — keeps the picker below drawing from the same curated palette as the rest of the app.
const PRESET_HABITS = [
  { name: 'Drink 8 glasses of water', icon: HABIT_PRESET_ICONS['Drink 8 glasses of water'], color: accents.calm.accent },
  { name: '30 mins of exercise',       icon: HABIT_PRESET_ICONS['30 mins of exercise'], color: accents.energy.accent },
  { name: 'Read for 20 minutes',       icon: HABIT_PRESET_ICONS['Read for 20 minutes'], color: accents.learning.accent },
  { name: 'Meditate or breathe',       icon: HABIT_PRESET_ICONS['Meditate or breathe'], color: accents.wellness.accent },
  { name: 'Sleep before midnight',     icon: HABIT_PRESET_ICONS['Sleep before midnight'], color: accents.sleep.accent },
  { name: 'Eat a healthy meal',        icon: HABIT_PRESET_ICONS['Eat a healthy meal'], color: accents.gratitude.accent },
  { name: 'Journal today',             icon: HABIT_PRESET_ICONS['Journal today'], color: accents.creativity.accent },
  { name: 'No social media after 9pm', icon: HABIT_PRESET_ICONS['No social media after 9pm'], color: accents.anxiety.accent },
  { name: 'Take a short walk outside', icon: HABIT_PRESET_ICONS['Take a short walk outside'], color: accents.focus.accent },
  { name: 'Call or text a friend',     icon: HABIT_PRESET_ICONS['Call or text a friend'], color: accents.social.accent },
];

const ICONS = HABIT_ICONS;
// Color picker now offers exactly the semantic accent palette, so a user-chosen habit color is
// never a random hex — it's always one of the app's curated content tones.
const COLORS = Object.values(accents).map((a) => a.accent);

export function HabitTrackerScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const token  = useAuthStore((s) => s.token);
  const isGuest = useAuthStore((s) => s.user?.guest ?? false);

  const [habits, setHabits]   = useState<HabitView[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newIcon, setNewIcon] = useState<IonName>('checkmark-circle-outline');
  const [newColor, setNewColor] = useState(accents.wellness.accent);
  const [saving, setSaving]   = useState(false);

  const load = useCallback(async () => {
    if (!token || isGuest) { setLoading(false); return; }
    try {
      const data = await apiGet<HabitView[]>('/api/habits', token);
      setHabits(data);
    } catch { /* offline — keep stale */ }
    finally { setLoading(false); }
  }, [token, isGuest]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const toggle = async (h: HabitView) => {
    if (!token) return;
    // Optimistic update
    setHabits((prev) => prev.map((x) =>
      x.id === h.id
        ? { ...x, completedToday: !x.completedToday, streakDays: !x.completedToday ? x.streakDays + 1 : Math.max(0, x.streakDays - 1) }
        : x,
    ));
    try {
      await apiPost<{ completed: boolean }>(`/api/habits/${h.id}/toggle`, undefined, token);
    } catch {
      load(); // revert on error
    }
  };

  const addHabit = async (name: string, icon: string, color: string) => {
    if (!token || !name.trim()) return;
    setSaving(true);
    try {
      const h = await apiPost<HabitView>('/api/habits', { name: name.trim(), icon, color }, token);
      setHabits((prev) => [...prev, h]);
      setShowAdd(false);
      setNewName(''); setNewIcon('checkmark-circle-outline'); setNewColor(accents.wellness.accent);
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Could not add habit.');
    } finally { setSaving(false); }
  };

  const deleteHabit = (h: HabitView) => {
    Alert.alert('Remove habit', `Remove "${h.name}"? Your streak will be lost.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: async () => {
        if (!token) return;
        setHabits((prev) => prev.filter((x) => x.id !== h.id));
        try { await apiDelete(`/api/habits/${h.id}`, token); }
        catch { load(); }
      }},
    ]);
  };

  const doneCount = habits.filter((h) => h.completedToday).length;
  const pct = habits.length > 0 ? doneCount / habits.length : 0;

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
          <Text style={s.headerTitle}>Habit Tracker</Text>
          <Text style={s.headerSub}>Build streaks, build a better you</Text>
        </View>
        <Pressable style={s.addBtn} onPress={() => setShowAdd(true)}>
          <Ionicons name="add" size={24} color="#fff" />
        </Pressable>
      </LinearGradient>

      {/* Progress bar */}
      {habits.length > 0 && (
        <View style={s.progressWrap}>
          <View style={s.progressRow}>
            <Text style={s.progressTxt}>{doneCount}/{habits.length} done today</Text>
            <Text style={s.progressPct}>{Math.round(pct * 100)}%</Text>
          </View>
          <View style={s.progressTrack}>
            <LinearGradient
              colors={['#579E65', '#468752']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={[s.progressFill, { width: `${pct * 100}%` as any }]}
            />
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
            <Text style={s.emptySub}>Habit tracking requires a free account to save your streaks.</Text>
          </View>
        ) : loading ? (
          <ActivityIndicator size="large" color={colors.sage} style={{ marginTop: 60 }} />
        ) : habits.length === 0 ? (
          <>
            <View style={s.emptyWrap}>
              <Ionicons name="repeat-outline" size={44} color={colors.coral} />
              <Text style={s.emptyTitle}>Start your first habit</Text>
              <Text style={s.emptySub}>Tap + to add a habit, or pick from our presets below.</Text>
            </View>
            <Text style={s.presetTitle}>Quick add</Text>
            <View style={s.presetGrid}>
              {PRESET_HABITS.map((p) => (
                <Pressable
                  key={p.name}
                  style={[s.presetChip, { borderColor: p.color }]}
                  onPress={() => addHabit(p.name, p.icon, p.color)}
                >
                  <Ionicons name={p.icon} size={22} color={p.color} />
                  <Text style={s.presetTxt}>{p.name}</Text>
                </Pressable>
              ))}
            </View>
          </>
        ) : (
          <>
            {habits.map((h) => (
              <Pressable
                key={h.id}
                style={[s.habitCard, h.completedToday && s.habitCardDone]}
                onPress={() => toggle(h)}
                onLongPress={() => deleteHabit(h)}
              >
                <View style={[s.habitIcon, { backgroundColor: h.color + '22' }]}>
                  <Ionicons name={resolveIcon(h.icon, 'checkmark-circle-outline')} size={22} color={h.color} />
                </View>
                <View style={s.habitInfo}>
                  <Text style={[s.habitName, h.completedToday && s.habitNameDone]}>{h.name}</Text>
                  {h.streakDays > 0 && (
                    <View style={{flexDirection:'row',alignItems:'center',gap:3}}><Ionicons name="flame" size={12} color="#F97316" /><Text style={s.streakTxt}>{h.streakDays} day streak</Text></View>
                  )}
                </View>
                <View style={[s.checkCircle, h.completedToday && { backgroundColor: h.color }]}>
                  {h.completedToday && <Ionicons name="checkmark" size={18} color="#fff" />}
                </View>
              </Pressable>
            ))}
            <Text style={s.longPressTip}>Long-press a habit to remove it</Text>

            {/* Quick add presets */}
            <Text style={[s.presetTitle, { marginTop: spacing.xl }]}>Add more habits</Text>
            <View style={s.presetGrid}>
              {PRESET_HABITS.filter((p) => !habits.find((h) => h.name === p.name)).slice(0, 4).map((p) => (
                <Pressable
                  key={p.name}
                  style={[s.presetChip, { borderColor: p.color }]}
                  onPress={() => addHabit(p.name, p.icon, p.color)}
                >
                  <Ionicons name={p.icon} size={22} color={p.color} />
                  <Text style={s.presetTxt}>{p.name}</Text>
                </Pressable>
              ))}
            </View>
          </>
        )}
      </ScrollView>

      {/* Add Habit Modal */}
      <Modal visible={showAdd} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={[s.modalSheet, { paddingBottom: insets.bottom + spacing.xl }]}>
            <Text style={s.modalTitle}>New habit</Text>
            <TextInput
              style={s.modalInput}
              value={newName}
              onChangeText={setNewName}
              placeholder="e.g. Read for 20 minutes"
              placeholderTextColor={colors.inkFaint}
              autoFocus
            />
            <Text style={s.modalLabel}>Icon</Text>
            <View style={s.iconRow}>
              {ICONS.map((ic) => (
                <Pressable
                  key={ic}
                  style={[s.iconPill, newIcon === ic && { borderColor: newColor, borderWidth: 2 }]}
                  onPress={() => setNewIcon(ic)}
                >
                  <Ionicons name={ic} size={22} color={newIcon === ic ? newColor : colors.inkSoft} />
                </Pressable>
              ))}
            </View>
            <Text style={s.modalLabel}>Color</Text>
            <View style={s.colorRow}>
              {COLORS.map((c) => (
                <Pressable
                  key={c}
                  style={[s.colorDot, { backgroundColor: c }, newColor === c && s.colorDotActive]}
                  onPress={() => setNewColor(c)}
                />
              ))}
            </View>
            <View style={s.modalBtns}>
              <Pressable style={s.modalCancel} onPress={() => setShowAdd(false)}>
                <Text style={s.modalCancelTxt}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[s.modalAdd, { backgroundColor: newColor, opacity: !newName.trim() || saving ? 0.5 : 1 }]}
                onPress={() => addHabit(newName, newIcon, newColor)}
                disabled={!newName.trim() || saving}
              >
                <Text style={s.modalAddTxt}>{saving ? 'Adding…' : 'Add habit'}</Text>
              </Pressable>
            </View>
          </View>
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

  progressWrap: { padding: spacing.lg, paddingBottom: spacing.sm },
  progressRow:  { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressTxt:  { fontFamily: fonts.bodyMedium, fontSize: fontSizes.sm, color: colors.inkSoft },
  progressPct:  { fontFamily: fonts.bodyBold, fontSize: fontSizes.sm, color: colors.sage },
  progressTrack:{ height: 8, backgroundColor: colors.line, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: 8, borderRadius: 4 },

  body: { padding: spacing.lg },

  emptyWrap:  { alignItems: 'center', paddingVertical: spacing.xxl },
  emptyIcon:  { fontSize: 52, marginBottom: spacing.lg },
  emptyTitle: { fontFamily: fonts.display, fontSize: fontSizes.xl, color: colors.ink, marginBottom: spacing.xs },
  emptySub:   { fontFamily: fonts.bodyMedium, fontSize: fontSizes.sm, color: colors.inkSoft, textAlign: 'center', lineHeight: 22 },

  presetTitle: { fontFamily: fonts.bodyBold, fontSize: fontSizes.sm, color: colors.inkSoft, marginBottom: spacing.md, textTransform: 'uppercase', letterSpacing: 0.4 },
  presetGrid:  { gap: spacing.sm },
  presetChip:  { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, borderWidth: 1.5, borderRadius: radii.md, padding: spacing.md, backgroundColor: colors.surface },
  presetIcon:  { fontSize: 20 },
  presetTxt:   { fontFamily: fonts.bodyMedium, fontSize: fontSizes.sm, color: colors.ink, flex: 1 },

  habitCard:     { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: radii.lg, padding: spacing.md, marginBottom: spacing.sm, gap: spacing.md, ...shadow.sm },
  habitCardDone: { backgroundColor: '#F0FFF4' },
  habitIcon:     { width: 44, height: 44, borderRadius: radii.md, alignItems: 'center', justifyContent: 'center' },
  habitIconTxt:  { fontSize: 22 },
  habitInfo:     { flex: 1 },
  habitName:     { fontFamily: fonts.bodyBold, fontSize: fontSizes.base, color: colors.ink },
  habitNameDone: { color: colors.sage, textDecorationLine: 'line-through' },
  streakTxt:     { fontFamily: fonts.bodyMedium, fontSize: fontSizes.xs, color: colors.inkSoft, marginTop: 2 },
  checkCircle:   { width: 32, height: 32, borderRadius: 16, borderWidth: 2, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  longPressTip:  { fontFamily: fonts.bodyMedium, fontSize: fontSizes.xs, color: colors.inkFaint, textAlign: 'center', marginTop: spacing.md },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet:   { backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: spacing.xl },
  modalTitle:   { fontFamily: fonts.display, fontSize: fontSizes.xl, color: colors.ink, marginBottom: spacing.lg },
  modalInput:   { backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.line, borderRadius: radii.md, padding: spacing.md, fontFamily: fonts.body, fontSize: fontSizes.base, color: colors.ink, marginBottom: spacing.lg },
  modalLabel:   { fontFamily: fonts.bodyBold, fontSize: fontSizes.xs, color: colors.inkFaint, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: spacing.sm },
  iconRow:      { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
  iconPill:     { width: 44, height: 44, borderRadius: radii.md, borderWidth: 1.5, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  colorRow:     { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.xl },
  colorDot:     { width: 30, height: 30, borderRadius: 15 },
  colorDotActive:{ borderWidth: 3, borderColor: colors.ink },
  modalBtns:    { flexDirection: 'row', gap: spacing.md },
  modalCancel:  { flex: 1, paddingVertical: 14, alignItems: 'center', borderRadius: radii.pill, borderWidth: 1.5, borderColor: colors.line },
  modalCancelTxt:{ fontFamily: fonts.bodyBold, fontSize: fontSizes.base, color: colors.inkSoft },
  modalAdd:     { flex: 1, paddingVertical: 14, alignItems: 'center', borderRadius: radii.pill },
  modalAddTxt:  { fontFamily: fonts.bodyBold, fontSize: fontSizes.base, color: '#fff' },
});
