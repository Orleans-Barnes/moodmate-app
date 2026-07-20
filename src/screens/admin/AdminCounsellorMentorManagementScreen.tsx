/**
 * AdminCounsellorMentorManagementScreen — Phase 1H (Admin Portal - Counsellor/Peer Mentor
 * Management).
 *
 * A single screen with a Counsellors/Mentors toggle (same pattern SupportScreen already uses for
 * its All/Counsellors/Mentors filter) rather than two near-identical screens - counsellors have a
 * status state machine (APPROVED/SUSPENDED/...), mentors just an available boolean, but the
 * "manage the roster, deactivate a bad actor, reactivate them later" shape is the same for both.
 */
import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, Pressable, StyleSheet, ActivityIndicator, ScrollView, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { useAuthStore } from '@/state/useAuthStore';
import {
  listAllCounsellorsForAdmin, suspendCounsellor, reinstateCounsellor,
  listAllMentorsForAdmin, deactivateMentor, activateMentor,
  type CounsellorRequestAdminView, type PeerMentorAdminView,
} from '@/api/support';
import { ApiRequestError } from '@/api/client';
import { colors, fonts, fontSizes, radii, spacing, shadow } from '@/theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'AdminCounsellorMentorManagement'>;
type Tab = 'counsellors' | 'mentors';

const STATUS_META: Record<CounsellorRequestAdminView['status'], { label: string; bg: string; color: string }> = {
  PENDING:   { label: 'Pending',   bg: '#FEF9E7', color: '#8A6800' },
  APPROVED:  { label: 'Active',    bg: '#E8F8EF', color: '#27AE60' },
  REJECTED:  { label: 'Rejected',  bg: '#FDEDEC', color: '#E74C3C' },
  SUSPENDED: { label: 'Suspended', bg: '#FDEDEC', color: '#C0392B' },
};

// Fix #4 - mentors now carry a real status too (previously only the available boolean existed).
// The PENDING applications themselves are reviewed on AdminDashboardScreen's queue, not here - this
// screen still only shows the activate/deactivate toggle, but now only for APPROVED rows, since
// toggling "available" on a still-PENDING or REJECTED application doesn't mean anything. An
// APPROVED row can still be independently active/deactivated, hence the function (not a flat
// lookup) - it depends on both fields.
function mentorBadge(item: PeerMentorAdminView): { label: string; bg: string; color: string } {
  if (item.status === 'PENDING') return { label: 'Pending', bg: '#FEF9E7', color: '#8A6800' };
  if (item.status === 'REJECTED') return { label: 'Rejected', bg: '#FDEDEC', color: '#E74C3C' };
  return item.available
    ? { label: 'Active', bg: '#E8F8EF', color: '#27AE60' }
    : { label: 'Deactivated', bg: '#FDEDEC', color: '#C0392B' };
}

export function AdminCounsellorMentorManagementScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const token = useAuthStore((s) => s.token) ?? '';

  const [tab, setTab] = useState<Tab>('counsellors');
  const [counsellors, setCounsellors] = useState<CounsellorRequestAdminView[]>([]);
  const [mentors, setMentors] = useState<PeerMentorAdminView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionId, setActionId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (tab === 'counsellors') {
        setCounsellors(await listAllCounsellorsForAdmin(token));
      } else {
        setMentors(await listAllMentorsForAdmin(token));
      }
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Could not load the roster.');
    } finally {
      setLoading(false);
    }
  }, [token, tab]);

  useEffect(() => { load(); }, [load]);

  const handleSuspendCounsellor = (item: CounsellorRequestAdminView) => {
    Alert.alert('Suspend counsellor?', `${item.name} will be removed from the public directory until reinstated.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Suspend', style: 'destructive',
        onPress: async () => {
          setActionId(item.id);
          try {
            const updated = await suspendCounsellor(token, item.id);
            setCounsellors((prev) => prev.map((c) => c.id === item.id ? updated : c));
          } catch (err) {
            Alert.alert('Error', err instanceof ApiRequestError ? err.message : 'Could not suspend this counsellor.');
          } finally { setActionId(null); }
        },
      },
    ]);
  };

  const handleReinstateCounsellor = async (item: CounsellorRequestAdminView) => {
    setActionId(item.id);
    try {
      const updated = await reinstateCounsellor(token, item.id);
      setCounsellors((prev) => prev.map((c) => c.id === item.id ? updated : c));
    } catch (err) {
      Alert.alert('Error', err instanceof ApiRequestError ? err.message : 'Could not reinstate this counsellor.');
    } finally { setActionId(null); }
  };

  const handleDeactivateMentor = (item: PeerMentorAdminView) => {
    Alert.alert('Deactivate mentor?', `${item.name} will be removed from the public directory until reactivated.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Deactivate', style: 'destructive',
        onPress: async () => {
          setActionId(item.id);
          try {
            const updated = await deactivateMentor(token, item.id);
            setMentors((prev) => prev.map((m) => m.id === item.id ? updated : m));
          } catch (err) {
            Alert.alert('Error', err instanceof ApiRequestError ? err.message : 'Could not deactivate this mentor.');
          } finally { setActionId(null); }
        },
      },
    ]);
  };

  const handleActivateMentor = async (item: PeerMentorAdminView) => {
    setActionId(item.id);
    try {
      const updated = await activateMentor(token, item.id);
      setMentors((prev) => prev.map((m) => m.id === item.id ? updated : m));
    } catch (err) {
      Alert.alert('Error', err instanceof ApiRequestError ? err.message : 'Could not reactivate this mentor.');
    } finally { setActionId(null); }
  };

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <LinearGradient colors={['#2C1654', '#5B2FA0', '#2980B9']} style={s.header}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <Pressable style={s.backBtn} onPress={() => navigation.goBack()} hitSlop={10}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </Pressable>
        <Text style={s.headerTitle}>Counsellors & Mentors</Text>
        <View style={{ width: 34 }} />
      </LinearGradient>

      <View style={s.tabRow}>
        <Pressable style={[s.tabBtn, tab === 'counsellors' && s.tabBtnActive]} onPress={() => setTab('counsellors')}>
          <Text style={[s.tabText, tab === 'counsellors' && s.tabTextActive]}>Counsellors</Text>
        </Pressable>
        <Pressable style={[s.tabBtn, tab === 'mentors' && s.tabBtnActive]} onPress={() => setTab('mentors')}>
          <Text style={[s.tabText, tab === 'mentors' && s.tabTextActive]}>Peer Mentors</Text>
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}>
        {error ? (
          <View style={s.alertBanner}>
            <Ionicons name="warning-outline" size={18} color="#C0392B" />
            <Text style={s.alertText}>{error}</Text>
          </View>
        ) : loading ? (
          <ActivityIndicator color={colors.lavender} style={{ marginVertical: 40 }} />
        ) : tab === 'counsellors' ? (
          counsellors.length === 0 ? (
            <View style={s.emptyState}>
              <Ionicons name="people-outline" size={40} color={colors.inkFaint} />
              <Text style={s.emptyBody}>No counsellors on the roster yet.</Text>
            </View>
          ) : counsellors.map((item) => {
            const meta = STATUS_META[item.status];
            return (
              <View key={item.id} style={s.card}>
                <View style={s.cardHeader}>
                  <View style={s.avatarCircle}>
                    <Text style={s.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
                  </View>
                  <View style={s.cardInfo}>
                    <Text style={s.cardName}>{item.name}</Text>
                    <Text style={s.cardTitle}>{item.title || 'No title provided'}</Text>
                  </View>
                  <View style={[s.statusBadge, { backgroundColor: meta.bg }]}>
                    <Text style={[s.statusBadgeText, { color: meta.color }]}>{meta.label}</Text>
                  </View>
                </View>
                {item.specialties ? <Text style={s.cardSpecialties}>🎯 {item.specialties}</Text> : null}
                {item.status === 'APPROVED' && (
                  <Pressable
                    style={[s.suspendBtn, actionId === item.id && s.btnDisabled]}
                    onPress={() => handleSuspendCounsellor(item)}
                    disabled={actionId === item.id}
                  >
                    {actionId === item.id
                      ? <ActivityIndicator size="small" color={colors.coral} />
                      : <Text style={s.suspendBtnText}>Suspend</Text>}
                  </Pressable>
                )}
                {item.status === 'SUSPENDED' && (
                  <Pressable
                    style={[s.reinstateBtn, actionId === item.id && s.btnDisabled]}
                    onPress={() => handleReinstateCounsellor(item)}
                    disabled={actionId === item.id}
                  >
                    {actionId === item.id
                      ? <ActivityIndicator size="small" color="#fff" />
                      : <Text style={s.reinstateBtnText}>Reinstate</Text>}
                  </Pressable>
                )}
              </View>
            );
          })
        ) : mentors.length === 0 ? (
          <View style={s.emptyState}>
            <Ionicons name="leaf-outline" size={40} color={colors.inkFaint} />
            <Text style={s.emptyBody}>No peer mentors on the roster yet.</Text>
          </View>
        ) : mentors.map((item) => {
          const badge = mentorBadge(item);
          return (
            <View key={item.id} style={s.card}>
              <View style={s.cardHeader}>
                <View style={[s.avatarCircle, { backgroundColor: '#2D6A4F' }]}>
                  <Text style={s.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
                </View>
                <View style={s.cardInfo}>
                  <Text style={s.cardName}>{item.name}</Text>
                  <Text style={s.cardTitle}>{item.focusArea || 'No focus area'}</Text>
                </View>
                <View style={[s.statusBadge, { backgroundColor: badge.bg }]}>
                  <Text style={[s.statusBadgeText, { color: badge.color }]}>{badge.label}</Text>
                </View>
              </View>
              <Text style={s.cardSpecialties}>
                {item.status === 'PENDING'
                  ? '📝 Application under review'
                  : item.userId ? '🔗 Account linked' : '⬜ No account linked yet'}
              </Text>
              {item.status === 'APPROVED' && (
                item.available ? (
                  <Pressable
                    style={[s.suspendBtn, actionId === item.id && s.btnDisabled]}
                    onPress={() => handleDeactivateMentor(item)}
                    disabled={actionId === item.id}
                  >
                    {actionId === item.id
                      ? <ActivityIndicator size="small" color={colors.coral} />
                      : <Text style={s.suspendBtnText}>Deactivate</Text>}
                  </Pressable>
                ) : (
                  <Pressable
                    style={[s.reinstateBtn, actionId === item.id && s.btnDisabled]}
                    onPress={() => handleActivateMentor(item)}
                    disabled={actionId === item.id}
                  >
                    {actionId === item.id
                      ? <ActivityIndicator size="small" color="#fff" />
                      : <Text style={s.reinstateBtnText}>Reactivate</Text>}
                  </Pressable>
                )
              )}
            </View>
          );
        })}
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

  tabRow: {
    flexDirection: 'row', marginHorizontal: spacing.xl, marginTop: spacing.lg, marginBottom: spacing.md,
    backgroundColor: colors.surface, borderRadius: radii.pill, padding: 4, ...shadow.sm,
  },
  tabBtn: { flex: 1, paddingVertical: spacing.sm, borderRadius: radii.pill, alignItems: 'center' },
  tabBtnActive: { backgroundColor: colors.lavender },
  tabText: { fontFamily: fonts.bodyBold, fontSize: fontSizes.sm, color: colors.inkSoft },
  tabTextActive: { color: '#fff' },

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
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm, gap: spacing.sm },
  avatarCircle: {
    width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.lavender,
  },
  avatarText: { fontFamily: fonts.display, fontSize: fontSizes.lg, color: '#fff' },
  cardInfo: { flex: 1 },
  cardName: { fontFamily: fonts.bodyBold, fontSize: fontSizes.md, color: colors.ink },
  cardTitle: { fontFamily: fonts.bodyMedium, fontSize: fontSizes.sm, color: colors.inkSoft },
  statusBadge: { borderRadius: radii.pill, paddingHorizontal: spacing.sm, paddingVertical: 2 },
  statusBadgeText: { fontFamily: fonts.bodyBold, fontSize: 9, letterSpacing: 0.5 },
  cardSpecialties: { fontFamily: fonts.bodyMedium, fontSize: fontSizes.sm, color: colors.ink, marginBottom: spacing.md },

  suspendBtn: {
    paddingVertical: spacing.sm, borderRadius: radii.md, borderWidth: 1.5,
    borderColor: colors.coral, alignItems: 'center', justifyContent: 'center',
  },
  suspendBtnText: { fontFamily: fonts.bodyBold, fontSize: fontSizes.sm, color: colors.coral },
  reinstateBtn: {
    paddingVertical: spacing.sm, borderRadius: radii.md, backgroundColor: colors.sage,
    alignItems: 'center', justifyContent: 'center',
  },
  reinstateBtnText: { fontFamily: fonts.bodyBold, fontSize: fontSizes.sm, color: '#fff' },
  btnDisabled: { opacity: 0.5 },
});
