import React, { useCallback, useState } from 'react';
import {
  View, Text, Pressable, StyleSheet, ScrollView, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
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
  PENDING:   { label: 'Pending',   bg: colors.warningSoft, color: colors.warning },
  CONFIRMED: { label: 'Confirmed', bg: colors.successSoft, color: colors.success },
  CANCELLED: { label: 'Cancelled', bg: colors.errorSoft,   color: colors.error },
  COMPLETED: { label: 'Completed', bg: colors.coralSoft,    color: colors.coralDeep },
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
        colors={['#24412A', '#579E65']}
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
            <Ionicons name="mail-open-outline" size={40} color={colors.inkFaint} />
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
                        <View style={[s.priorityBadge, s.priorityBadgeRow]}>
                          <Ionicons name="flash" size={10} color={colors.premiumGold} />
                          <Text style={s.priorityBadgeTxt}>Priority</Text>
                        </View>
                      )}
                      <View style={[s.statusBadge, { backgroundColor: st.bg }]}>
                        <Text style={[s.statusTxt, { color: st.color }]}>{st.label}</Text>
                      </View>
                    </View>
                  </View>
                </View>

                {appt.notes ? (
                  <View style={s.notesRow}>
                    <Ionicons name="document-text-outline" size={12} color={colors.inkSoft} />
                    <Text style={s.notes} numberOfLines={2}>{appt.notes}</Text>
                  </View>
                ) : null}

                {/* Action buttons */}
                {isActing ? (
                  <ActivityIndicator color={colors.coralDeep} style={{ marginTop: spacing.sm }} />
                ) : (
                  <View style={s.actions}>
                    {appt.status === 'PENDING' && (
                      <>
                        <Pressable
                          style={[s.btn, s.btnConfirm]}
                          onPress={() => act(appt.id, () => confirmAppointment(token!, appt.id))}
                        >
                          <Text style={[s.btnTxt, s.btnConfirmTxt]}>Confirm</Text>
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
                          <Ionicons name="videocam" size={13} color="#FFFFFF" />
                          <Text style={[s.btnTxt, s.btnJoinTxt]}>Join Session</Text>
                        </Pressable>
                        <Pressable
                          style={[s.btn, s.btnComplete]}
                          onPress={() => act(appt.id, () => completeAppointment(token!, appt.id))}
                        >
                          <Text style={[s.btnTxt, s.btnCompleteTxt]}>Mark Complete</Text>
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
  root: { flex: 1, backgroundColor: '#E9F2EC' },

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
  filterChipActive: { backgroundColor: colors.surface },
  filterTxt: { fontFamily: fonts.bodyBold, fontSize: fontSizes.xs, color: 'rgba(255,255,255,0.85)' },
  filterTxtActive: { color: colors.coralDeep },

  scroll: { flex: 1 },
  content: { padding: spacing.lg, gap: spacing.md },

  card: { backgroundColor: colors.surface, borderRadius: 18, padding: spacing.md, ...shadow.sm, gap: spacing.sm },
  skeleton: { height: 110, opacity: 0.35 },

  cardTop: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  dateBadge: {
    backgroundColor: '#E9F2EC', borderRadius: 12,
    paddingHorizontal: 10, paddingVertical: 8, alignItems: 'center', minWidth: 76,
  },
  dateBadgeDate: { fontFamily: fonts.bodyBold, fontSize: fontSizes.xs, color: colors.coralDeep },
  dateBadgeTime: { fontFamily: fonts.display, fontSize: fontSizes.md, color: colors.coralDeep, marginTop: 2 },
  cardMeta: { flex: 1, gap: 4 },
  studentName: { fontFamily: fonts.bodyBold, fontSize: fontSizes.base, color: colors.ink },
  badgeRow: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  priorityBadge: {
    backgroundColor: colors.premiumGoldSoft, paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: radii.pill,
  },
  priorityBadgeRow: { flexDirection: 'row', gap: 3, alignItems: 'center' },
  priorityBadgeTxt: { fontFamily: fonts.bodyBold, fontSize: 9, color: colors.premiumGold },
  statusBadge: {
    alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: radii.pill,
  },
  statusTxt: { fontFamily: fonts.bodyBold, fontSize: 9, textTransform: 'uppercase' },
  notesRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 5 },
  notes: { flex: 1, fontFamily: fonts.bodyMedium, fontSize: fontSizes.xs, color: colors.inkSoft },

  actions: { flexDirection: 'row', gap: 8, marginTop: 4 },
  btn: { flex: 1, borderRadius: 10, paddingVertical: 9, alignItems: 'center' },
  btnTxt: { fontFamily: fonts.bodyBold, fontSize: fontSizes.xs },
  btnConfirm: { backgroundColor: colors.successSoft },
  btnConfirmTxt: { color: colors.success },
  btnCancel: { backgroundColor: colors.errorSoft },
  btnCancelTxt: { color: colors.error },
  btnComplete: { backgroundColor: '#E9F2EC' },
  btnCompleteTxt: { color: colors.coralDeep },
  btnJoin: { flexDirection: 'row', gap: 5, justifyContent: 'center', backgroundColor: '#24412A' },
  btnJoinTxt: { color: '#FFFFFF' },

  emptyBox: { alignItems: 'center', paddingVertical: 48, gap: 8 },
  emptyTitle: { fontFamily: fonts.bodyBold, fontSize: fontSizes.md, color: colors.ink },
  emptySub: { fontFamily: fonts.bodyMedium, fontSize: fontSizes.xs, color: colors.inkFaint },
});
