import React, { useCallback, useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, ScrollView, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainTabParamList, RootStackParamList } from '@/navigation/types';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Chip } from '@/components/Chip';
import { Skeleton } from '@/components/Skeleton';
import { useSupportStore } from '@/state/useSupportStore';
import { useAuthStore } from '@/state/useAuthStore';
import { useToast } from '@/state/useToast';
import { ApiRequestError } from '@/api/client';
import type { ConversationView, CounsellorView, MentorView } from '@/api/types';
import { colors, fonts, fontSizes, radii, spacing } from '@/theme/tokens';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Support'>,
  NativeStackScreenProps<RootStackParamList>
>;

type RosterItem =
  | { kind: 'counsellor'; data: CounsellorView }
  | { kind: 'mentor'; data: MentorView };

const TIME_SLOTS = ['09:00', '11:00', '13:00', '15:00', '17:00'];

function addDays(date: Date, amount: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function formatTimeLabel(slot: string): string {
  const [hh, mm] = slot.split(':').map(Number);
  const period = hh >= 12 ? 'PM' : 'AM';
  const hour12 = hh % 12 === 0 ? 12 : hh % 12;
  return `${hour12}:${mm.toString().padStart(2, '0')} ${period}`;
}

function formatApptWhen(iso: string): string {
  const d = new Date(iso);
  return `${d.toLocaleDateString('en-US', { weekday: 'short' })} · ${d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })}`;
}

function avatarFor(c: ConversationView, counsellors: CounsellorView[], mentors: MentorView[]): string {
  if (c.counsellorId) return counsellors.find((x) => x.id === c.counsellorId)?.avatarEmoji ?? '🧑‍⚕️';
  if (c.peerMentorId) return mentors.find((x) => x.id === c.peerMentorId)?.avatarEmoji ?? '🧑';
  return '💬';
}

function msgTimeAgo(iso: string | null): string {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7)  return `${d}d ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function SupportScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const cardWidth = Math.min(280, width * 0.72);
  const toast = useToast();
  const token = useAuthStore((s) => s.token);

  const counsellors = useSupportStore((s) => s.counsellors);
  const mentors = useSupportStore((s) => s.mentors);
  const appointments = useSupportStore((s) => s.appointments);
  const conversations = useSupportStore((s) => s.conversations);
  const loading = useSupportStore((s) => s.loading);
  const load = useSupportStore((s) => s.load);
  const book = useSupportStore((s) => s.book);
  const cancelAppt = useSupportStore((s) => s.cancel);
  const openConversation = useSupportStore((s) => s.openConversation);

  const [bookingId, setBookingId] = useState<number | null>(null);
  const [selectedDay, setSelectedDay] = useState(() => new Date());
  const [selectedTime, setSelectedTime] = useState(TIME_SLOTS[0]);
  const [booking, setBooking] = useState(false);

  const refresh = useCallback(() => {
    if (!token) return;
    load(token).catch((err) => toast(err instanceof ApiRequestError ? err.message : 'Could not load Support.'));
  }, [token, load, toast]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const handleMessage = async (target: { counsellorId?: number; peerMentorId?: number }, name: string) => {
    if (!token) return;
    try {
      const conv = await openConversation(token, target);
      navigation.navigate('Chat', { conversationId: conv.id, otherPartyName: name });
    } catch (err) {
      toast(err instanceof ApiRequestError ? err.message : 'Could not open that conversation.');
    }
  };

  const handleToggleBooking = (counsellorId: number) => {
    setBookingId((current) => (current === counsellorId ? null : counsellorId));
    setSelectedDay(new Date());
    setSelectedTime(TIME_SLOTS[0]);
  };

  const handleConfirmBooking = async (counsellorId: number) => {
    if (!token) return;
    const scheduledAt = new Date(selectedDay);
    const [hh, mm] = selectedTime.split(':').map(Number);
    scheduledAt.setHours(hh, mm, 0, 0);
    setBooking(true);
    try {
      await book(token, counsellorId, scheduledAt.toISOString());
      toast('Session booked ✓');
      setBookingId(null);
    } catch (err) {
      toast(err instanceof ApiRequestError ? err.message : 'Could not book that session.');
    } finally {
      setBooking(false);
    }
  };

  const handleCancel = async (appointmentId: number) => {
    if (!token) return;
    try {
      await cancelAppt(token, appointmentId);
      toast('Appointment cancelled');
    } catch (err) {
      toast(err instanceof ApiRequestError ? err.message : 'Could not cancel that appointment.');
    }
  };

  const upcoming = appointments
    .filter((a) => (a.status === 'PENDING' || a.status === 'CONFIRMED') && new Date(a.scheduledAt).getTime() > Date.now())
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())[0];

  const roster: RosterItem[] = [
    ...counsellors.map((c): RosterItem => ({ kind: 'counsellor', data: c })),
    ...mentors.map((m): RosterItem => ({ kind: 'mentor', data: m })),
  ];

  const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0);
  const showSkeleton = loading && roster.length === 0;
  const visibleDays = [0, 1, 2, 3, 4, 5, 6].map((offset) => addDays(new Date(), offset));

  return (
    <View style={styles.rootWrap}>
      <LinearGradient
        colors={['#5C3D8F', '#8E7BC0', '#B8A8D8']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.gradHeader, { paddingTop: insets.top + 12 }]}
      >
        <Text style={styles.gradHeading}>Support</Text>
        <Text style={styles.gradSub}>Counsellors · Mentors · Messages</Text>
      </LinearGradient>
      <Screen
        backgroundColor={colors.bg}
        contentContainerStyle={styles.content}
        edges={{ top: false, bottom: false }}
        refreshing={loading && roster.length > 0}
        onRefresh={refresh}
        refreshTintColor={colors.coral}
      >

      {upcoming && (
        <Card tint="coral">
          <Text style={styles.apptTop}>Upcoming appointment</Text>
          <View style={styles.apptRow}>
            <Text style={styles.apptName}>{upcoming.counsellorName}</Text>
            <Text style={styles.apptTime}>{formatApptWhen(upcoming.scheduledAt)}</Text>
          </View>
          <View style={styles.apptActions}>
            <Button label="Cancel" onPress={() => handleCancel(upcoming.id)} />
            <Button
              label="Message"
              variant="primary"
              onPress={() => handleMessage({ counsellorId: upcoming.counsellorId }, upcoming.counsellorName)}
            />
          </View>
        </Card>
      )}

      <View style={styles.sectionHead}>
        <Text style={styles.sectionTitle}>Counsellors & mentors</Text>
        <Text style={styles.sectionMeta}>swipe to see all</Text>
      </View>

      {showSkeleton ? (
        <View style={[styles.mentorCard, { width: cardWidth }]}>
          <Skeleton width={56} height={56} radius={28} style={styles.skeletonGap} />
          <Skeleton width="60%" height={14} style={styles.skeletonGap} />
          <Skeleton width="80%" height={11} />
        </View>
      ) : roster.length === 0 ? (
        <Card>
          <Text style={styles.emptyText}>No counsellors or mentors available right now.</Text>
        </Card>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          decelerationRate="fast"
          snapToInterval={cardWidth + spacing.md}
          contentContainerStyle={styles.carousel}
          style={styles.carouselOuter}
        >
          {roster.map((item) => {
            const isCounsellor = item.kind === 'counsellor';
            const { id, name, avatarEmoji, available } = item.data;
            const subtitle = isCounsellor
              ? (item.data as CounsellorView).title
              : (item.data as MentorView).focusArea;
            const specialties = isCounsellor ? (item.data as CounsellorView).specialties : [];
            const isBookingThis = bookingId === id;

            return (
              <View key={`${item.kind}-${id}`} style={[styles.mentorCard, { width: cardWidth }]}>
                <View style={styles.mentorCardTop}>
                  <View style={styles.mentorBigAvatar}>
                    <Text style={styles.mentorBigAvatarEmoji}>{avatarEmoji}</Text>
                  </View>
                  {available ? (
                    <View style={styles.onlineBadge}>
                      <View style={styles.onlineDot} />
                      <Text style={styles.onlineBadgeText}>Available</Text>
                    </View>
                  ) : (
                    <Text style={styles.offlineText}>Unavailable</Text>
                  )}
                </View>
                <Text style={styles.mentorBigName}>{name}</Text>
                <Text style={styles.mentorBigSpecialty}>{subtitle}</Text>
                {specialties.length > 0 && (
                  <View style={styles.specialtyRow}>
                    {specialties.map((s) => (
                      <Chip key={s} label={s} />
                    ))}
                  </View>
                )}

                <View style={styles.cardActions}>
                  {isCounsellor && (
                    <Button
                      label={isBookingThis ? 'Cancel' : 'Book'}
                      onPress={() => handleToggleBooking(id)}
                      disabled={!available && !isBookingThis}
                      style={styles.cardActionBtn}
                    />
                  )}
                  <Button
                    label="Message"
                    variant="primary"
                    onPress={() =>
                      handleMessage(
                        isCounsellor ? { counsellorId: id } : { peerMentorId: id },
                        name
                      )
                    }
                    style={styles.cardActionBtn}
                  />
                </View>

                {isBookingThis && (
                  <View style={styles.bookingPanel}>
                    <Text style={styles.bookingLabel}>Pick a day</Text>
                    <View style={styles.dayRow}>
                      {visibleDays.map((day) => {
                        const active = isSameDay(day, selectedDay);
                        return (
                          <Pressable
                            key={day.toISOString()}
                            style={[styles.dayChip, active && styles.dayChipActive]}
                            onPress={() => setSelectedDay(day)}
                          >
                            <Text style={[styles.dayChipWeekday, active && styles.dayChipTextActive]}>
                              {day.toLocaleDateString('en-US', { weekday: 'short' })}
                            </Text>
                            <Text style={[styles.dayChipNum, active && styles.dayChipTextActive]}>
                              {day.getDate()}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                    <Text style={styles.bookingLabel}>Pick a time</Text>
                    <View style={styles.timeRow}>
                      {TIME_SLOTS.map((slot) => {
                        const active = slot === selectedTime;
                        return (
                          <Pressable
                            key={slot}
                            style={[styles.timeChip, active && styles.timeChipActive]}
                            onPress={() => setSelectedTime(slot)}
                          >
                            <Text style={[styles.timeChipText, active && styles.timeChipTextActive]}>
                              {formatTimeLabel(slot)}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                    <Button
                      label={booking ? 'Booking…' : 'Confirm booking'}
                      variant="primary"
                      fullWidth
                      disabled={booking}
                      onPress={() => handleConfirmBooking(id)}
                      style={styles.confirmBtn}
                    />
                  </View>
                )}
              </View>
            );
          })}
        </ScrollView>
      )}

      <View style={styles.sectionHead}>
        <Text style={styles.sectionTitle}>Messages</Text>
        <Text style={styles.sectionMeta}>{totalUnread > 0 ? `${totalUnread} unread` : 'All caught up'}</Text>
      </View>
      {conversations.length === 0 ? (
        <View style={styles.msgEmpty}>
          <Text style={styles.msgEmptyEmoji}>💬</Text>
          <Text style={styles.msgEmptyTitle}>No messages yet</Text>
          <Text style={styles.msgEmptySub}>Tap "Message" on a counsellor card to start a conversation</Text>
        </View>
      ) : (
        conversations.map((c) => {
          const otherName = c.counsellorName ?? c.peerMentorName ?? 'Conversation';
          const hasUnread = c.unreadCount > 0;
          const emoji = avatarFor(c, counsellors, mentors);
          const timeLabel = msgTimeAgo(c.lastMessageAt ?? c.createdAt);
          return (
            <Pressable
              key={c.id}
              style={({ pressed }) => [styles.msgCard, pressed && styles.msgCardPressed]}
              onPress={() => navigation.navigate('Chat', { conversationId: c.id, otherPartyName: otherName })}
              accessibilityRole="button"
              accessibilityLabel={`Open conversation with ${otherName}`}
            >
              <View style={[styles.msgAvatarCircle, hasUnread && styles.msgAvatarCircleUnread]}>
                <Text style={styles.msgAvatarEmoji}>{emoji}</Text>
              </View>
              <View style={styles.msgBody}>
                <View style={styles.msgTopRow}>
                  <Text style={[styles.msgName, hasUnread && styles.msgNameBold]} numberOfLines={1}>{otherName}</Text>
                  <Text style={styles.msgTime}>{timeLabel}</Text>
                </View>
                <Text style={[styles.msgPreview, hasUnread && styles.msgPreviewBold]} numberOfLines={1}>
                  {c.lastMessagePreview ?? 'Tap to say hello…'}
                </Text>
              </View>
              {hasUnread && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadBadgeTxt}>{c.unreadCount > 9 ? '9+' : c.unreadCount}</Text>
                </View>
              )}
            </Pressable>
          );
        })
      )}
      </Screen>
    </View>
  );
}

const styles = StyleSheet.create({
  rootWrap: { flex: 1 },
  gradHeader: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 20,
  },
  gradHeading: {
    fontFamily: fonts.display,
    fontSize: fontSizes.xl,
    color: '#FFFFFF',
  },
  gradSub: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.xs,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 3,
  },
  flex: { flex: 1 },
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxxl * 2 },
  apptTop: { fontFamily: fonts.bodyBold, fontSize: fontSizes.xs, color: colors.inkSoft, marginBottom: 5 },
  apptRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm + 2 },
  apptName: { fontFamily: fonts.bodyBold, fontSize: fontSizes.base, color: colors.ink },
  apptTime: { fontFamily: fonts.bodyMedium, fontSize: fontSizes.sm, color: colors.inkSoft },
  apptActions: { flexDirection: 'row', gap: spacing.xs + 2 },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: spacing.sm, marginTop: spacing.md },
  sectionTitle: { fontFamily: fonts.bodyBold, fontSize: fontSizes.base + 2, color: colors.ink },
  sectionMeta: { fontFamily: fonts.bodyMedium, fontSize: fontSizes.xs, color: colors.inkFaint },
  carouselOuter: { marginHorizontal: -spacing.lg, marginBottom: spacing.xs },
  carousel: { paddingHorizontal: spacing.lg, gap: spacing.md },
  emptyText: { fontFamily: fonts.bodyMedium, fontSize: fontSizes.sm, color: colors.inkFaint, textAlign: 'center' },
  skeletonGap: { marginBottom: 8 },
  mentorCard: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.line,
    borderRadius: radii.lg,
    padding: spacing.lg,
  },
  mentorCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm + 2 },
  mentorBigAvatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.sageSoft, alignItems: 'center', justifyContent: 'center' },
  mentorBigAvatarEmoji: { fontSize: 26 },
  onlineBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.sageSoft, paddingHorizontal: 8, paddingVertical: 4, borderRadius: radii.pill },
  onlineBadgeText: { fontFamily: fonts.bodyBold, fontSize: 10, color: colors.sage },
  offlineText: { fontFamily: fonts.bodyMedium, fontSize: 10, color: colors.inkFaint },
  onlineDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#4CAF7D' },
  mentorBigName: { fontFamily: fonts.bodyBold, fontSize: fontSizes.lg, color: colors.ink, marginBottom: 3 },
  mentorBigSpecialty: { fontFamily: fonts.bodyMedium, fontSize: fontSizes.xs, color: colors.inkSoft, marginBottom: spacing.sm },
  specialtyRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing.sm },
  cardActions: { flexDirection: 'row', gap: spacing.xs + 2 },
  cardActionBtn: { flex: 1, paddingVertical: 10 },
  bookingPanel: { marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.line },
  bookingLabel: { fontFamily: fonts.bodyBold, fontSize: fontSizes.xs, color: colors.inkSoft, marginBottom: spacing.xs },
  dayRow: { flexDirection: 'row', gap: 5, marginBottom: spacing.sm },
  dayChip: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: colors.bg,
    borderWidth: 1.5,
    borderColor: colors.line,
    alignItems: 'center',
  },
  dayChipActive: { backgroundColor: colors.coral, borderColor: colors.coral },
  dayChipWeekday: { fontFamily: fonts.bodyMedium, fontSize: 9, color: colors.inkFaint },
  dayChipNum: { fontFamily: fonts.bodyBold, fontSize: fontSizes.sm, color: colors.inkSoft },
  dayChipTextActive: { color: '#FFFFFF' },
  timeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: spacing.md },
  timeChip: {
    paddingVertical: 7,
    paddingHorizontal: 11,
    borderRadius: radii.pill,
    backgroundColor: colors.bg,
    borderWidth: 1.5,
    borderColor: colors.line,
  },
  timeChipActive: { backgroundColor: colors.coral, borderColor: colors.coral },
  timeChipText: { fontFamily: fonts.bodyBold, fontSize: fontSizes.xs, color: colors.inkSoft },
  timeChipTextActive: { color: '#FFFFFF' },
  confirmBtn: { marginTop: spacing.xs },
  // ── Message conversation cards ────────────────────────────────────────────
  msgCard: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm + 2,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1.5,
    borderColor: colors.line,
    paddingHorizontal: spacing.md,
    paddingVertical: 13,
    marginBottom: spacing.sm,
  },
  msgCardPressed: { opacity: 0.78 },
  msgAvatarCircle: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: colors.sageSoft,
    alignItems: 'center', justifyContent: 'center',
  },
  msgAvatarCircleUnread: { backgroundColor: '#EDE7F6' },
  msgAvatarEmoji: { fontSize: 20 },
  msgBody: { flex: 1, gap: 3 },
  msgTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  msgName: { fontFamily: fonts.bodyMedium, fontSize: fontSizes.sm, color: colors.ink, flex: 1 },
  msgNameBold: { fontFamily: fonts.bodyBold },
  msgTime: { fontFamily: fonts.bodyMedium, fontSize: 10, color: colors.inkFaint, marginLeft: 6 },
  msgPreview: { fontFamily: fonts.bodyMedium, fontSize: fontSizes.xs, color: colors.inkFaint },
  msgPreviewBold: { fontFamily: fonts.bodyMedium, color: colors.inkSoft },
  unreadBadge: {
    minWidth: 22, height: 22, borderRadius: 11,
    backgroundColor: colors.coral,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 5,
  },
  unreadBadgeTxt: { fontFamily: fonts.bodyBold, fontSize: 10, color: '#FFFFFF' },
  msgEmpty: { alignItems: 'center', paddingVertical: 32, gap: 6 },
  msgEmptyEmoji: { fontSize: 36 },
  msgEmptyTitle: { fontFamily: fonts.bodyBold, fontSize: fontSizes.base, color: colors.ink },
  msgEmptySub: { fontFamily: fonts.bodyMedium, fontSize: fontSizes.xs, color: colors.inkFaint, textAlign: 'center' },
});
