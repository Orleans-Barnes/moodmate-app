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
  View, Text, Pressable, StyleSheet, ActivityIndicator, ScrollView, Alert, TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { useAuthStore } from '@/state/useAuthStore';
import {
  listAllCounsellorsForAdmin, suspendCounsellor, reinstateCounsellor, adminEditCounsellor,
  approveCounsellorRequest, rejectCounsellorRequest,
  listAllMentorsForAdmin, deactivateMentor, activateMentor,
  approveMentorApplication, rejectMentorApplication,
  type CounsellorRequestAdminView, type PeerMentorAdminView,
} from '@/api/support';
import { getErrorMessage } from '@/api/client';
import { FadeInItem } from '@/components/FadeInItem';
import { useKeyboardOffset } from '@/hooks/useKeyboardOffset';
import { colors, fonts, fontSizes, radii, spacing, shadow } from '@/theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'AdminCounsellorMentorManagement'>;
type Tab = 'counsellors' | 'mentors';

const STATUS_META: Record<CounsellorRequestAdminView['status'], { label: string; bg: string; color: string }> = {
  PENDING:   { label: 'Pending',   bg: colors.warningSoft, color: colors.warning },
  APPROVED:  { label: 'Active',    bg: colors.successSoft, color: colors.success },
  REJECTED:  { label: 'Rejected',  bg: colors.errorSoft,   color: colors.error },
  SUSPENDED: { label: 'Suspended', bg: colors.errorSoft,   color: colors.error },
};

// Fix #4 - mentors now carry a real status too (previously only the available boolean existed).
// PENDING applications can now be approved/rejected directly from this roster (previously only
// AdminDashboardScreen's separate queue could do this, which was a real gap - an admin looking at
// "Counsellor Management" specifically to review a new signup had no action available here at
// all). The activate/deactivate toggle still only applies to APPROVED rows, since toggling
// "available" on a still-PENDING or REJECTED application doesn't mean anything. An APPROVED row
// can still be independently active/deactivated, hence the function (not a flat lookup) - it
// depends on both fields.
function mentorBadge(item: PeerMentorAdminView): { label: string; bg: string; color: string } {
  if (item.status === 'PENDING') return { label: 'Pending', bg: colors.warningSoft, color: colors.warning };
  if (item.status === 'REJECTED') return { label: 'Rejected', bg: colors.errorSoft, color: colors.error };
  return item.available
    ? { label: 'Active', bg: colors.successSoft, color: colors.success }
    : { label: 'Deactivated', bg: colors.errorSoft, color: colors.error };
}

export function AdminCounsellorMentorManagementScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const keyboardHeight = useKeyboardOffset();
  const token = useAuthStore((s) => s.token) ?? '';

  const [tab, setTab] = useState<Tab>('counsellors');
  const [counsellors, setCounsellors] = useState<CounsellorRequestAdminView[]>([]);
  const [mentors, setMentors] = useState<PeerMentorAdminView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionId, setActionId] = useState<number | null>(null);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editSpecialties, setEditSpecialties] = useState('');
  const [saving, setSaving] = useState(false);

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
      setError(getErrorMessage(err, 'Could not load the roster.'));
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
            Alert.alert('Error', getErrorMessage(err, 'Could not suspend this counsellor.'));
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
      Alert.alert('Error', getErrorMessage(err, 'Could not reinstate this counsellor.'));
    } finally { setActionId(null); }
  };

  // approveCounsellorRequest promotes the applicant's auth role STUDENT -> COUNSELLOR server-side
  // (AuthService#updateRole via a cross-service call) - this is the actual fix for "signed up as
  // counsellor but admin's User Management still shows STUDENT": that's correct *until* approved,
  // and this button is what was missing to close the loop from this screen.
  const handleApproveCounsellor = async (item: CounsellorRequestAdminView) => {
    setActionId(item.id);
    try {
      const updated = await approveCounsellorRequest(token, item.id);
      setCounsellors((prev) => prev.map((c) => c.id === item.id ? updated : c));
    } catch (err) {
      Alert.alert('Error', getErrorMessage(err, 'Could not approve this application.'));
    } finally { setActionId(null); }
  };

  const handleRejectCounsellor = (item: CounsellorRequestAdminView) => {
    Alert.alert('Reject application?', `${item.name}'s counsellor application will be rejected.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reject', style: 'destructive',
        onPress: async () => {
          setActionId(item.id);
          try {
            const updated = await rejectCounsellorRequest(token, item.id);
            setCounsellors((prev) => prev.map((c) => c.id === item.id ? updated : c));
          } catch (err) {
            Alert.alert('Error', getErrorMessage(err, 'Could not reject this application.'));
          } finally { setActionId(null); }
        },
      },
    ]);
  };

  const handleApproveMentor = async (item: PeerMentorAdminView) => {
    setActionId(item.id);
    try {
      const updated = await approveMentorApplication(token, item.id);
      setMentors((prev) => prev.map((m) => m.id === item.id ? updated : m));
    } catch (err) {
      Alert.alert('Error', getErrorMessage(err, 'Could not approve this application.'));
    } finally { setActionId(null); }
  };

  const handleRejectMentor = (item: PeerMentorAdminView) => {
    Alert.alert('Reject application?', `${item.name}'s peer mentor application will be rejected.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reject', style: 'destructive',
        onPress: async () => {
          setActionId(item.id);
          try {
            const updated = await rejectMentorApplication(token, item.id);
            setMentors((prev) => prev.map((m) => m.id === item.id ? updated : m));
          } catch (err) {
            Alert.alert('Error', getErrorMessage(err, 'Could not reject this application.'));
          } finally { setActionId(null); }
        },
      },
    ]);
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
            Alert.alert('Error', getErrorMessage(err, 'Could not deactivate this mentor.'));
          } finally { setActionId(null); }
        },
      },
    ]);
  };

  const startEditCounsellor = (item: CounsellorRequestAdminView) => {
    setEditingId(item.id);
    setEditTitle(item.title ?? '');
    setEditBio(item.bio ?? '');
    setEditSpecialties(item.specialties ?? '');
  };

  const cancelEdit = () => setEditingId(null);

  const saveEditCounsellor = async (item: CounsellorRequestAdminView) => {
    setSaving(true);
    try {
      const updated = await adminEditCounsellor(token, item.id, {
        title: editTitle.trim(),
        bio: editBio.trim(),
        specialties: editSpecialties.trim(),
      });
      setCounsellors((prev) => prev.map((c) => c.id === item.id ? updated : c));
      setEditingId(null);
    } catch (err) {
      Alert.alert('Error', getErrorMessage(err, 'Could not save changes.'));
    } finally {
      setSaving(false);
    }
  };

  const handleActivateMentor = async (item: PeerMentorAdminView) => {
    setActionId(item.id);
    try {
      const updated = await activateMentor(token, item.id);
      setMentors((prev) => prev.map((m) => m.id === item.id ? updated : m));
    } catch (err) {
      Alert.alert('Error', getErrorMessage(err, 'Could not reactivate this mentor.'));
    } finally { setActionId(null); }
  };

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <LinearGradient colors={['#24412A', '#579E65']} style={s.header}
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

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 + keyboardHeight }}
      >
        {error ? (
          <View style={s.alertBanner}>
            <Ionicons name="warning-outline" size={18} color={colors.error} />
            <Text style={s.alertText}>{error}</Text>
          </View>
        ) : loading ? (
          <ActivityIndicator color={colors.coral} style={{ marginVertical: 40 }} />
        ) : tab === 'counsellors' ? (
          counsellors.length === 0 ? (
            <View style={s.emptyState}>
              <Ionicons name="people-outline" size={40} color={colors.inkFaint} />
              <Text style={s.emptyBody}>No counsellors on the roster yet.</Text>
            </View>
          ) : counsellors.map((item, idx) => {
            const meta = STATUS_META[item.status];
            return (
              <FadeInItem key={item.id} index={idx} style={s.card}>
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
                {editingId === item.id ? (
                  <View style={s.editForm}>
                    <Text style={s.editLabel}>Title</Text>
                    <TextInput style={s.editInput} value={editTitle} onChangeText={setEditTitle} placeholder="e.g. Licensed Clinical Psychologist" placeholderTextColor={colors.inkFaint} />
                    <Text style={s.editLabel}>Bio</Text>
                    <TextInput style={[s.editInput, s.editInputMulti]} value={editBio} onChangeText={setEditBio} multiline placeholder="Short bio shown to students" placeholderTextColor={colors.inkFaint} />
                    <Text style={s.editLabel}>Specialties</Text>
                    <TextInput style={s.editInput} value={editSpecialties} onChangeText={setEditSpecialties} placeholder="Comma-separated, e.g. Anxiety, Depression" placeholderTextColor={colors.inkFaint} />
                    <View style={s.editActions}>
                      <Pressable style={s.editCancelBtn} onPress={cancelEdit} disabled={saving}>
                        <Text style={s.editCancelText}>Cancel</Text>
                      </Pressable>
                      <Pressable style={s.editSaveBtn} onPress={() => saveEditCounsellor(item)} disabled={saving}>
                        {saving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={s.editSaveText}>Save</Text>}
                      </Pressable>
                    </View>
                  </View>
                ) : (
                  <>
                    {item.specialties ? <Text style={s.cardSpecialties}>{item.specialties}</Text> : null}
                    {item.status === 'PENDING' && (
                      <Text style={s.pendingHint}>New application — approve to grant Counsellor access.</Text>
                    )}
                    <View style={s.actionRow}>
                      {item.status === 'PENDING' ? (
                        <>
                          <Pressable
                            style={[s.rejectBtn, actionId === item.id && s.btnDisabled]}
                            onPress={() => handleRejectCounsellor(item)}
                            disabled={actionId === item.id}
                          >
                            <Text style={s.rejectBtnText}>Reject</Text>
                          </Pressable>
                          <Pressable
                            style={[s.approveBtn, actionId === item.id && s.btnDisabled]}
                            onPress={() => handleApproveCounsellor(item)}
                            disabled={actionId === item.id}
                          >
                            {actionId === item.id
                              ? <ActivityIndicator size="small" color="#fff" />
                              : <Text style={s.approveBtnText}>Approve</Text>}
                          </Pressable>
                        </>
                      ) : (
                        <>
                          <Pressable
                            style={[s.editBtn, actionId === item.id && s.btnDisabled]}
                            onPress={() => startEditCounsellor(item)}
                            disabled={actionId === item.id}
                          >
                            <Text style={s.editBtnText}>Edit</Text>
                          </Pressable>
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
                        </>
                      )}
                    </View>
                  </>
                )}
              </FadeInItem>
            );
          })
        ) : mentors.length === 0 ? (
          <View style={s.emptyState}>
            <Ionicons name="leaf-outline" size={40} color={colors.inkFaint} />
            <Text style={s.emptyBody}>No peer mentors on the roster yet.</Text>
          </View>
        ) : mentors.map((item, idx) => {
          const badge = mentorBadge(item);
          return (
            <FadeInItem key={item.id} index={idx} style={s.card}>
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
                  ? 'New application — approve to grant Mentor access.'
                  : item.userId ? 'Account linked' : 'No account linked yet'}
              </Text>
              {item.status === 'PENDING' && (
                <View style={s.actionRow}>
                  <Pressable
                    style={[s.rejectBtn, actionId === item.id && s.btnDisabled]}
                    onPress={() => handleRejectMentor(item)}
                    disabled={actionId === item.id}
                  >
                    <Text style={s.rejectBtnText}>Reject</Text>
                  </Pressable>
                  <Pressable
                    style={[s.approveBtn, actionId === item.id && s.btnDisabled]}
                    onPress={() => handleApproveMentor(item)}
                    disabled={actionId === item.id}
                  >
                    {actionId === item.id
                      ? <ActivityIndicator size="small" color="#fff" />
                      : <Text style={s.approveBtnText}>Approve</Text>}
                  </Pressable>
                </View>
              )}
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
            </FadeInItem>
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
  tabBtnActive: { backgroundColor: colors.coral },
  tabText: { fontFamily: fonts.bodyBold, fontSize: fontSizes.sm, color: colors.inkSoft },
  tabTextActive: { color: '#fff' },

  alertBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: spacing.xl, marginTop: spacing.md,
    backgroundColor: colors.errorSoft, borderRadius: radii.md, padding: spacing.md,
    borderLeftWidth: 3, borderLeftColor: colors.error,
  },
  alertText: { fontFamily: fonts.bodyMedium, fontSize: fontSizes.sm, color: colors.errorDeep, flex: 1 },

  emptyState: { alignItems: 'center', paddingVertical: spacing.xxl, gap: 10, marginHorizontal: spacing.xl },
  emptyBody: { fontFamily: fonts.bodyMedium, fontSize: fontSizes.sm, color: colors.inkSoft, textAlign: 'center' },

  card: {
    backgroundColor: colors.surface, borderRadius: radii.md, padding: spacing.lg,
    marginHorizontal: spacing.xl, marginBottom: spacing.md, ...shadow.sm,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm, gap: spacing.sm },
  avatarCircle: {
    width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.coral,
  },
  avatarText: { fontFamily: fonts.display, fontSize: fontSizes.lg, color: '#fff' },
  cardInfo: { flex: 1 },
  cardName: { fontFamily: fonts.bodyBold, fontSize: fontSizes.md, color: colors.ink },
  cardTitle: { fontFamily: fonts.bodyMedium, fontSize: fontSizes.sm, color: colors.inkSoft },
  statusBadge: { borderRadius: radii.pill, paddingHorizontal: spacing.sm, paddingVertical: 2 },
  statusBadgeText: { fontFamily: fonts.bodyBold, fontSize: 9, letterSpacing: 0.5 },
  cardSpecialties: { fontFamily: fonts.bodyMedium, fontSize: fontSizes.sm, color: colors.ink, marginBottom: spacing.md },

  actionRow: { flexDirection: 'row', gap: spacing.sm },
  suspendBtn: {
    flex: 1, paddingVertical: spacing.sm, borderRadius: radii.md, borderWidth: 1.5,
    borderColor: colors.coral, alignItems: 'center', justifyContent: 'center',
  },
  suspendBtnText: { fontFamily: fonts.bodyBold, fontSize: fontSizes.sm, color: colors.coral },
  reinstateBtn: {
    flex: 1, paddingVertical: spacing.sm, borderRadius: radii.md, backgroundColor: colors.sage,
    alignItems: 'center', justifyContent: 'center',
  },
  reinstateBtnText: { fontFamily: fonts.bodyBold, fontSize: fontSizes.sm, color: '#fff' },
  editBtn: {
    flex: 1, paddingVertical: spacing.sm, borderRadius: radii.md, borderWidth: 1.5,
    borderColor: colors.coral, alignItems: 'center', justifyContent: 'center',
  },
  editBtnText: { fontFamily: fonts.bodyBold, fontSize: fontSizes.sm, color: colors.coral },
  pendingHint: {
    fontFamily: fonts.bodyMedium, fontSize: fontSizes.xs, color: colors.sunText, marginBottom: spacing.sm,
  },
  approveBtn: {
    flex: 1, paddingVertical: spacing.sm, borderRadius: radii.md, backgroundColor: colors.sage,
    alignItems: 'center', justifyContent: 'center',
  },
  approveBtnText: { fontFamily: fonts.bodyBold, fontSize: fontSizes.sm, color: '#fff' },
  rejectBtn: {
    flex: 1, paddingVertical: spacing.sm, borderRadius: radii.md, borderWidth: 1.5,
    borderColor: colors.coral, alignItems: 'center', justifyContent: 'center',
  },
  rejectBtnText: { fontFamily: fonts.bodyBold, fontSize: fontSizes.sm, color: colors.coral },
  btnDisabled: { opacity: 0.5 },

  editForm: { gap: 6 },
  editLabel: { fontFamily: fonts.bodyBold, fontSize: fontSizes.xs, color: colors.inkSoft, marginTop: 4 },
  editInput: {
    borderWidth: 1.5, borderColor: colors.line, borderRadius: radii.sm,
    paddingHorizontal: spacing.sm, paddingVertical: 8,
    fontFamily: fonts.body, fontSize: fontSizes.sm, color: colors.ink,
  },
  editInputMulti: { minHeight: 60, textAlignVertical: 'top' },
  editActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  editCancelBtn: {
    flex: 1, paddingVertical: spacing.sm, borderRadius: radii.md, borderWidth: 1.5,
    borderColor: colors.line, alignItems: 'center', justifyContent: 'center',
  },
  editCancelText: { fontFamily: fonts.bodyBold, fontSize: fontSizes.sm, color: colors.inkSoft },
  editSaveBtn: {
    flex: 1, paddingVertical: spacing.sm, borderRadius: radii.md, backgroundColor: colors.coral,
    alignItems: 'center', justifyContent: 'center',
  },
  editSaveText: { fontFamily: fonts.bodyBold, fontSize: fontSizes.sm, color: '#fff' },
});
