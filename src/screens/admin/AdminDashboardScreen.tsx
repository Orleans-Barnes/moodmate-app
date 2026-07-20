/**
 * AdminDashboardScreen — Mobile admin panel for MoodMate.
 *
 * Sections:
 *   1. Header with greeting + logout
 *   2. Platform stats row (students, counsellors, appointments, posts)
 *   3. Quick-action cards
 *   4. Pending counsellor approval queue
 *   5. Pending peer mentor application queue (Fix #4)
 */
import React, { useState, useCallback } from 'react';
import {
  View, Text, Pressable, StyleSheet, Alert,
  ActivityIndicator, ScrollView, TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { useAuthStore } from '@/state/useAuthStore';
import {
  listPendingCounsellorRequests,
  approveCounsellorRequest,
  rejectCounsellorRequest,
  listPendingMentorApplications,
  approveMentorApplication,
  rejectMentorApplication,
  getAdminStats,
  getWhitelist,
  addToWhitelist,
  removeFromWhitelist,
  type CounsellorRequestAdminView,
  type PeerMentorAdminView,
  type AdminStats,
  type WhitelistEntry,
} from '@/api/support';
import { ApiRequestError } from '@/api/client';
import { getOpenAlertCount } from '@/api/crisis';
import { colors, fonts, fontSizes, radii, spacing, shadow } from '@/theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'AdminDashboard'>;

const STAT_CARDS: {
  key: keyof AdminStats;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  from: string;
  to: string;
}[] = [
  { key: 'totalStudents',           label: 'Students',      icon: 'school-outline',      from: '#5B2FA0', to: '#9B59B6' },
  { key: 'totalCounsellors',        label: 'Counsellors',   icon: 'people-outline',      from: '#2980B9', to: '#5DADE2' },
  { key: 'totalAppointments',       label: 'Appointments',  icon: 'calendar-outline',    from: '#27AE60', to: '#58D68D' },
  { key: 'totalCommunityPosts',     label: 'Posts',         icon: 'chatbubbles-outline', from: '#E67E22', to: '#F39C12' },
];

export function AdminDashboardScreen({ navigation }: Props) {
  const insets  = useSafeAreaInsets();
  const token   = useAuthStore((s) => s.token) ?? '';
  const user    = useAuthStore((s) => s.user);
  const logout  = useAuthStore((s) => s.logout);

  const [requests, setRequests]   = useState<CounsellorRequestAdminView[]>([]);
  const [mentorRequests, setMentorRequests] = useState<PeerMentorAdminView[]>([]);
  const [stats, setStats]         = useState<AdminStats | null>(null);
  const [loading, setLoading]     = useState(true);
  const [actionId, setActionId]   = useState<number | null>(null);
  const [openCrisisCount, setOpenCrisisCount] = useState(0);
  const [apiError, setApiError]             = useState<string | null>(null);

  // Whitelist state
  const [whitelist, setWhitelist]           = useState<WhitelistEntry[]>([]);
  const [wlEmail, setWlEmail]               = useState('');
  const [wlNotes, setWlNotes]               = useState('');
  const [wlAdding, setWlAdding]             = useState(false);
  const [wlError, setWlError]               = useState<string | null>(null);
  const [removingId, setRemovingId]         = useState<number | null>(null);

  const load = useCallback(async () => {
    setApiError(null);
    setWlError(null);
    try {
      const [sRes, rRes, mRes, crisisRes, wlRes] = await Promise.allSettled([
        getAdminStats(token),
        listPendingCounsellorRequests(token),
        listPendingMentorApplications(token),
        getOpenAlertCount(token),
        getWhitelist(token),
      ]);
      if (sRes.status === 'fulfilled') setStats(sRes.value);
      if (rRes.status === 'fulfilled') setRequests(rRes.value);
      if (mRes.status === 'fulfilled') setMentorRequests(mRes.value);
      if (crisisRes.status === 'fulfilled') setOpenCrisisCount(crisisRes.value.open);
      if (wlRes.status === 'fulfilled') setWhitelist(wlRes.value);
      // If ALL failed it's likely a 401 — handle below
      if ([sRes, rRes, mRes, crisisRes, wlRes].every(r => r.status === 'rejected')) {
        throw (sRes as PromiseRejectedResult).reason;
      }
    } catch (err: unknown) {
      // 401 → token expired or invalid — force re-login
      const msg = String(err);
      if (msg.includes('401') || msg.includes('Unauthorized')) {
        logout();
        navigation.replace('RoleSelect');
        return;
      }
      setApiError('Could not load dashboard. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, [token, logout, navigation]);

  useFocusEffect(useCallback(() => {
    setLoading(true);
    load();
  }, [load]));

  const handleApprove = (item: CounsellorRequestAdminView) => {
    Alert.alert(
      'Approve counsellor?',
      `${item.name} will be promoted and can start accepting appointments.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: async () => {
            setActionId(item.id);
            try {
              await approveCounsellorRequest(token, item.id);
              setRequests((p) => p.filter((r) => r.id !== item.id));
              setStats((s) => s ? { ...s, totalCounsellors: s.totalCounsellors + 1, pendingCounsellorRequests: s.pendingCounsellorRequests - 1 } : s);
            } catch {
              Alert.alert('Error', 'Could not approve. Please try again.');
            } finally { setActionId(null); }
          },
        },
      ],
    );
  };

  const handleReject = (item: CounsellorRequestAdminView) => {
    Alert.alert(
      'Reject request?',
      `${item.name}'s request will be rejected.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject', style: 'destructive',
          onPress: async () => {
            setActionId(item.id);
            try {
              await rejectCounsellorRequest(token, item.id);
              setRequests((p) => p.filter((r) => r.id !== item.id));
              setStats((s) => s ? { ...s, pendingCounsellorRequests: s.pendingCounsellorRequests - 1 } : s);
            } catch {
              Alert.alert('Error', 'Could not reject. Please try again.');
            } finally { setActionId(null); }
          },
        },
      ],
    );
  };

  // Fix #4 - mirrors handleApprove/handleReject above exactly (no stats field to bump here since
  // AdminStats doesn't track a peer mentor count yet).
  const handleApproveMentor = (item: PeerMentorAdminView) => {
    Alert.alert(
      'Approve peer mentor?',
      `${item.name} will be promoted and can start supporting students.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: async () => {
            setActionId(item.id);
            try {
              await approveMentorApplication(token, item.id);
              setMentorRequests((p) => p.filter((r) => r.id !== item.id));
            } catch {
              Alert.alert('Error', 'Could not approve. Please try again.');
            } finally { setActionId(null); }
          },
        },
      ],
    );
  };

  const handleRejectMentor = (item: PeerMentorAdminView) => {
    Alert.alert(
      'Reject application?',
      `${item.name}'s application will be rejected.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject', style: 'destructive',
          onPress: async () => {
            setActionId(item.id);
            try {
              await rejectMentorApplication(token, item.id);
              setMentorRequests((p) => p.filter((r) => r.id !== item.id));
            } catch {
              Alert.alert('Error', 'Could not reject. Please try again.');
            } finally { setActionId(null); }
          },
        },
      ],
    );
  };

  const handleAddToWhitelist = async () => {
    const email = wlEmail.trim().toLowerCase();
    if (!email) return;
    // Basic email format check before hitting the API
    if (!/.+@.+\..+/.test(email)) {
      setWlError('Please enter a valid email address.');
      return;
    }
    setWlAdding(true);
    setWlError(null);
    try {
      const entry = await addToWhitelist(token, email, wlNotes.trim() || undefined);
      setWhitelist((prev) => [entry, ...prev]);
      setWlEmail('');
      setWlNotes('');
    } catch (err: unknown) {
      // Use status code for reliable 409 detection rather than message string matching
      const status = err instanceof ApiRequestError ? err.status : 0;
      if (status === 409) {
        setWlError('That email is already on the whitelist.');
      } else if (status === 400) {
        setWlError('Please enter a valid email address.');
      } else {
        setWlError('Could not add email. Check your connection and try again.');
      }
    } finally {
      setWlAdding(false);
    }
  };

  const handleRemoveFromWhitelist = (entry: WhitelistEntry) => {
    setWlError(null);
    Alert.alert(
      'Remove from whitelist?',
      `${entry.email} will no longer be able to log in as a counsellor.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove', style: 'destructive',
          onPress: async () => {
            setRemovingId(entry.id);
            try {
              await removeFromWhitelist(token, entry.email);
              setWhitelist((prev) => prev.filter((e) => e.id !== entry.id));
            } catch {
              Alert.alert('Error', 'Could not remove. Please try again.');
            } finally {
              setRemovingId(null);
            }
          },
        },
      ],
    );
  };

  const handleLogout = () => {
    Alert.alert('Log out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log out', style: 'destructive', onPress: () => { logout(); navigation.replace('RoleSelect'); } },
    ]);
  };

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      {/* ── Gradient header ── */}
      <LinearGradient colors={['#2C1654', '#5B2FA0', '#2980B9']}
        style={s.header} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <View>
          <Text style={s.headerTitle}>Admin Panel 🛡️</Text>
          <Text style={s.headerSub}>Welcome back, {user?.fullName ?? 'Admin'}</Text>
        </View>
        <Pressable style={s.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={18} color="#fff" />
        </Pressable>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}>

        {/* ── Platform stats ── */}
        <Text style={s.sectionTitle}>Platform Overview</Text>
        {apiError ? (
          <View style={[s.alertBanner, { borderLeftColor: '#C0392B', backgroundColor: '#FEF0EE', marginHorizontal: spacing.xl, marginTop: 0 }]}>
            <Ionicons name="warning-outline" size={18} color="#C0392B" />
            <Text style={[s.alertText, { color: '#7B1010', flex: 1 }]}>{apiError}</Text>
            <Pressable onPress={() => { setLoading(true); load(); }}>
              <Text style={{ fontFamily: fonts.bodyBold, fontSize: fontSizes.sm, color: '#C0392B' }}>Retry</Text>
            </Pressable>
          </View>
        ) : loading ? (
          <ActivityIndicator color={colors.lavender} style={{ marginVertical: 20 }} />
        ) : (
          <View style={s.statsGrid}>
            {STAT_CARDS.map((card) => (
              <LinearGradient key={card.key}
                colors={[card.from, card.to]}
                style={s.statCard}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                <Ionicons name={card.icon} size={22} color="rgba(255,255,255,0.85)" />
                <Text style={s.statNum}>
                  {stats ? String(stats[card.key]) : '—'}
                </Text>
                <Text style={s.statLabel}>{card.label}</Text>
              </LinearGradient>
            ))}
          </View>
        )}

        {/* Pending requests badge if any */}
        {stats && stats.pendingCounsellorRequests > 0 && (
          <View style={s.alertBanner}>
            <Ionicons name="alert-circle" size={18} color="#E67E22" />
            <Text style={s.alertText}>
              {stats.pendingCounsellorRequests} counsellor request{stats.pendingCounsellorRequests > 1 ? 's' : ''} awaiting your review
            </Text>
          </View>
        )}
        {mentorRequests.length > 0 && (
          <View style={s.alertBanner}>
            <Ionicons name="alert-circle" size={18} color="#E67E22" />
            <Text style={s.alertText}>
              {mentorRequests.length} peer mentor application{mentorRequests.length > 1 ? 's' : ''} awaiting your review
            </Text>
          </View>
        )}

        {/* ── Crisis alert banner ── */}
        {openCrisisCount > 0 && (
          <View style={[s.alertBanner, { borderLeftColor: '#C0392B', backgroundColor: '#FEF0EE' }]}>
            <Ionicons name="warning" size={18} color="#C0392B" />
            <Text style={[s.alertText, { color: '#7B1010' }]}>
              🚨 {openCrisisCount} open crisis alert{openCrisisCount > 1 ? 's' : ''} — counsellors are handling these
            </Text>
          </View>
        )}

        {/* ── Phase 1H - Admin Portal quick actions ── */}
        <Text style={s.sectionTitle}>Manage</Text>
        <View style={s.quickActionRow}>
          <Pressable style={s.quickActionCard} onPress={() => navigation.navigate('AdminUserManagement')}>
            <Ionicons name="people-circle-outline" size={26} color={colors.lavender} />
            <Text style={s.quickActionText}>Users</Text>
          </Pressable>
          <Pressable style={s.quickActionCard} onPress={() => navigation.navigate('AdminCounsellorMentorManagement')}>
            <Ionicons name="medkit-outline" size={26} color={colors.lavender} />
            <Text style={s.quickActionText}>Counsellors{'\n'}& Mentors</Text>
          </Pressable>
          <Pressable style={s.quickActionCard} onPress={() => navigation.navigate('AdminWellnessContent')}>
            <Ionicons name="leaf-outline" size={26} color={colors.lavender} />
            <Text style={s.quickActionText}>Wellness{'\n'}Content</Text>
          </Pressable>
        </View>
        <View style={[s.quickActionRow, { marginTop: spacing.sm }]}>
          <Pressable style={s.quickActionCard} onPress={() => navigation.navigate('AdminModeration')}>
            <Ionicons name="shield-outline" size={26} color={colors.lavender} />
            <Text style={s.quickActionText}>Community{'\n'}Moderation</Text>
          </Pressable>
          <Pressable style={s.quickActionCard} onPress={() => navigation.navigate('AdminSystemSettings')}>
            <Ionicons name="settings-outline" size={26} color={colors.lavender} />
            <Text style={s.quickActionText}>System{'\n'}Settings</Text>
          </Pressable>
          <Pressable style={s.quickActionCard} onPress={() => navigation.navigate('AdminAuditLog')}>
            <Ionicons name="document-text-outline" size={26} color={colors.lavender} />
            <Text style={s.quickActionText}>Audit{'\n'}Log</Text>
          </Pressable>
        </View>

        {/* ── Counsellor Approval Queue ── */}
        <Text style={s.sectionTitle}>Counsellor Requests</Text>
        {loading ? (
          <ActivityIndicator color={colors.lavender} style={{ margin: 20 }} />
        ) : requests.length === 0 ? (
          <View style={s.emptyState}>
            <Ionicons name="checkmark-circle-outline" size={44} color={colors.sage} />
            <Text style={s.emptyTitle}>All clear!</Text>
            <Text style={s.emptyBody}>No pending counsellor requests right now.</Text>
          </View>
        ) : (
          requests.map((item) => (
            <View key={item.id} style={s.card}>
              <View style={s.cardHeader}>
                <LinearGradient colors={['#5B2FA0', '#9B59B6']}
                  style={s.avatarCircle}>
                  <Text style={s.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
                </LinearGradient>
                <View style={s.cardInfo}>
                  <Text style={s.cardName}>{item.name}</Text>
                  <Text style={s.cardTitle}>{item.title || 'No title provided'}</Text>
                </View>
                <View style={s.pendingBadge}>
                  <Text style={s.pendingBadgeText}>PENDING</Text>
                </View>
              </View>

              {item.bio ? (
                <Text style={s.cardBio} numberOfLines={3}>{item.bio}</Text>
              ) : null}
              {item.specialties ? (
                <Text style={s.cardSpecialties}>🎯 {item.specialties}</Text>
              ) : null}

              <View style={s.actionRow}>
                <Pressable
                  style={[s.rejectBtn, actionId === item.id && s.btnDisabled]}
                  onPress={() => handleReject(item)}
                  disabled={actionId === item.id}>
                  {actionId === item.id
                    ? <ActivityIndicator size="small" color={colors.coral} />
                    : <Text style={s.rejectBtnText}>✕ Reject</Text>}
                </Pressable>
                <Pressable
                  style={[s.approveBtn, actionId === item.id && s.btnDisabled]}
                  onPress={() => handleApprove(item)}
                  disabled={actionId === item.id}>
                  {actionId === item.id
                    ? <ActivityIndicator size="small" color="#fff" />
                    : <Text style={s.approveBtnText}>✓ Approve</Text>}
                </Pressable>
              </View>
            </View>
          ))
        )}

        {/* ── Fix #4 - Peer Mentor Application Queue (mirrors Counsellor Requests above) ── */}
        <Text style={s.sectionTitle}>Peer Mentor Applications</Text>
        {loading ? (
          <ActivityIndicator color={colors.lavender} style={{ margin: 20 }} />
        ) : mentorRequests.length === 0 ? (
          <View style={s.emptyState}>
            <Ionicons name="checkmark-circle-outline" size={44} color={colors.sage} />
            <Text style={s.emptyTitle}>All clear!</Text>
            <Text style={s.emptyBody}>No pending peer mentor applications right now.</Text>
          </View>
        ) : (
          mentorRequests.map((item) => (
            <View key={item.id} style={s.card}>
              <View style={s.cardHeader}>
                <LinearGradient colors={['#2D6A4F', '#52B788']}
                  style={s.avatarCircle}>
                  <Text style={s.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
                </LinearGradient>
                <View style={s.cardInfo}>
                  <Text style={s.cardName}>{item.name}</Text>
                  <Text style={s.cardTitle}>{item.focusArea || 'No focus area provided'}</Text>
                </View>
                <View style={s.pendingBadge}>
                  <Text style={s.pendingBadgeText}>PENDING</Text>
                </View>
              </View>

              {item.bio ? (
                <Text style={s.cardBio} numberOfLines={3}>{item.bio}</Text>
              ) : null}

              <View style={s.actionRow}>
                <Pressable
                  style={[s.rejectBtn, actionId === item.id && s.btnDisabled]}
                  onPress={() => handleRejectMentor(item)}
                  disabled={actionId === item.id}>
                  {actionId === item.id
                    ? <ActivityIndicator size="small" color={colors.coral} />
                    : <Text style={s.rejectBtnText}>✕ Reject</Text>}
                </Pressable>
                <Pressable
                  style={[s.approveBtn, actionId === item.id && s.btnDisabled]}
                  onPress={() => handleApproveMentor(item)}
                  disabled={actionId === item.id}>
                  {actionId === item.id
                    ? <ActivityIndicator size="small" color="#fff" />
                    : <Text style={s.approveBtnText}>✓ Approve</Text>}
                </Pressable>
              </View>
            </View>
          ))
        )}

        {/* ── Counsellor Whitelist ── */}
        <Text style={s.sectionTitle}>Approved Counsellors</Text>
        <Text style={s.sectionSubtitle}>
          Emails added here are auto-promoted to Counsellor role on their next login.
        </Text>

        {/* Add new email */}
        <View style={s.wlAddBox}>
          <TextInput
            style={s.wlInput}
            placeholder="counsellor@example.com"
            placeholderTextColor={colors.inkFaint}
            value={wlEmail}
            onChangeText={setWlEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TextInput
            style={[s.wlInput, { marginTop: 6 }]}
            placeholder="Notes (optional)"
            placeholderTextColor={colors.inkFaint}
            value={wlNotes}
            onChangeText={setWlNotes}
          />
          {wlError ? <Text style={s.wlError}>{wlError}</Text> : null}
          <Pressable
            style={[s.wlAddBtn, (!wlEmail.trim() || wlAdding) && s.btnDisabled]}
            onPress={handleAddToWhitelist}
            disabled={!wlEmail.trim() || wlAdding}>
            {wlAdding
              ? <ActivityIndicator size="small" color="#fff" />
              : <Text style={s.wlAddBtnText}>+ Add to Whitelist</Text>}
          </Pressable>
        </View>

        {/* List */}
        {whitelist.length === 0 ? (
          <View style={[s.emptyState, { paddingVertical: spacing.xl }]}>
            <Ionicons name="person-add-outline" size={36} color={colors.inkFaint} />
            <Text style={s.emptyBody}>{'No approved counsellors yet.\nAdd an email above to get started.'}</Text>
          </View>
        ) : (
          whitelist.map((entry) => (
            <View key={entry.id} style={s.wlRow}>
              <View style={s.wlRowInfo}>
                <Text style={s.wlEmail} numberOfLines={1} ellipsizeMode="middle">{entry.email}</Text>
                {entry.notes ? <Text style={s.wlNoteLabel}>{entry.notes}</Text> : null}
              </View>
              <Pressable style={s.wlRemoveBtn} onPress={() => handleRemoveFromWhitelist(entry)}>
                <Ionicons name="trash-outline" size={16} color={colors.coral} />
              </Pressable>
            </View>
          ))
        )}

        {/* ── App Info ── */}
        <View style={s.infoBox}>
          <Ionicons name="information-circle-outline" size={16} color={colors.inkFaint} />
          <Text style={s.infoText}>
            MoodMate Admin · Mobile-only panel{'\n'}
            For bulk data exports, contact your tech team.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },

  // Header
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.xl, paddingVertical: spacing.xl,
  },
  headerTitle: { fontFamily: fonts.display, fontSize: fontSizes.xl + 2, color: '#fff' },
  headerSub:   { fontFamily: fonts.body, fontSize: fontSizes.sm, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  logoutBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.20)', alignItems: 'center', justifyContent: 'center',
  },

  // Section
  sectionTitle: {
    fontFamily: fonts.displaySemibold, fontSize: fontSizes.lg, color: colors.ink,
    marginHorizontal: spacing.xl, marginTop: spacing.xl, marginBottom: spacing.md,
  },

  // Stats grid (2x2)
  statsGrid: {
    flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: spacing.lg, gap: 12,
  },
  statCard: {
    width: '47%', borderRadius: radii.lg, padding: spacing.lg, alignItems: 'flex-start', gap: 6,
    shadowColor: 'rgba(43,37,48,0.15)', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1, shadowRadius: 12, elevation: 6,
  },
  statNum:   { fontFamily: fonts.display, fontSize: fontSizes.display, color: '#fff' },
  statLabel: { fontFamily: fonts.bodyBold, fontSize: fontSizes.xs, color: 'rgba(255,255,255,0.75)', textTransform: 'uppercase', letterSpacing: 0.5 },

  // Alert banner
  alertBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: spacing.xl, marginTop: spacing.md,
    backgroundColor: '#FEF3E2', borderRadius: radii.md, padding: spacing.md,
    borderLeftWidth: 3, borderLeftColor: '#E67E22',
  },
  alertText: { fontFamily: fonts.bodyMedium, fontSize: fontSizes.sm, color: '#7D4200', flex: 1 },

  // Phase 1H - quick action cards
  quickActionRow: { flexDirection: 'row', gap: spacing.sm, marginHorizontal: spacing.xl },
  quickActionCard: {
    flex: 1, backgroundColor: colors.surface, borderRadius: radii.md, paddingVertical: spacing.md,
    alignItems: 'center', gap: 6, ...shadow.sm,
  },
  quickActionText: { fontFamily: fonts.bodyBold, fontSize: 11, color: colors.ink, textAlign: 'center' },

  // Counsellor cards
  card: {
    backgroundColor: colors.surface, borderRadius: radii.md, padding: spacing.lg,
    marginHorizontal: spacing.xl, marginBottom: spacing.md, ...shadow.sm,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm, gap: spacing.sm },
  avatarCircle: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  avatarText:   { fontFamily: fonts.display, fontSize: fontSizes.lg, color: '#fff' },
  cardInfo:     { flex: 1 },
  cardName:     { fontFamily: fonts.bodyBold, fontSize: fontSizes.md, color: colors.ink },
  cardTitle:    { fontFamily: fonts.bodyMedium, fontSize: fontSizes.sm, color: colors.inkSoft },
  pendingBadge: { backgroundColor: '#FEF9E7', borderRadius: radii.pill, paddingHorizontal: spacing.sm, paddingVertical: 2 },
  pendingBadgeText: { fontFamily: fonts.bodyBold, fontSize: 9, color: '#8A6800', letterSpacing: 0.5 },
  cardBio:      { fontFamily: fonts.body, fontSize: fontSizes.sm, color: colors.inkSoft, marginBottom: spacing.sm, lineHeight: 20 },
  cardSpecialties: { fontFamily: fonts.bodyMedium, fontSize: fontSizes.sm, color: colors.ink, marginBottom: spacing.md },

  // Action buttons
  actionRow:     { flexDirection: 'row', gap: spacing.sm },
  rejectBtn:     { flex: 1, paddingVertical: spacing.sm, borderRadius: radii.md, borderWidth: 1.5, borderColor: colors.coral, alignItems: 'center', justifyContent: 'center' },
  rejectBtnText: { fontFamily: fonts.bodyBold, fontSize: fontSizes.sm, color: colors.coral },
  approveBtn:    { flex: 1, paddingVertical: spacing.sm, borderRadius: radii.md, backgroundColor: colors.sage, alignItems: 'center', justifyContent: 'center' },
  approveBtnText:{ fontFamily: fonts.bodyBold, fontSize: fontSizes.sm, color: '#fff' },
  btnDisabled:   { opacity: 0.5 },

  // Empty state
  emptyState: { alignItems: 'center', paddingVertical: spacing.xxl, gap: 10, marginHorizontal: spacing.xl },
  emptyTitle: { fontFamily: fonts.displaySemibold, fontSize: fontSizes.xl, color: colors.ink },
  emptyBody:  { fontFamily: fonts.bodyMedium, fontSize: fontSizes.sm, color: colors.inkSoft, textAlign: 'center', lineHeight: 22 },

  // Info box
  infoBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    marginHorizontal: spacing.xl, marginTop: spacing.xl,
    backgroundColor: '#F8F7FA', borderRadius: radii.md, padding: spacing.md,
  },
  infoText: { fontFamily: fonts.body, fontSize: fontSizes.xs, color: colors.inkFaint, lineHeight: 18, flex: 1 },

  // Section subtitle
  sectionSubtitle: {
    fontFamily: fonts.bodyMedium, fontSize: fontSizes.sm, color: colors.inkSoft,
    marginHorizontal: spacing.xl, marginBottom: spacing.md, lineHeight: 20,
  },

  // Whitelist add box
  wlAddBox: {
    marginHorizontal: spacing.xl, backgroundColor: colors.surface,
    borderRadius: radii.md, padding: spacing.md, marginBottom: spacing.md, ...shadow.sm,
  },
  wlInput: {
    fontFamily: fonts.body, fontSize: fontSizes.sm, color: colors.ink,
    backgroundColor: '#F4F2F8', borderRadius: radii.sm, paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm, borderWidth: 1, borderColor: 'transparent',
  },
  wlError: {
    fontFamily: fonts.bodyMedium, fontSize: fontSizes.xs, color: colors.coral,
    marginTop: 4,
  },
  wlAddBtn: {
    marginTop: spacing.sm, backgroundColor: colors.lavender, borderRadius: radii.md,
    paddingVertical: spacing.sm, alignItems: 'center', justifyContent: 'center',
  },
  wlAddBtnText: { fontFamily: fonts.bodyBold, fontSize: fontSizes.sm, color: '#fff' },

  // Whitelist rows
  wlRow: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: spacing.xl, marginBottom: spacing.sm,
    backgroundColor: colors.surface, borderRadius: radii.md, padding: spacing.md, ...shadow.sm,
  },
  wlRowInfo: { flex: 1 },
  wlEmail:   { fontFamily: fonts.bodyMedium, fontSize: fontSizes.sm, color: colors.ink },
  wlNoteLabel: { fontFamily: fonts.body, fontSize: fontSizes.xs, color: colors.inkSoft, marginTop: 2 },
  wlRemoveBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: '#FEF0EE', alignItems: 'center', justifyContent: 'center',
  },
});
