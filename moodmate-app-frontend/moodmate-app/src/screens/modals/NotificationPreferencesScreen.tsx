/**
 * NotificationPreferencesScreen — Phase 1E, Step 1.
 *
 * Backend-synced per-type reminder toggles + quiet hours. This is distinct from the existing
 * local-only daily/inactivity reminder (src/utils/notifications.ts + useGamificationStore) which
 * this screen does not replace yet — see MASTER_IMPLEMENTATION_TRACKER.md's Phase 1E section for
 * why both currently coexist. Once Phase 1E Step 4's scheduling rules exist server-side, these
 * preferences are what they'll read to decide whether to fire a given reminder type.
 */
import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, Pressable, Switch, StyleSheet, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { useAuthStore } from '@/state/useAuthStore';
import { useToast } from '@/state/useToast';
import { ApiRequestError } from '@/api/client';
import { getNotificationPreferences, putNotificationPreferences } from '@/api/notificationPreferences';
import type { NotificationPreferenceResponse } from '@/api/types';
import { ScreenHeader } from '@/components/ScreenHeader';
import { colors, fonts, fontSizes, radii, spacing, shadow } from '@/theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'NotificationPreferences'>;

type ReminderKey = 'moodReminders' | 'journalReminders' | 'habitReminders' | 'sleepReminders' | 'appointmentReminders';

const REMINDER_ROWS: { key: ReminderKey; icon: keyof typeof Ionicons.glyphMap; label: string; sub: string }[] = [
  { key: 'moodReminders', icon: 'happy-outline', label: 'Mood check-ins', sub: 'Nudge me if I haven’t logged how I’m feeling today' },
  { key: 'journalReminders', icon: 'book-outline', label: 'Journal entries', sub: 'Remind me if I haven’t written in a while' },
  { key: 'habitReminders', icon: 'checkmark-circle-outline', label: 'Habits', sub: 'Remind me about incomplete daily habits' },
  { key: 'sleepReminders', icon: 'moon-outline', label: 'Sleep tracking', sub: 'Wind-down and sleep-log reminders' },
  { key: 'appointmentReminders', icon: 'calendar-outline', label: 'Appointments', sub: 'Counsellor/peer-mentor session reminders' },
];

const QUIET_HOUR_PRESETS = [
  { label: '9 PM – 7 AM', start: '21:00', end: '07:00' },
  { label: '10 PM – 8 AM', start: '22:00', end: '08:00' },
  { label: '11 PM – 7 AM', start: '23:00', end: '07:00' },
];

export function NotificationPreferencesScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const token = useAuthStore((s) => s.token) ?? '';
  const toast = useToast();

  const [prefs, setPrefs] = useState<NotificationPreferenceResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    if (!token || token === 'guest') { setLoading(false); return; }
    setLoading(true);
    getNotificationPreferences(token)
      .then(setPrefs)
      .catch((err) => toast(err instanceof ApiRequestError ? err.message : 'Could not load notification settings.'))
      .finally(() => setLoading(false));
  }, [token, toast]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const quietHoursEnabled = !!prefs?.quietHoursStart && !!prefs?.quietHoursEnd;

  const saveToggle = async (key: ReminderKey, value: boolean) => {
    if (!prefs) return;
    const optimistic = { ...prefs, [key]: value };
    setPrefs(optimistic);
    setSaving(true);
    try {
      const updated = await putNotificationPreferences(token, { [key]: value });
      setPrefs(updated);
    } catch (err) {
      setPrefs(prefs); // revert on failure
      toast(err instanceof ApiRequestError ? err.message : 'Could not save that setting.');
    } finally {
      setSaving(false);
    }
  };

  const applyQuietHours = async (start: string, end: string) => {
    setSaving(true);
    try {
      const updated = await putNotificationPreferences(token, { quietHoursStart: start, quietHoursEnd: end });
      setPrefs(updated);
      toast('Quiet hours set ✓');
    } catch (err) {
      toast(err instanceof ApiRequestError ? err.message : 'Could not save quiet hours.');
    } finally {
      setSaving(false);
    }
  };

  const clearQuietHours = async () => {
    setSaving(true);
    try {
      const updated = await putNotificationPreferences(token, { quietHoursStart: '', quietHoursEnd: '' });
      setPrefs(updated);
    } catch (err) {
      toast(err instanceof ApiRequestError ? err.message : 'Could not clear quiet hours.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={s.root}>
      <View style={s.headerWrap}>
        <ScreenHeader
          title="Notifications"
          onClose={() => navigation.goBack()}
          compact
          rightSlot={
            <View style={{ width: 40, alignItems: 'flex-end' }}>
              {saving && <ActivityIndicator size="small" color={colors.inkFaint} />}
            </View>
          }
        />
      </View>

      {loading ? (
        <View style={s.centerFill}><ActivityIndicator color={colors.coral} /></View>
      ) : !prefs ? (
        <View style={s.centerFill}>
          <Text style={s.emptyText}>Sign in to manage notification settings.</Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 40 }]}
        >
          <Text style={s.sectionLabel}>Reminders</Text>
          <View style={s.card}>
            {REMINDER_ROWS.map((row, i) => (
              <View key={row.key} style={[s.row, i > 0 && s.rowDivider]}>
                <View style={s.rowIcon}>
                  <Ionicons name={row.icon} size={18} color={colors.coral} />
                </View>
                <View style={s.rowText}>
                  <Text style={s.rowLabel}>{row.label}</Text>
                  <Text style={s.rowSub}>{row.sub}</Text>
                </View>
                <Switch
                  value={prefs[row.key]}
                  onValueChange={(v) => saveToggle(row.key, v)}
                  trackColor={{ false: colors.line, true: colors.coral }}
                />
              </View>
            ))}
          </View>

          <Text style={s.sectionLabel}>Quiet hours</Text>
          <View style={s.card}>
            <Text style={s.quietDesc}>
              {quietHoursEnabled
                ? `Reminders are paused ${prefs.quietHoursStart} – ${prefs.quietHoursEnd}.`
                : 'No quiet hours set — reminders can arrive any time.'}
            </Text>
            <View style={s.presetRow}>
              {QUIET_HOUR_PRESETS.map((preset) => {
                const active = prefs.quietHoursStart === preset.start && prefs.quietHoursEnd === preset.end;
                return (
                  <Pressable
                    key={preset.label}
                    style={[s.presetChip, active && s.presetChipActive]}
                    onPress={() => applyQuietHours(preset.start, preset.end)}
                  >
                    <Text style={[s.presetChipText, active && s.presetChipTextActive]}>{preset.label}</Text>
                  </Pressable>
                );
              })}
            </View>
            {quietHoursEnabled && (
              <Pressable style={s.clearBtn} onPress={clearQuietHours}>
                <Text style={s.clearBtnText}>Clear quiet hours</Text>
              </Pressable>
            )}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  headerWrap: { paddingHorizontal: spacing.lg },
  centerFill: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  emptyText: { fontFamily: fonts.body, fontSize: fontSizes.sm, color: colors.inkFaint, textAlign: 'center' },

  content: { padding: spacing.xl, gap: spacing.md },
  sectionLabel: {
    fontFamily: fonts.displaySemibold, fontSize: fontSizes.md,
    color: colors.inkSoft, marginTop: spacing.sm,
  },
  card: {
    backgroundColor: colors.surface, borderRadius: radii.md, padding: spacing.lg, ...shadow.sm,
    gap: spacing.md,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xs },
  rowDivider: { borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)', paddingTop: spacing.md },
  rowIcon: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: colors.coralSoft, alignItems: 'center', justifyContent: 'center',
  },
  rowText: { flex: 1, gap: 2 },
  rowLabel: { fontFamily: fonts.bodyBold, fontSize: fontSizes.md, color: colors.ink },
  rowSub: { fontFamily: fonts.body, fontSize: fontSizes.xs, color: colors.inkFaint, lineHeight: 16 },

  quietDesc: { fontFamily: fonts.body, fontSize: fontSizes.sm, color: colors.inkSoft, lineHeight: 20 },
  presetRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  presetChip: {
    paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderRadius: radii.pill,
    backgroundColor: colors.bg, borderWidth: 1.5, borderColor: colors.line,
  },
  presetChipActive: { backgroundColor: colors.coral, borderColor: colors.coral },
  presetChipText: { fontFamily: fonts.bodyBold, fontSize: fontSizes.xs, color: colors.inkSoft },
  presetChipTextActive: { color: '#FFFFFF' },
  clearBtn: { alignSelf: 'flex-start' },
  clearBtnText: { fontFamily: fonts.bodyMedium, fontSize: fontSizes.xs, color: colors.coral },
});
