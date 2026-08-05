import React, { useCallback, useState } from 'react';
import {
  View, Text, Pressable, StyleSheet, ScrollView, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { CounsellorTabParamList, RootStackParamList } from '@/navigation/types';
import { useAuthStore } from '@/state/useAuthStore';
import { useToast } from '@/state/useToast';
import {
  listCounsellorAppointments,
  listCounsellorConversations,
} from '@/api/support';
import type { CounsellorAppointmentView, CounsellorConversationView } from '@/api/types';
import { hapticLight } from '@/utils/haptics';
import { listOpenAlerts, updateAlert, type CrisisAlertDto } from '@/api/crisis';
import { colors, fonts, fontSizes, radii, spacing, shadow } from '@/theme/tokens';

type Props = CompositeScreenProps<
  BottomTabScreenProps<CounsellorTabParamList, 'Dashboard'>,
  NativeStackScreenProps<RootStackParamList>
>;

type StatusKey = 'ONLINE' | 'BUSY' | 'AWAY';
const STATUS_OPTIONS: { key: StatusKey; label: string; color: string; bg: string }[] = [
  { key: 'ONLINE', label: '● Online',   color: '#27AE60', bg: '#E8F8EF' },
  { key: 'BUSY',   label: '● Busy',     color: '#E67E22', bg: '#FEF3E2' },
  { key: 'AWAY',   label: '● Away',     color: '#95A5A6', bg: '#F2F3F4' },
];

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}
function formatDate(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return 'Today';
  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
  if (d.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export function CounsellorDashboardScreen({ navigation }: Props) {
  const insets  = useSafeAreaInsets();
  const token   = useAuthStore((s) => s.token);
  const user    = useAuthStore((s) => s.user);
  const toast   = useToast();

  const [status, setStatus]       = useState<StatusKey>('ONLINE');
  const [statusOpen, setStatusOpen] = useState(false);
  const [appointments, setAppointments] = useState<CounsellorAppointmentView[]>([]);
  const [convos, setConvos]       = useState<CounsellorConversationView[]>([]);
  const [loading, setLoading]     = useState(true);
  const [crisisAlerts, setCrisisAlerts] = useState<CrisisAlertDto[]>([]);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const [appts, msgs, crisisData] = await Promise.all([
        listCounsellorAppointments(token),
        listCounsellorConversations(token),
        listOpenAlerts(token),
      ]);
      setAppointments(appts);
      setConvos(msgs);
      setCrisisAlerts(crisisData);
    } catch {
      toast('Could not load dashboard');
    } finally {
      setLoading(false);
    }
  }, [token, toast]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const currentStatus = STATUS_OPTIONS.find(s => s.key === status)!;

  // Stats
  const todayAppts  = appointments.filter(a => {
    const d = new Date(a.scheduledAt);
    return d.toDateString() === new Date().toDateString();
  });
  const pendingCount   = appointments.filter(a => a.status === 'PENDING').length;
  const unreadCount    = convos.filter(c => c.unreadCount > 0).length;
  const upcomingAppts  = appointments
    .filter(a => a.status === 'CONFIRMED' || a.status === 'PENDING')
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
    .slice(0, 4);

  const firstName = user?.fullName?.split(' ')[0] ?? 'Counsellor';

  const handleCrisisAction = (alert: CrisisAlertDto, action: 'ACKNOWLEDGE' | 'RESOLVE') => {
    const label = action === 'ACKNOWLEDGE' ? 'Acknowledge' : 'Resolve';
    Alert.alert(
      `${label} alert?`,
      action === 'RESOLVE'
        ? 'Mark this crisis alert as resolved after you have followed up with the student.'
        : 'Confirm you have seen this alert and are following up with the student.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: label,
          onPress: async () => {
            if (!token) return;
            try {
              const updated = await updateAlert(token, alert.id, action);
              setCrisisAlerts((prev) => prev.filter((a) => a.id !== updated.id));
            } catch {
              Alert.alert('Error', 'Could not update alert. Try again.');
            }
          },
        },
      ],
    );
  };

    return (
    <View style={s.root}>
      {/* ── Header ── */}
      <LinearGradient
        colors={['#1B4F72', '#2980B9', '#5DADE2']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[s.header, { paddingTop: insets.top + spacing.md }]}
      >
        {/* Name + status */}
        <View style={s.headerTop}>
          <View>
            <Text style={s.greeting}>Good {getTimeOfDay()} 👋</Text>
            <Text style={s.name}>{firstName}</Text>
          </View>
          {/* Status toggle */}
          <View>
            <Pressable
              style={[s.statusPill, { backgroundColor: currentStatus.bg }]}
              onPress={() => { hapticLight(); setStatusOpen(v => !v); }}
            >
              <Text style={[s.statusLabel, { color: currentStatus.color }]}>{currentStatus.label}</Text>
              <Text style={[s.statusCaret, { color: currentStatus.color }]}>▾</Text>
            </Pressable>
            {statusOpen && (
              <View style={s.statusDropdown}>
                {STATUS_OPTIONS.map(opt => (
                  <Pressable
                    key={opt.key}
                    style={[s.statusOption, opt.key === status && s.statusOptionActive]}
                    onPress={() => { setStatus(opt.key); setStatusOpen(false); hapticLight(); }}
                  >
                    <Text style={[s.statusOptionLabel, { color: opt.color }]}>{opt.label}</Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* Stats strip */}
        <View style={s.statsRow}>
          <View style={s.statItem}>
            <Text style={s.statNum}>{todayAppts.length}</Text>
            <Text style={s.statLbl}>Today</Text>
          </View>
          <View style={s.statDivider} />
          <View style={s.statItem}>
            <Text style={s.statNum}>{pendingCount}</Text>
            <Text style={s.statLbl}>Pending</Text>
          </View>
          <View style={s.statDivider} />
          <View style={s.statItem}>
            <Text style={s.statNum}>{convos.length}</Text>
            <Text style={s.statLbl}>Clients</Text>
          </View>
          <View style={s.statDivider} />
          <View style={s.statItem}>
            <Text style={s.statNum}>{unreadCount}</Text>
            <Text style={s.statLbl}>Unread</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 110 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Quick actions */}
        <View style={s.quickRow}>
          <Pressable style={[s.quickCard, { backgroundColor: '#EBF5FB' }]}
            onPress={() => (navigation as any).navigate('Appointments')}>
            <Text style={s.quickIcon}>📅</Text>
            <Text style={s.quickLabel}>Appointments</Text>
          </Pressable>
          <Pressable style={[s.quickCard, { backgroundColor: '#EAF4FF' }]}
            onPress={() => (navigation as any).navigate('Conversations')}>
            <Text style={s.quickIcon}>💬</Text>
            <Text style={s.quickLabel}>Messages</Text>
            {unreadCount > 0 && (
              <View style={s.unreadBadge}><Text style={s.unreadNum}>{unreadCount}</Text></View>
            )}
          </Pressable>
          <Pressable style={[s.quickCard, { backgroundColor: '#F0EBFF' }]}
            onPress={() => (navigation as any).navigate('CounsellorProfile')}>
            <Text style={s.quickIcon}>👤</Text>
            <Text style={s.quickLabel}>Profile</Text>
          </Pressable>
        </View>

        {/* Upcoming appointments */}
        <View style={s.sectionRow}>
          <Text style={s.sectionTitle}>Upcoming Sessions</Text>
          <Pressable onPress={() => (navigation as any).navigate('Appointments')}>
            <Text style={s.seeAll}>See all →</Text>
          </Pressable>
        </View>

        {loading ? (
          [0,1,2].map(i => <View key={i} style={[s.apptCard, s.skeleton]} />)
        ) : upcomingAppts.length === 0 ? (
          <View style={s.emptyBox}>
            <Text style={s.emptyEmoji}>📭</Text>
            <Text style={s.emptyTitle}>No upcoming sessions</Text>
            <Text style={s.emptySub}>New appointment requests will appear here</Text>
          </View>
        ) : (
          upcomingAppts.map(appt => (
            <View key={appt.id} style={s.apptCard}>
              <View style={s.apptLeft}>
                <View style={s.apptDateBox}>
                  <Text style={s.apptDayName}>{formatDate(appt.scheduledAt)}</Text>
                  <Text style={s.apptTime}>{formatTime(appt.scheduledAt)}</Text>
                </View>
              </View>
              <View style={s.apptRight}>
                <Text style={s.apptStudent}>{appt.studentName}</Text>
                <View style={[s.apptBadge,
                  appt.status === 'PENDING'   && s.badgePending,
                  appt.status === 'CONFIRMED' && s.badgeConfirmed,
                ]}>
                  <Text style={[s.apptBadgeTxt,
                    appt.status === 'PENDING'   && s.badgePendingTxt,
                    appt.status === 'CONFIRMED' && s.badgeConfirmedTxt,
                  ]}>{appt.status}</Text>
                </View>
              </View>
              <Text style={s.apptChevron}>›</Text>
            </View>
          ))
        )}

        {/* Recent messages */}
        {convos.length > 0 && (
          <>
            <View style={s.sectionRow}>
              <Text style={s.sectionTitle}>Recent Messages</Text>
              <Pressable onPress={() => (navigation as any).navigate('Conversations')}>
                <Text style={s.seeAll}>See all →</Text>
              </Pressable>
            </View>
            {convos.slice(0, 3).map(c => (
              <Pressable
                key={c.id}
                style={s.msgCard}
                onPress={() => navigation.navigate('CounsellorChat', {
                  conversationId: c.id,
                  studentName: c.studentName,
                })}
              >
                <View style={s.msgAvatar}>
                  <Text style={s.msgAvatarTxt}>{c.studentName.charAt(0).toUpperCase()}</Text>
                </View>
                <View style={s.msgBody}>
                  <View style={s.msgTop}>
                    <Text style={s.msgName}>{c.studentName}</Text>
                    <Text style={s.msgTime}>{c.createdAt ? formatTime(c.createdAt) : ''}</Text>
                  </View>
                  <Text style={s.msgPreview} numberOfLines={1}>{c.lastMessagePreview ?? 'No messages yet'}</Text>
                </View>
                {c.unreadCount > 0 && (
                  <View style={s.msgBadge}><Text style={s.msgBadgeNum}>{c.unreadCount}</Text></View>
                )}
              </Pressable>
            ))}
          </>
        )}

        {/* Wellbeing tip card */}
        <View style={s.tipCard}>
          <LinearGradient colors={['#1B4F72', '#2980B9']} style={s.tipGrad} start={{x:0,y:0}} end={{x:1,y:1}}>
            <Text style={s.tipEmoji}>💡</Text>
            <Text style={s.tipTitle}>Counsellor Tip</Text>
            <Text style={s.tipBody}>
              Remember to check in on your own wellbeing too. Peer supporters are most effective when they feel supported themselves.
            </Text>

        {/* ── Crisis Alerts ── */}
        {crisisAlerts.length > 0 && (
          <View style={s.crisisSection}>
            <View style={s.crisisTitleRow}>
              <View style={s.crisisBadge}>
                <Ionicons name="warning" size={14} color="#fff" />
                <Text style={s.crisisBadgeTxt}>{crisisAlerts.length} CRISIS ALERT{crisisAlerts.length > 1 ? 'S' : ''}</Text>
              </View>
              <Text style={s.crisisSubtitle}>Requires immediate attention</Text>
            </View>
            {crisisAlerts.map((alert) => (
              <View key={alert.id} style={[s.crisisCard, alert.severity === 'CRITICAL' && s.crisisCardCritical]}>
                <View style={s.crisisCardHeader}>
                  <View style={[s.severityDot, alert.severity === 'CRITICAL' ? s.dotCritical : s.dotHigh]} />
                  <Text style={s.crisisSeverity}>{alert.severity}</Text>
                  <Text style={s.crisisSource}>{alert.source.replace('_', ' ')}</Text>
                  <Text style={s.crisisTime}>
                    {new Date(alert.createdAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                  </Text>
                </View>
                <Text style={s.crisisTrigger} numberOfLines={3}>"{alert.triggerText}"</Text>
                <Text style={s.crisisKeywords}>Keywords: {alert.matchedKeywords}</Text>
                <View style={s.crisisActions}>
                  <Pressable style={s.crisisAckBtn} onPress={() => handleCrisisAction(alert, 'ACKNOWLEDGE')}>
                    <Text style={s.crisisAckTxt}>👁 Acknowledge</Text>
                  </Pressable>
                  <Pressable style={s.crisisResolveBtn} onPress={() => handleCrisisAction(alert, 'RESOLVE')}>
                    <Text style={s.crisisResolveTxt}>✓ Resolved</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        )}

          </LinearGradient>
        </View>
      </ScrollView>
    </View>
  );
}

function getTimeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F0F6FF' },

  // Header
  header: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },
  headerTop: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: spacing.lg,
  },
  greeting: { fontFamily: fonts.bodyMedium, fontSize: fontSizes.xs, color: 'rgba(255,255,255,0.7)' },
  name: { fontFamily: fonts.display, fontSize: fontSizes.xl, color: '#FFFFFF', marginTop: 2 },

  // Status
  statusPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: radii.pill,
  },
  statusLabel: { fontFamily: fonts.bodyBold, fontSize: fontSizes.xs },
  statusCaret: { fontFamily: fonts.bodyBold, fontSize: 10 },
  statusDropdown: {
    position: 'absolute', right: 0, top: 36,
    backgroundColor: '#FFFFFF', borderRadius: 12,
    ...shadow.md, minWidth: 130, zIndex: 99,
    overflow: 'hidden',
  },
  statusOption: { paddingHorizontal: 14, paddingVertical: 10 },
  statusOptionActive: { backgroundColor: '#F0F6FF' },
  statusOptionLabel: { fontFamily: fonts.bodyBold, fontSize: fontSizes.xs },

  // Stats
  statsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16, paddingVertical: spacing.md,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  statItem: { flex: 1, alignItems: 'center' },
  statNum: { fontFamily: fonts.display, fontSize: fontSizes.xl, color: '#FFFFFF' },
  statLbl: { fontFamily: fonts.bodyMedium, fontSize: 10, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.25)' },

  // Scroll
  scroll: { flex: 1 },
  content: { padding: spacing.lg, gap: spacing.md },

  // Quick actions
  quickRow: { flexDirection: 'row', gap: spacing.md },
  quickCard: {
    flex: 1, borderRadius: 16, padding: spacing.md,
    alignItems: 'center', gap: 6,
    ...shadow.sm, position: 'relative',
  },
  quickIcon: { fontSize: 26 },
  quickLabel: { fontFamily: fonts.bodyBold, fontSize: 10, color: colors.ink },
  unreadBadge: {
    position: 'absolute', top: 8, right: 8,
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: colors.coral, alignItems: 'center', justifyContent: 'center',
  },
  unreadNum: { fontFamily: fonts.bodyBold, fontSize: 9, color: '#FFFFFF' },

  // Section
  sectionRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  sectionTitle: { fontFamily: fonts.bodyBold, fontSize: fontSizes.md, color: colors.ink },
  seeAll: { fontFamily: fonts.bodyBold, fontSize: fontSizes.xs, color: '#2980B9' },

  // Appointment cards
  apptCard: {
    backgroundColor: '#FFFFFF', borderRadius: 16,
    padding: spacing.md, flexDirection: 'row',
    alignItems: 'center', gap: spacing.md,
    ...shadow.sm,
  },
  skeleton: { height: 72, opacity: 0.4 },
  apptLeft: {},
  apptDateBox: {
    backgroundColor: '#EBF5FB', borderRadius: 10,
    padding: 10, alignItems: 'center', minWidth: 72,
  },
  apptDayName: { fontFamily: fonts.bodyBold, fontSize: fontSizes.xs, color: '#2980B9' },
  apptTime: { fontFamily: fonts.display, fontSize: fontSizes.md, color: '#1B4F72', marginTop: 2 },
  apptRight: { flex: 1 },
  apptStudent: { fontFamily: fonts.bodyBold, fontSize: fontSizes.base, color: colors.ink },
  apptBadge: {
    alignSelf: 'flex-start', marginTop: 4,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: radii.pill,
    backgroundColor: '#F2F3F4',
  },
  apptBadgeTxt: { fontFamily: fonts.bodyBold, fontSize: 9, color: colors.inkFaint, textTransform: 'uppercase' },
  badgePending:     { backgroundColor: '#FEF9E7' },
  badgePendingTxt:  { color: '#E67E22' },
  badgeConfirmed:   { backgroundColor: '#E8F8EF' },
  badgeConfirmedTxt:{ color: '#27AE60' },
  apptChevron: { fontSize: 22, color: colors.inkFaint },

  // Empty
  emptyBox: { alignItems: 'center', paddingVertical: spacing.xl, gap: 8 },
  emptyEmoji: { fontSize: 36 },
  emptyTitle: { fontFamily: fonts.bodyBold, fontSize: fontSizes.md, color: colors.ink },
  emptySub: { fontFamily: fonts.bodyMedium, fontSize: fontSizes.xs, color: colors.inkFaint, textAlign: 'center' },

  // Message cards
  msgCard: {
    backgroundColor: '#FFFFFF', borderRadius: 16,
    padding: spacing.md, flexDirection: 'row',
    alignItems: 'center', gap: spacing.md, ...shadow.sm,
  },
  msgAvatar: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: '#2980B9', alignItems: 'center', justifyContent: 'center',
  },
  msgAvatarTxt: { fontFamily: fonts.bodyBold, fontSize: fontSizes.md, color: '#FFFFFF' },
  msgBody: { flex: 1 },
  msgTop: { flexDirection: 'row', justifyContent: 'space-between' },
  msgName: { fontFamily: fonts.bodyBold, fontSize: fontSizes.base, color: colors.ink },
  msgTime: { fontFamily: fonts.bodyMedium, fontSize: fontSizes.xs, color: colors.inkFaint },
  msgPreview: { fontFamily: fonts.bodyMedium, fontSize: fontSizes.xs, color: colors.inkSoft, marginTop: 2 },
  msgBadge: {
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: '#2980B9', alignItems: 'center', justifyContent: 'center',
  },
  msgBadgeNum: { fontFamily: fonts.bodyBold, fontSize: 9, color: '#FFFFFF' },

  // Tip card
  tipCard: { borderRadius: 18, overflow: 'hidden' },
  tipGrad: { padding: spacing.lg, gap: spacing.sm },
  tipEmoji: { fontSize: 28 },
  tipTitle: { fontFamily: fonts.bodyBold, fontSize: fontSizes.md, color: '#FFFFFF' },
  tipBody: { fontFamily: fonts.bodyMedium, fontSize: fontSizes.sm, color: 'rgba(255,255,255,0.85)', lineHeight: 20 },

  // Crisis alerts
  crisisSection: { marginHorizontal: spacing.lg, marginTop: spacing.lg },
  crisisTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  crisisBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#C0392B', borderRadius: radii.pill,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  crisisBadgeTxt: { fontFamily: fonts.bodyBold, fontSize: 10, color: '#fff', letterSpacing: 0.5 },
  crisisSubtitle: { fontFamily: fonts.bodyMedium, fontSize: fontSizes.xs, color: colors.inkSoft },
  crisisCard: {
    backgroundColor: '#FFF8F7', borderRadius: radii.md, padding: spacing.md,
    marginBottom: spacing.sm, borderLeftWidth: 3, borderLeftColor: '#E67E22',
    ...shadow.sm,
  },
  crisisCardCritical: { borderLeftColor: '#C0392B', backgroundColor: '#FEF0EE' },
  crisisCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  severityDot: { width: 8, height: 8, borderRadius: 4 },
  dotCritical: { backgroundColor: '#C0392B' },
  dotHigh:     { backgroundColor: '#E67E22' },
  crisisSeverity: { fontFamily: fonts.bodyBold, fontSize: fontSizes.xs, color: '#C0392B', textTransform: 'uppercase' },
  crisisSource:   { fontFamily: fonts.body, fontSize: fontSizes.xs, color: colors.inkFaint, flex: 1 },
  crisisTime:     { fontFamily: fonts.body, fontSize: fontSizes.xs, color: colors.inkFaint },
  crisisTrigger:  { fontFamily: fonts.bodyMedium, fontSize: fontSizes.sm, color: colors.ink, lineHeight: 19, marginBottom: 4, fontStyle: 'italic' },
  crisisKeywords: { fontFamily: fonts.body, fontSize: fontSizes.xs, color: colors.inkSoft, marginBottom: 10 },
  crisisActions:  { flexDirection: 'row', gap: spacing.sm },
  crisisAckBtn:   { flex: 1, paddingVertical: 7, borderRadius: radii.sm, borderWidth: 1.5, borderColor: '#E67E22', alignItems: 'center' },
  crisisAckTxt:   { fontFamily: fonts.bodyBold, fontSize: fontSizes.xs, color: '#E67E22' },
  crisisResolveBtn: { flex: 1, paddingVertical: 7, borderRadius: radii.sm, backgroundColor: '#27AE60', alignItems: 'center' },
  crisisResolveTxt: { fontFamily: fonts.bodyBold, fontSize: fontSizes.xs, color: '#fff' },
});
