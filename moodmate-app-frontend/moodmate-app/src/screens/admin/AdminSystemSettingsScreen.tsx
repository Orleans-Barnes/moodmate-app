/**
 * AdminSystemSettingsScreen — Phase 1H (Admin Portal - System Settings).
 *
 * Two independent sections on one screen (small enough not to need separate screens/tabs):
 *   1. Feature Flags — create/toggle/delete. Admin CRUD only, per FeatureFlag.java's own doc
 *      comment - nothing in the system checks a flag's value yet, this just ships the switchboard.
 *   2. Admin Announcement — broadcast a title+body to an audience (All/Students/Counsellors/
 *      Mentors/Admins). Lands as both an in-app notification-center row and a push for each
 *      recipient (ADMIN_ANNOUNCEMENT always pushes outside quiet hours, per the existing
 *      PushGatingRule - no per-type preference toggle exists for it, same as mentor requests).
 */
import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, Pressable, StyleSheet, ActivityIndicator, ScrollView, TextInput, Switch, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { useAuthStore } from '@/state/useAuthStore';
import {
  listFeatureFlags, createFeatureFlag, setFeatureFlagEnabled, deleteFeatureFlag,
  broadcastAnnouncement,
  type FeatureFlagView, type AnnouncementAudience,
} from '@/api/support';
import { ApiRequestError } from '@/api/client';
import { useKeyboardOffset } from '@/hooks/useKeyboardOffset';
import { colors, fonts, fontSizes, radii, spacing, shadow } from '@/theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'AdminSystemSettings'>;

const AUDIENCES: AnnouncementAudience[] = ['ALL', 'STUDENT', 'COUNSELLOR', 'MENTOR', 'ADMIN'];

export function AdminSystemSettingsScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const keyboardHeight = useKeyboardOffset();
  const token = useAuthStore((s) => s.token) ?? '';

  const [flags, setFlags] = useState<FeatureFlagView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const [newKey, setNewKey] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [creating, setCreating] = useState(false);

  const [annTitle, setAnnTitle] = useState('');
  const [annBody, setAnnBody] = useState('');
  const [annAudience, setAnnAudience] = useState<AnnouncementAudience>('ALL');
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setFlags(await listFeatureFlags(token));
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Could not load feature flags.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const handleToggle = async (flag: FeatureFlagView) => {
    setTogglingId(flag.id);
    try {
      const updated = await setFeatureFlagEnabled(token, flag.id, !flag.enabled);
      setFlags((prev) => prev.map((f) => f.id === flag.id ? updated : f));
    } catch (err) {
      Alert.alert('Error', err instanceof ApiRequestError ? err.message : 'Could not update this flag.');
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = (flag: FeatureFlagView) => {
    Alert.alert('Delete flag?', `"${flag.flagKey}" will be permanently removed.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await deleteFeatureFlag(token, flag.id);
            setFlags((prev) => prev.filter((f) => f.id !== flag.id));
          } catch (err) {
            Alert.alert('Error', err instanceof ApiRequestError ? err.message : 'Could not delete this flag.');
          }
        },
      },
    ]);
  };

  const handleCreate = async () => {
    const key = newKey.trim();
    if (!key) return;
    setCreating(true);
    try {
      const created = await createFeatureFlag(token, key, false, newDesc.trim() || undefined);
      setFlags((prev) => [...prev, created].sort((a, b) => a.flagKey.localeCompare(b.flagKey)));
      setNewKey('');
      setNewDesc('');
    } catch (err) {
      Alert.alert('Error', err instanceof ApiRequestError ? err.message : 'Could not create this flag.');
    } finally {
      setCreating(false);
    }
  };

  const handleBroadcast = () => {
    if (!annTitle.trim() || !annBody.trim()) {
      Alert.alert('Missing fields', 'Title and message are both required.');
      return;
    }
    Alert.alert(
      'Send announcement?',
      `This will notify every ${annAudience === 'ALL' ? 'user' : annAudience.toLowerCase()}.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send',
          onPress: async () => {
            setSending(true);
            try {
              const { recipientCount } = await broadcastAnnouncement(token, annTitle.trim(), annBody.trim(), annAudience);
              Alert.alert('Sent', `Delivered to ${recipientCount} recipient${recipientCount === 1 ? '' : 's'}.`);
              setAnnTitle('');
              setAnnBody('');
            } catch (err) {
              Alert.alert('Error', err instanceof ApiRequestError ? err.message : 'Could not send this announcement.');
            } finally {
              setSending(false);
            }
          },
        },
      ],
    );
  };

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <LinearGradient colors={['#24412A', '#579E65']} style={s.header}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <Pressable style={s.backBtn} onPress={() => navigation.goBack()} hitSlop={10}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </Pressable>
        <Text style={s.headerTitle}>System Settings</Text>
        <View style={{ width: 34 }} />
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 + keyboardHeight }}
      >
        <Text style={s.sectionTitle}>Admin Announcement</Text>
        <View style={s.formCard}>
          <TextInput style={s.input} placeholder="Title" placeholderTextColor={colors.inkFaint} value={annTitle} onChangeText={setAnnTitle} />
          <TextInput
            style={[s.input, s.inputMultiline]} placeholder="Message" placeholderTextColor={colors.inkFaint}
            value={annBody} onChangeText={setAnnBody} multiline
          />
          <Text style={s.formLabel}>Audience</Text>
          <View style={s.audienceRow}>
            {AUDIENCES.map((a) => (
              <Pressable key={a} style={[s.audienceChip, annAudience === a && s.audienceChipActive]} onPress={() => setAnnAudience(a)}>
                <Text style={[s.audienceChipText, annAudience === a && s.audienceChipTextActive]}>{a}</Text>
              </Pressable>
            ))}
          </View>
          <Pressable style={[s.primaryBtn, sending && s.btnDisabled]} onPress={handleBroadcast} disabled={sending}>
            {sending ? <ActivityIndicator size="small" color="#fff" /> : <Text style={s.primaryBtnText}>Send announcement</Text>}
          </Pressable>
        </View>

        <Text style={s.sectionTitle}>Feature Flags</Text>
        <View style={s.formCard}>
          <View style={s.formRow}>
            <TextInput
              style={[s.input, s.inputFlex]} placeholder="flag_key" placeholderTextColor={colors.inkFaint}
              value={newKey} onChangeText={setNewKey} autoCapitalize="none"
            />
          </View>
          <TextInput style={s.input} placeholder="Description (optional)" placeholderTextColor={colors.inkFaint} value={newDesc} onChangeText={setNewDesc} />
          <Pressable style={[s.primaryBtn, (!newKey.trim() || creating) && s.btnDisabled]} onPress={handleCreate} disabled={!newKey.trim() || creating}>
            {creating ? <ActivityIndicator size="small" color="#fff" /> : <Text style={s.primaryBtnText}>Add flag</Text>}
          </Pressable>
        </View>

        {error ? (
          <View style={s.alertBanner}>
            <Ionicons name="warning-outline" size={18} color="#C0392B" />
            <Text style={s.alertText}>{error}</Text>
          </View>
        ) : loading ? (
          <ActivityIndicator color={colors.coral} style={{ marginVertical: 24 }} />
        ) : flags.length === 0 ? (
          <View style={s.emptyState}>
            <Ionicons name="flag-outline" size={36} color={colors.inkFaint} />
            <Text style={s.emptyBody}>No feature flags yet.</Text>
          </View>
        ) : (
          flags.map((flag) => (
            <View key={flag.id} style={s.flagRow}>
              <View style={s.flagInfo}>
                <Text style={s.flagKey}>{flag.flagKey}</Text>
                {flag.description ? <Text style={s.flagDesc}>{flag.description}</Text> : null}
              </View>
              {togglingId === flag.id
                ? <ActivityIndicator size="small" color={colors.coral} style={{ marginHorizontal: 12 }} />
                : <Switch value={flag.enabled} onValueChange={() => handleToggle(flag)} trackColor={{ true: colors.coral }} />
              }
              <Pressable style={s.flagDeleteBtn} onPress={() => handleDelete(flag)}>
                <Ionicons name="trash-outline" size={16} color={colors.coral} />
              </Pressable>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.lg,
  },
  backBtn: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: fonts.displaySemibold, fontSize: fontSizes.lg, color: '#fff' },

  sectionTitle: {
    fontFamily: fonts.displaySemibold, fontSize: fontSizes.lg, color: colors.ink,
    marginHorizontal: spacing.xl, marginTop: spacing.lg, marginBottom: spacing.md,
  },

  formCard: {
    backgroundColor: colors.surface, borderRadius: radii.md, padding: spacing.lg,
    marginHorizontal: spacing.xl, marginBottom: spacing.md, gap: spacing.sm, ...shadow.sm,
  },
  formLabel: { fontFamily: fonts.bodyBold, fontSize: fontSizes.xs, color: colors.inkSoft, marginTop: 4 },
  formRow: { flexDirection: 'row', gap: 8 },
  input: {
    fontFamily: fonts.body, fontSize: fontSizes.sm, color: colors.ink,
    backgroundColor: '#EEF3EF', borderRadius: radii.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
  },
  inputMultiline: { minHeight: 70, textAlignVertical: 'top' },
  inputFlex: { flex: 1 },

  audienceRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  audienceChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: radii.pill, backgroundColor: '#EEF3EF' },
  audienceChipActive: { backgroundColor: colors.coral },
  audienceChipText: { fontFamily: fonts.bodyBold, fontSize: 10, color: colors.inkSoft },
  audienceChipTextActive: { color: '#fff' },

  primaryBtn: {
    marginTop: 4, backgroundColor: colors.coral, borderRadius: radii.md,
    paddingVertical: spacing.sm, alignItems: 'center', justifyContent: 'center',
  },
  primaryBtnText: { fontFamily: fonts.bodyBold, fontSize: fontSizes.sm, color: '#fff' },
  btnDisabled: { opacity: 0.5 },

  alertBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: spacing.xl, marginTop: spacing.md,
    backgroundColor: '#FEF0EE', borderRadius: radii.md, padding: spacing.md,
    borderLeftWidth: 3, borderLeftColor: '#C0392B',
  },
  alertText: { fontFamily: fonts.bodyMedium, fontSize: fontSizes.sm, color: '#7B1010', flex: 1 },

  emptyState: { alignItems: 'center', paddingVertical: spacing.xl, gap: 8, marginHorizontal: spacing.xl },
  emptyBody: { fontFamily: fonts.bodyMedium, fontSize: fontSizes.sm, color: colors.inkSoft },

  flagRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.surface, borderRadius: radii.md, padding: spacing.md,
    marginHorizontal: spacing.xl, marginBottom: spacing.sm, ...shadow.sm,
  },
  flagInfo: { flex: 1 },
  flagKey: { fontFamily: fonts.bodyBold, fontSize: fontSizes.sm, color: colors.ink },
  flagDesc: { fontFamily: fonts.body, fontSize: fontSizes.xs, color: colors.inkSoft, marginTop: 2 },
  flagDeleteBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#FEF0EE', alignItems: 'center', justifyContent: 'center' },
});
