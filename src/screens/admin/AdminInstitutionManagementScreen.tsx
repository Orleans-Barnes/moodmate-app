/**
 * AdminInstitutionManagementScreen — Institution Management (Milestone).
 *
 * Admin CRUD over the backend institution catalogue that now backs signup's InstitutionPicker
 * (GET /api/public/institutions) instead of the old hardcoded ghana.ts-only list. Same
 * inline-expandable-form pattern as AdminWellnessContentScreen (create) plus an edit mode (tap a
 * card to open the same form pre-filled) and an activate/deactivate toggle per row, since
 * deactivating an institution here is what makes it stop appearing in the public/signup list
 * without deleting its history.
 */
import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, Pressable, StyleSheet, ActivityIndicator, ScrollView, TextInput, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { useAuthStore } from '@/state/useAuthStore';
import {
  listInstitutions, createInstitution, updateInstitution, setInstitutionActive,
  type InstitutionView, type InstitutionInput, type InstitutionType,
} from '@/api/support';
import { ApiRequestError } from '@/api/client';
import { colors, fonts, fontSizes, radii, spacing, shadow } from '@/theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'AdminInstitutionManagement'>;

const TYPE_OPTIONS: { value: InstitutionType; label: string }[] = [
  { value: 'UNIVERSITY', label: 'University' },
  { value: 'UNIVERSITY_COLLEGE', label: 'University College' },
  { value: 'INSTITUTE', label: 'Institute' },
];

function typeLabel(type: InstitutionType): string {
  return TYPE_OPTIONS.find((t) => t.value === type)?.label ?? type;
}

const emptyForm = { name: '', shortName: '', city: '', country: '', type: 'UNIVERSITY' as InstitutionType, website: '' };

export function AdminInstitutionManagementScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const token = useAuthStore((s) => s.token) ?? '';

  const [institutions, setInstitutions] = useState<InstitutionView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await listInstitutions(token);
      setInstitutions(list);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Could not load institutions.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const openCreateForm = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEditForm = (item: InstitutionView) => {
    setEditingId(item.id);
    setForm({
      name: item.name,
      shortName: item.shortName,
      city: item.city ?? '',
      country: item.country,
      type: item.type,
      website: item.website ?? '',
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.shortName.trim() || !form.country.trim()) {
      Alert.alert('Missing fields', 'Name, short name, and country are required.');
      return;
    }
    const input: InstitutionInput = {
      name: form.name.trim(),
      shortName: form.shortName.trim(),
      city: form.city.trim() || undefined,
      country: form.country.trim(),
      type: form.type,
      website: form.website.trim() || undefined,
    };
    setSaving(true);
    try {
      if (editingId != null) {
        const updated = await updateInstitution(token, editingId, input);
        setInstitutions((prev) => prev.map((i) => (i.id === editingId ? updated : i)).sort((a, b) => a.name.localeCompare(b.name)));
      } else {
        const created = await createInstitution(token, input);
        setInstitutions((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
      }
      closeForm();
    } catch (err) {
      Alert.alert('Error', err instanceof ApiRequestError ? err.message : 'Could not save this institution.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (item: InstitutionView) => {
    setTogglingId(item.id);
    try {
      const updated = await setInstitutionActive(token, item.id, !item.active);
      setInstitutions((prev) => prev.map((i) => (i.id === item.id ? updated : i)));
    } catch (err) {
      Alert.alert('Error', err instanceof ApiRequestError ? err.message : 'Could not update this institution.');
    } finally {
      setTogglingId(null);
    }
  };

  const q = query.trim().toLowerCase();
  const visible = institutions.filter((i) => {
    if (!q) return true;
    return i.name.toLowerCase().includes(q) || i.shortName.toLowerCase().includes(q) || i.country.toLowerCase().includes(q);
  });

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <LinearGradient colors={['#2C1654', '#5B2FA0', '#2980B9']} style={s.header}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <Pressable style={s.backBtn} onPress={() => navigation.goBack()} hitSlop={10}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </Pressable>
        <Text style={s.headerTitle}>Institutions</Text>
        <Pressable style={s.backBtn} onPress={() => (showForm ? closeForm() : openCreateForm())} hitSlop={10}>
          <Ionicons name={showForm ? 'close' : 'add'} size={22} color="#fff" />
        </Pressable>
      </LinearGradient>

      <View style={s.searchWrap}>
        <Ionicons name="search" size={16} color={colors.inkFaint} />
        <TextInput
          style={s.searchInput}
          value={query}
          onChangeText={setQuery}
          placeholder="Search by name, acronym, or country"
          placeholderTextColor={colors.inkFaint}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}>
        {showForm && (
          <View style={s.formCard}>
            <Text style={s.formTitle}>{editingId != null ? 'Edit institution' : 'New institution'}</Text>
            <TextInput style={s.input} placeholder="Full name" placeholderTextColor={colors.inkFaint} value={form.name} onChangeText={(v) => setForm((f) => ({ ...f, name: v }))} />
            <View style={s.formRow}>
              <TextInput style={[s.input, s.inputFlex]} placeholder="Short name (e.g. KNUST)" placeholderTextColor={colors.inkFaint} value={form.shortName} onChangeText={(v) => setForm((f) => ({ ...f, shortName: v }))} />
              <TextInput style={[s.input, s.inputFlex]} placeholder="Country" placeholderTextColor={colors.inkFaint} value={form.country} onChangeText={(v) => setForm((f) => ({ ...f, country: v }))} />
            </View>
            <TextInput style={s.input} placeholder="City (optional)" placeholderTextColor={colors.inkFaint} value={form.city} onChangeText={(v) => setForm((f) => ({ ...f, city: v }))} />
            <TextInput style={s.input} placeholder="Website (optional)" placeholderTextColor={colors.inkFaint} autoCapitalize="none" value={form.website} onChangeText={(v) => setForm((f) => ({ ...f, website: v }))} />

            <Text style={s.formLabel}>Type</Text>
            <View style={s.typeRow}>
              {TYPE_OPTIONS.map((opt) => {
                const active = opt.value === form.type;
                return (
                  <Pressable key={opt.value} style={[s.typeChip, active && s.typeChipActive]} onPress={() => setForm((f) => ({ ...f, type: opt.value }))}>
                    <Text style={[s.typeChipText, active && s.typeChipTextActive]}>{opt.label}</Text>
                  </Pressable>
                );
              })}
            </View>

            <Pressable style={[s.publishBtn, saving && s.btnDisabled]} onPress={handleSave} disabled={saving}>
              {saving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={s.publishBtnText}>{editingId != null ? 'Save changes' : 'Add institution'}</Text>}
            </Pressable>
          </View>
        )}

        {error ? (
          <View style={s.alertBanner}>
            <Ionicons name="warning-outline" size={18} color="#C0392B" />
            <Text style={s.alertText}>{error}</Text>
          </View>
        ) : loading ? (
          <ActivityIndicator color={colors.lavender} style={{ marginVertical: 40 }} />
        ) : visible.length === 0 ? (
          <View style={s.emptyState}>
            <Ionicons name="school-outline" size={40} color={colors.inkFaint} />
            <Text style={s.emptyBody}>{query ? `No matches for "${query}".` : 'No institutions yet.'}</Text>
          </View>
        ) : visible.map((item) => (
          <Pressable key={item.id} style={s.card} onPress={() => openEditForm(item)}>
            <View style={s.cardHeader}>
              <View style={s.cardInfo}>
                <Text style={s.cardName} numberOfLines={2}>{item.name}</Text>
                <Text style={s.cardMeta}>{item.shortName} · {typeLabel(item.type)} · {item.country}</Text>
              </View>
              <Pressable
                style={[s.statusPill, item.active ? s.statusPillActive : s.statusPillInactive]}
                onPress={() => handleToggleActive(item)}
                disabled={togglingId === item.id}
              >
                {togglingId === item.id ? (
                  <ActivityIndicator size="small" color={item.active ? colors.sage : colors.inkFaint} />
                ) : (
                  <Text style={[s.statusPillText, item.active ? s.statusPillTextActive : s.statusPillTextInactive]}>
                    {item.active ? 'Active' : 'Inactive'}
                  </Text>
                )}
              </Pressable>
            </View>
          </Pressable>
        ))}
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

  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.surface, borderRadius: radii.md,
    borderWidth: 1.5, borderColor: colors.line,
    paddingHorizontal: spacing.md, paddingVertical: 11,
    marginHorizontal: spacing.xl, marginTop: spacing.lg, marginBottom: spacing.md,
  },
  searchInput: { flex: 1, fontFamily: fonts.body, fontSize: fontSizes.sm, color: colors.ink, padding: 0 },

  formCard: {
    backgroundColor: colors.surface, borderRadius: radii.md, padding: spacing.lg,
    marginHorizontal: spacing.xl, marginBottom: spacing.lg, gap: spacing.sm, ...shadow.sm,
  },
  formTitle: { fontFamily: fonts.bodyBold, fontSize: fontSizes.md, color: colors.ink, marginBottom: 4 },
  formLabel: { fontFamily: fonts.bodyBold, fontSize: fontSizes.xs, color: colors.inkSoft, marginTop: 4 },
  formRow: { flexDirection: 'row', gap: 8 },
  input: {
    fontFamily: fonts.body, fontSize: fontSizes.sm, color: colors.ink,
    backgroundColor: '#F4F2F8', borderRadius: radii.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
  },
  inputFlex: { flex: 1 },
  typeRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  typeChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: radii.pill, backgroundColor: '#F4F2F8' },
  typeChipActive: { backgroundColor: colors.lavender },
  typeChipText: { fontFamily: fonts.bodyMedium, fontSize: fontSizes.xs, color: colors.inkSoft },
  typeChipTextActive: { color: '#fff' },
  publishBtn: {
    marginTop: spacing.sm, backgroundColor: colors.lavender, borderRadius: radii.md,
    paddingVertical: spacing.sm, alignItems: 'center', justifyContent: 'center',
  },
  btnDisabled: { opacity: 0.5 },
  publishBtnText: { fontFamily: fonts.bodyBold, fontSize: fontSizes.sm, color: '#fff' },

  alertBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: spacing.xl, marginTop: spacing.md,
    backgroundColor: '#FEF0EE', borderRadius: radii.md, padding: spacing.md,
    borderLeftWidth: 3, borderLeftColor: '#C0392B',
  },
  alertText: { fontFamily: fonts.bodyMedium, fontSize: fontSizes.sm, color: '#7B1010', flex: 1 },

  emptyState: { alignItems: 'center', paddingVertical: spacing.xxl, gap: 10, marginHorizontal: spacing.xl },
  emptyBody: { fontFamily: fonts.bodyMedium, fontSize: fontSizes.sm, color: colors.inkSoft, textAlign: 'center' },

  card: {
    backgroundColor: colors.surface, borderRadius: radii.md, padding: spacing.lg,
    marginHorizontal: spacing.xl, marginBottom: spacing.md, ...shadow.sm,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  cardInfo: { flex: 1 },
  cardName: { fontFamily: fonts.bodyBold, fontSize: fontSizes.md, color: colors.ink },
  cardMeta: { fontFamily: fonts.body, fontSize: fontSizes.xs, color: colors.inkSoft, marginTop: 2 },

  statusPill: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: radii.pill, minWidth: 68, alignItems: 'center' },
  statusPillActive: { backgroundColor: colors.sageSoft },
  statusPillInactive: { backgroundColor: '#F2F3F4' },
  statusPillText: { fontFamily: fonts.bodyBold, fontSize: 11 },
  statusPillTextActive: { color: colors.sage },
  statusPillTextInactive: { color: colors.inkFaint },
});
