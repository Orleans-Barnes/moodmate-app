import React, { useCallback, useState } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MentorTabParamList, RootStackParamList } from '@/navigation/types';
import { useAuthStore } from '@/state/useAuthStore';
import { useToast } from '@/state/useToast';
import {
  acceptMentorRequest,
  declineMentorRequest,
  listMentorConversations,
  listMentorRequestsForMentor,
} from '@/api/support';
import { ApiRequestError } from '@/api/client';
import type { CounsellorConversationView, MentorRequestForMentorView } from '@/api/types';
import { hapticLight } from '@/utils/haptics';
import { colors, fonts, fontSizes, radii, spacing, shadow } from '@/theme/tokens';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MentorTabParamList, 'Dashboard'>,
  NativeStackScreenProps<RootStackParamList>
>;

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

/** Phase 1G - the mentor-side half of the Student -> Request -> Mentor accepts/declines workflow.
 * Deliberately trimmed relative to CounsellorDashboardScreen (no appointments/analytics/session
 * history/crisis alerts - none of those concepts apply to mentors, who only request-accept and
 * message, not book sessions). */
export function PeerMentorDashboardScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const token  = useAuthStore((s) => s.token);
  const user   = useAuthStore((s) => s.user);
  const toast  = useToast();

  const [requests, setRequests]   = useState<MentorRequestForMentorView[]>([]);
  const [convos, setConvos]       = useState<CounsellorConversationView[]>([]);
  const [loading, setLoading]     = useState(true);
  const [respondingId, setRespondingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const [reqs, msgs] = await Promise.all([
        listMentorRequestsForMentor(token),
        listMentorConversations(token),
      ]);
      setRequests(reqs);
      setConvos(msgs);
    } catch {
      toast('Could not load dashboard');
    } finally {
      setLoading(false);
    }
  }, [token, toast]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const pending = requests.filter((r) => r.status === 'PENDING');
  const unreadCount = convos.filter((c) => c.unreadCount > 0).length;
  const firstName = user?.fullName?.split(' ')[0] ?? 'Mentor';

  const handleAccept = async (requestId: number) => {
    if (!token) return;
    setRespondingId(requestId);
    hapticLight();
    try {
      await acceptMentorRequest(token, requestId);
      toast('Request accepted ✓');
      load();
    } catch (err) {
      toast(err instanceof ApiRequestError ? err.message : 'Could not accept that request.');
    } finally {
      setRespondingId(null);
    }
  };

  const handleDecline = async (requestId: number) => {
    if (!token) return;
    setRespondingId(requestId);
    hapticLight();
    try {
      await declineMentorRequest(token, requestId);
      toast('Request declined');
      load();
    } catch (err) {
      toast(err instanceof ApiRequestError ? err.message : 'Could not decline that request.');
    } finally {
      setRespondingId(null);
    }
  };

  return (
    <View style={s.root}>
      <LinearGradient
        colors={['#2D6A4F', '#40916C', '#74C69D']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[s.header, { paddingTop: insets.top + spacing.md }]}
      >
        <Text style={s.greeting}>Good {getTimeOfDay()} 🌱</Text>
        <Text style={s.name}>{firstName}</Text>

        <View style={s.statsRow}>
          <View style={s.statItem}>
            <Text style={s.statNum}>{pending.length}</Text>
            <Text style={s.statLbl}>Pending</Text>
          </View>
          <View style={s.statDivider} />
          <View style={s.statItem}>
            <Text style={s.statNum}>{convos.length}</Text>
            <Text style={s.statLbl}>Students</Text>
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
        <Text style={s.sectionTitle}>Pending requests</Text>

        {loading ? (
          [0, 1].map((i) => <View key={i} style={[s.reqCard, s.skeleton]} />)
        ) : pending.length === 0 ? (
          <View style={s.emptyBox}>
            <Text style={s.emptyEmoji}>📭</Text>
            <Text style={s.emptyTitle}>No pending requests</Text>
            <Text style={s.emptySub}>New student requests will appear here</Text>
          </View>
        ) : (
          pending.map((r) => (
            <View key={r.id} style={s.reqCard}>
              <View style={s.reqAvatar}>
                <Text style={s.reqAvatarTxt}>{r.studentName.charAt(0).toUpperCase()}</Text>
              </View>
              <View style={s.reqBody}>
                <Text style={s.reqName}>{r.studentName}</Text>
                {r.message ? (
                  <Text style={s.reqMessage} numberOfLines={2}>"{r.message}"</Text>
                ) : (
                  <Text style={s.reqMessage} numberOfLines={1}>Wants to connect</Text>
                )}
                <Text style={s.reqTime}>{formatTime(r.createdAt)}</Text>
                <View style={s.reqActions}>
                  <Pressable
                    style={s.declineBtn}
                    disabled={respondingId === r.id}
                    onPress={() => handleDecline(r.id)}
                  >
                    <Text style={s.declineTxt}>Decline</Text>
                  </Pressable>
                  <Pressable
                    style={s.acceptBtn}
                    disabled={respondingId === r.id}
                    onPress={() => handleAccept(r.id)}
                  >
                    <Text style={s.acceptTxt}>Accept</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          ))
        )}

        {convos.length > 0 && (
          <>
            <Text style={[s.sectionTitle, s.sectionTitleSpaced]}>Recent messages</Text>
            {convos.slice(0, 5).map((c) => (
              <Pressable
                key={c.id}
                style={s.msgCard}
                onPress={() => navigation.navigate('MentorChat', {
                  conversationId: c.id,
                  studentName: c.studentName,
                })}
              >
                <View style={s.msgAvatar}>
                  <Text style={s.msgAvatarTxt}>{c.studentName.charAt(0).toUpperCase()}</Text>
                </View>
                <View style={s.msgBody}>
                  <Text style={s.msgName}>{c.studentName}</Text>
                  <Text style={s.msgPreview} numberOfLines={1}>{c.lastMessagePreview ?? 'No messages yet'}</Text>
                </View>
                {c.unreadCount > 0 && (
                  <View style={s.msgBadge}><Text style={s.msgBadgeNum}>{c.unreadCount}</Text></View>
                )}
              </Pressable>
            ))}
          </>
        )}
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
  root: { flex: 1, backgroundColor: '#F0FAF4' },
  header: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },
  greeting: { fontFamily: fonts.bodyMedium, fontSize: fontSizes.xs, color: 'rgba(255,255,255,0.7)' },
  name: { fontFamily: fonts.display, fontSize: fontSizes.xl, color: '#FFFFFF', marginTop: 2, marginBottom: spacing.md },
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
  scroll: { flex: 1 },
  content: { padding: spacing.lg, gap: spacing.md },
  sectionTitle: { fontFamily: fonts.bodyBold, fontSize: fontSizes.md, color: colors.ink },
  sectionTitleSpaced: { marginTop: spacing.md },
  reqCard: {
    backgroundColor: '#FFFFFF', borderRadius: 16,
    padding: spacing.md, flexDirection: 'row', gap: spacing.md,
    ...shadow.sm,
  },
  skeleton: { height: 100, opacity: 0.4 },
  reqAvatar: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: '#40916C', alignItems: 'center', justifyContent: 'center',
  },
  reqAvatarTxt: { fontFamily: fonts.bodyBold, fontSize: fontSizes.md, color: '#FFFFFF' },
  reqBody: { flex: 1 },
  reqName: { fontFamily: fonts.bodyBold, fontSize: fontSizes.base, color: colors.ink },
  reqMessage: { fontFamily: fonts.bodyMedium, fontSize: fontSizes.xs, color: colors.inkSoft, marginTop: 2, fontStyle: 'italic' },
  reqTime: { fontFamily: fonts.bodyMedium, fontSize: 10, color: colors.inkFaint, marginTop: 4 },
  reqActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  declineBtn: { flex: 1, paddingVertical: 8, borderRadius: radii.sm, borderWidth: 1.5, borderColor: colors.line, alignItems: 'center' },
  declineTxt: { fontFamily: fonts.bodyBold, fontSize: fontSizes.xs, color: colors.inkSoft },
  acceptBtn: { flex: 1, paddingVertical: 8, borderRadius: radii.sm, backgroundColor: '#40916C', alignItems: 'center' },
  acceptTxt: { fontFamily: fonts.bodyBold, fontSize: fontSizes.xs, color: '#FFFFFF' },
  emptyBox: { alignItems: 'center', paddingVertical: spacing.xl, gap: 8 },
  emptyEmoji: { fontSize: 36 },
  emptyTitle: { fontFamily: fonts.bodyBold, fontSize: fontSizes.md, color: colors.ink },
  emptySub: { fontFamily: fonts.bodyMedium, fontSize: fontSizes.xs, color: colors.inkFaint, textAlign: 'center' },
  msgCard: {
    backgroundColor: '#FFFFFF', borderRadius: 16,
    padding: spacing.md, flexDirection: 'row',
    alignItems: 'center', gap: spacing.md, ...shadow.sm,
  },
  msgAvatar: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: '#40916C', alignItems: 'center', justifyContent: 'center',
  },
  msgAvatarTxt: { fontFamily: fonts.bodyBold, fontSize: fontSizes.md, color: '#FFFFFF' },
  msgBody: { flex: 1 },
  msgName: { fontFamily: fonts.bodyBold, fontSize: fontSizes.base, color: colors.ink },
  msgPreview: { fontFamily: fonts.bodyMedium, fontSize: fontSizes.xs, color: colors.inkSoft, marginTop: 2 },
  msgBadge: {
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: '#40916C', alignItems: 'center', justifyContent: 'center',
  },
  msgBadgeNum: { fontFamily: fonts.bodyBold, fontSize: 9, color: '#FFFFFF' },
});
