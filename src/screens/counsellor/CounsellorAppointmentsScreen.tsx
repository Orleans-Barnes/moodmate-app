import React, { useCallback, useState } from 'react';
import {
  View, Text, Pressable, StyleSheet, ScrollView, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { CounsellorTabParamList, RootStackParamList } from '@/navigation/types';
import { useToast } from '@/state/useToast';
import { useAuthStore } from '@/state/useAuthStore';
import {
  listCounsellorAppointments,
  confirmAppointment,
  completeAppointment,
  cancelAppointmentAsCounsellor,
} from '@/api/support';
import { ApiRequestError } from '@/api/client';
import type { AppointmentStatus, CounsellorAppointmentView } from '@/api/types';
import { hapticLight } from '@/utils/haptics';
import { colors, fonts, fontSizes, radii, spacing, shadow } from '@/theme/tokens';

type Props = CompositeScreenProps<
  BottomTabScreenProps<CounsellorTabParamList, 'Appointments'>,
  NativeStackScreenProps<RootStackParamList>
>;

type FilterTab = 'All' | 'Pending' | 'Confirmed' | 'Past';
const FILTERS: FilterTab[] = ['All', 'Pending', 'Confirmed', 'Past'];

const STATUS_MAP: Record<AppointmentStatus, { label: string; bg: string; color: string }> = {
  PENDING:   { label: 'Pending',   bg: '#FEF9E7', color: '#E67E22' },
  CONFIRMED: { label: 'Confirmed', bg: '#E8F8EF', color: '#27AE60' },
  CANCELLED: { label: 'Cancelled', bg: '#FDEDEC', color: '#E74C3C' },
  COMPLETED: { label: 'Completed', bg: '#EBF5FB', color: '#2980B9' },
};

function formatFull(iso: string): { date: string; time: string } {
  const d = new Date(iso);
  const today = new Date();
  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
  let date: string;
  if (d.toDateString() === today.toDateString()) date = 'Today';
  else if (d.toDateString() === tomorrow.toDateString()) date = 'Tomorrow';
  else date = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  return { date, time };
}

function filterAppts(appts: CounsellorAppointmentView[], tab: FilterTab): CounsellorAppointmentView[] {
  const now = new Date();
  switch (tab) {
    case 'Pending':   return appts.filter(a => a.status === 'PENDING');
    case 'Confirmed': return appts.filter(a => a.status === 'CONFIRMED');
    case 'Past':      return appts.filter(a => a.status === 'COMPLETED' || a.status === 'CANCELLED' || new Date(a.scheduledAt) < now);
    default:          return appts;
  }
}

export function CounsellorAppointmentsScreen({ navigation }: Props) {
  const insets   = useSafeAreaInsets();
  const toast    = useToast();
  const token    = useAuthStore((s) => s.token);

  const [appts, setAppts]     = useState<CounsellorAppointmentView[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<number | null>(null);
  const [filter, setFilter]   = useState<FilterTab>('All');

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      setAppts(await listCounsellorAppointments(token));
    } catch (err) {
      toast(err instanceof ApiRequestError ? err.message : 'Could not load appointments.');
    } finally {
      setLoading(false);
    }
  }, [token, toast]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function act(id: number, fn: () => Promise<CounsellorAppointmentView>) {
    setActingId(id);
    try {
      const updated = await fn();
      setAppts(prev => prev.map(a => a.id === id ? updated : a));
      hapticLight();
    } catch (err) {
      toast(err instanceof ApiRequestError ? err.message : 'Action failed.');
    } finally {
      setActingId(null);
    }
  }

  const visible = filterAppts(appts, filter)
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());

  const pendingCount = appts.filter(a => a.status === 'PENDING').length;

  return (
    <View style={s.root}>
      {/* Header */}
      <LinearGradient
        colors={['#1B4F72', '#2980B9', '#5DADE2']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[s.header, { paddingTop: insets.top + spacing.md }]}
      >
        <View style={s.headerRow}>
          <View>
            <Text style={s.headerTitle}>Appointments</Text>
            <Text style={s.headerSub}>{appts.length} total · {pendingCount} pending</Text>
          </View>
          {loading && <ActivityIndicator color="#FFFFFF" />}
        </View>

        {/* Filter tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.filterRow}
        >
          {FILTERS.map(f => (
            <Pressable
              key={f}
              style={[s.filterChip, filter === f && s.filterChipActive]}
              onPress={() => { hapticLight(); setFilter(f); }}
            >
              <Text style={[s.filterTxt, filter === f && s.filterTxtActive]}>{f}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </LinearGradient>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 110 }]}
        showsVerticalScrollIndicator={false}
      >
        {loading && appts.length === 0 ? (
          [0,1,2,3].map(i => <View key={i} style={[s.card, s.skeleton]} />)
        ) : visible.length === 0 ? (
          <View style={s.emptyBox}>
            <Text style={s.emptyEmoji}>📭</Text>
            <Text style={s.emptyTitle}>No {filter !== 'All' ? filter.toLowerCase() : ''} appointments</Text>
            <Text style={s.emptySub}>New bookings will appear here</Text>
          </View>
        ) : (
          visible.map(appt => {
            const { date, time } = formatFull(appt.scheduledAt);
            const st = STATUS_MAP[appt.status];
            const isActing = actingId === appt.id;
            return (
              <View key={appt.id} style={s.card}>
                {/* Date badge + name row */}
                <View style={s.cardTop}>
                  <View style={s.dateBadge}>
                    <Text style={s.dateBadgeDate}>{date}</Text>
                    <Text style={s.dateBadgeTime}>{time}</Text>
                  </View>
                  <View style={s.cardMeta}>
                    <Text style={s.studentName}>{appt.studentName}</Text>
                    <View style={s.badgeRow}>
                      {/* Premium gating breadth (Milestone item 7) - list is already ordered
                          priority-first server-side (SupportService.listCounsellorAppointments);
                          this badge just makes that ordering visible/legible. */}
                      {appt.priority && (
                        <View style={s.priorityBadge}>
                          <Text style={s.priorityBadgeTxt}>⚡ Priority</Text>
                        </View>
                      )}
                      <View style={[s.statusBadge, { backgroundColor: st.bg }]}>
                        <Text style={[s.statusTxt, { color: st.color }]}>{st.label}</Text>
                      </View>
                    </View>
                  </View>
                </View>

                {appt.notes ? (
                  <Text style={s.notes} numberOfLines={2}>📝 {appt.notes}</Text>
                ) : null}

                {/* Action buttons */}
                {isActing ? (
                  <ActivityIndicator color="#2980B9" style={{ marginTop: spacing.sm }} />
                ) : (
                  <View style={s.actions}>
                    {appt.status === 'PENDING' && (
                      <>
                        <Pressable
                          style={[s.btn, s.btnConfirm]}
                          onPress={() => act(appt.id, () => confirmAppointment(token!, appt.id))}
                        >
                          <Text style={[s.btnTxt, s.btnConfirmTxt]}>✓ Confirm</Text>
                        </Pressable>
                        <Pressable
                          style={[s.btn, s.btnCancel]}
                          onPress={() => act(appt.id, () => cancelAppointmentAsCounsellor(token!, appt.id))}
                        >
                          <Text style={[s.btnTxt, s.btnCancelTxt]}>✕ Decline</Text>
                        </Pressable>
                      </>
                    )}
                    {appt.status === 'CONFIRMED' && (
                      <>
                        {/* Phase 1F-B - the actual join-window time gate (15 min before, per
                            SupportService.buildMeetingWindow) is re-checked server-side by
                            VideoSessionScreen itself, not duplicated here. */}
                        <Pressable
                          style={[s.btn, s.btnJoin]}
                          onPress={() => navigation.navigate('VideoSession', {
                            appointmentId: appt.id,
                            otherPartyName: appt.studentName,
                          })}
                        >
                          <Text style={[s.btnTxt, s.btnJoinTxt]}>🎥 Join Session</Text>
                        </Pressable>
                        <Pressable
                          style={[s.btn, s.btnComplete]}
                          onPress={() => act(appt.id, () => completeAppointment(token!, appt.id))}
                        >
                          <Text style={[s.btnTxt, s.btnCompleteTxt]}>✓ Mark Complete</Text>
                        </Pressable>
                        <Pressable
                          style={[s.btn, s.btnCancel]}
                          onPress={() => act(appt.id, () => cancelAppointmentAsCounsellor(token!, appt.id))}
                        >
                          <Text style={[s.btnTxt, s.btnCancelTxt]}>Cancel</Text>
                        </Pressable>
                      </>
                    )}
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F0F6FF' },

  header: { paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.md },
  headerTitle: { fontFamily: fonts.display, fontSize: fontSizes.xl, color: '#FFFFFF' },
  headerSub: { fontFamily: fonts.bodyMedium, fontSize: fontSizes.xs, color: 'rgba(255,255,255,0.7)', marginTop: 2 },

  filterRow: { flexDirection: 'row', gap: 8, paddingBottom: spacing.sm },
  filterChip: {
    paddingHorizontal: 16, paddingVertical: 7,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  filterChipActive: { backgroundColor: '#FFFFFF' },
  filterTxt: { fontFamily: fonts.bodyBold, fontSize: fontSizes.xs, color: 'rgba(255,255,255,0.85)' },
  filterTxtActive: { color: '#1B4F72' },

  scroll: { flex: 1 },
  content: { padding: spacing.lg, gap: spacing.md },

  card: { backgroundColor: '#FFFFFF', borderRadius: 18, padding: spacing.md, ...shadow.sm, gap: spacing.sm },
  skeleton: { height: 110, opacity: 0.35 },

  cardTop: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  dateBadge: {
    backgroundColor: '#EBF5FB', borderRadius: 12,
    paddingHorizontal: 10, paddingVertical: 8, alignItems: 'center', minWidth: 76,
  },
  dateBadgeDate: { fontFamily: fonts.bodyBold, fontSize: fontSizes.xs, color: '#2980B9' },
  dateBadgeTime: { fontFamily: fonts.display, fontSize: fontSizes.md, color: '#1B4F72', marginTop: 2 },
  cardMeta: { flex: 1, gap: 4 },
  studentName: { fontFamily: fonts.bodyBold, fontSize: fontSizes.base, color: colors.ink },
  badgeRow: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  priorityBadge: {
    backgroundColor: colors.sunSoft, paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: radii.pill,
  },
  priorityBadgeTxt: { fontFamily: fonts.bodyBold, fontSize: 9, color: colors.sun },
  statusBadge: {
    alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: radii.pill,
  },
  statusTxt: { fontFamily: fonts.bodyBold, fontSize: 9, textTransform: 'uppercase' },
  notes: { fontFamily: fonts.bodyMedium, fontSize: fontSizes.xs, color: colors.inkSoft },

  actions: { flexDirection: 'row', gap: 8, marginTop: 4 },
  btn: { flex: 1, borderRadius: 10, paddingVertical: 9, alignItems: 'center' },
  btnTxt: { fontFamily: fonts.bodyBold, fontSize: fontSizes.xs },
  btnConfirm: { backgroundColor: '#E8F8EF' },
  btnConfirmTxt: { color: '#27AE60' },
  btnCancel: { backgroundColor: '#FDEDEC' },
  btnCancelTxt: { color: '#E74C3C' },
  btnComplete: { backgroundColor: '#EBF5FB' },
  btnCompleteTxt: { color: '#2980B9' },
  btnJoin: { backgroundColor: '#2D6A4F' },
  btnJoinTxt: { color: '#FFFFFF' },

  emptyBox: { alignItems: 'center', paddingVertical: 48, gap: 8 },
  emptyEmoji: { fontSize: 36 },
  emptyTitle: { fontFamily: fonts.bodyBold, fontSize: fontSizes.md, color: colors.ink },
  emptySub: { fontFamily: fonts.bodyMedium, fontSize: fontSizes.xs, color: colors.inkFaint },
});
