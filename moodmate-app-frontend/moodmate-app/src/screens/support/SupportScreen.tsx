/**
 * SupportScreen — Calm Forest care desk
 *
 * THESIS: People and presence first (who can help, who's online, what's next),
 * not a grid of identical feature cards.
 * OWN-WORLD: Calm Forest — forest hero, mint surfaces, sage/primary CTAs,
 * Plus Jakarta, living LiquidBackground.
 * STORY: Find help → book or request → keep the thread in Messages.
 * FIRST VIEWPORT: Forest hero with live counts, then upcoming session (or quiet
 * empty), then searchable roster, then inbox.
 * FORM: Home-matched Operate craft — HeroHeader + LiquidBackground + staggered
 * FadeInItem + PressScale. Behavior unchanged.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Animated, Text, ScrollView, Pressable, StyleSheet, View, TextInput, useWindowDimensions,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainTabParamList, RootStackParamList } from '@/navigation/types';
import { Screen } from '@/components/Screen';
import { Button } from '@/components/Button';
import { Chip } from '@/components/Chip';
import { Skeleton } from '@/components/Skeleton';
import { HeroHeader } from '@/components/HeroHeader';
import { LiquidBackground } from '@/components/LiquidBackground';
import { FadeInItem } from '@/components/FadeInItem';
import { PressScale } from '@/components/PressScale';
import { useSupportStore } from '@/state/useSupportStore';
import { useAuthStore } from '@/state/useAuthStore';
import { useToast } from '@/state/useToast';
import { GuestGate } from '@/components/GuestGate';
import { ApiRequestError } from '@/api/client';
import { listBookedSlots } from '@/api/support';
import type { BookedSlotView, ConversationView, CounsellorAvailabilityStatus, CounsellorView, MentorRequestView, MentorView } from '@/api/types';
import { AppIcon } from '@/components/AppIcon';
import { DEFAULT_AVATAR_ICON, resolveIcon } from '@/theme/iconMap';
import { colors, calm, darkPalette, fonts, fontSizes, radii, spacing, shadow } from '@/theme/tokens';
import { useKeyboardOffset } from '@/hooks/useKeyboardOffset';
import { useHideTabBarOnScroll } from '@/hooks/useHideTabBarOnScroll';
import { useResolvedAppearance } from '@/hooks/useResolvedAppearance';
import {
  TIME_SLOTS,
  addDays,
  disabledSlotsForDay,
  endOfDay,
  formatTimeLabel,
  isSameDay,
  isSlotUnavailable,
  startOfDay,
} from './supportScheduling';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Support'>,
  NativeStackScreenProps<RootStackParamList>
>;

type RosterItem =
  | { kind: 'counsellor'; data: CounsellorView }
  | { kind: 'mentor'; data: MentorView };

const FOREST_GRAD = [calm.forest, calm.forest] as const;

function animateLayout() {
}

function formatApptWhen(iso: string): string {
  const d = new Date(iso);
  return `${d.toLocaleDateString('en-US', { weekday: 'short' })} · ${d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })}`;
}

const AVAILABILITY_META: Record<CounsellorAvailabilityStatus, { label: string; dot: string; bg: string; text: string }> = {
  ONLINE: { label: 'Online', dot: colors.sage,   bg: colors.sageSoft,    text: colors.sageDeep },
  BUSY:   { label: 'Busy',   dot: colors.warning, bg: colors.warningSoft, text: colors.sunText },
  AWAY:   { label: 'Away',   dot: colors.inkFaint, bg: calm.trackAlt,     text: colors.inkSoft },
};

function latestMentorRequestFor(peerMentorId: number, requests: MentorRequestView[]): MentorRequestView | undefined {
  return requests.find((r) => r.peerMentorId === peerMentorId);
}

function avatarFor(c: ConversationView, counsellors: CounsellorView[], mentors: MentorView[]): string {
  if (c.counsellorId) return counsellors.find((x) => x.id === c.counsellorId)?.avatarEmoji ?? 'medkit-outline';
  if (c.peerMentorId) return mentors.find((x) => x.id === c.peerMentorId)?.avatarEmoji ?? DEFAULT_AVATAR_ICON;
  return 'chatbubbles-outline';
}

function msgTimeAgo(iso: string | null): string {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7)  return `${d}d`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function DayPicker({
  days, selected, onSelect,
}: { days: Date[]; selected: Date; onSelect: (d: Date) => void }) {
  const { isDark } = useResolvedAppearance();
  return (
    <View style={styles.dayRow}>
      {days.map((day) => {
        const active = isSameDay(day, selected);
        return (
          <Pressable
            key={day.toISOString()}
            style={[styles.dayChip, isDark && styles.dayChipDark, active && styles.dayChipActive]}
            onPress={() => onSelect(day)}
          >
            <Text style={[styles.dayChipWeekday, isDark && styles.mutedTextDark, active && styles.dayChipTextActive]}>
              {day.toLocaleDateString('en-US', { weekday: 'short' })}
            </Text>
            <Text style={[styles.dayChipNum, isDark && styles.mutedTextDark, active && styles.dayChipTextActive]}>
              {day.getDate()}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function TimePicker({
  selected, onSelect, disabledSlots, loading,
}: { selected: string; onSelect: (s: string) => void; disabledSlots?: Set<string>; loading?: boolean }) {
  const { isDark } = useResolvedAppearance();
  return (
    <View style={styles.timeRow}>
      {TIME_SLOTS.map((slot) => {
        const active = slot === selected;
        const disabled = loading || (disabledSlots?.has(slot) ?? false);
        return (
          <Pressable
            key={slot}
            style={[styles.timeChip, isDark && styles.timeChipDark, active && styles.timeChipActive, disabled && styles.timeChipDisabled]}
            disabled={disabled}
            onPress={() => onSelect(slot)}
          >
            <Text style={[styles.timeChipText, isDark && styles.mutedTextDark, active && styles.timeChipTextActive, disabled && styles.timeChipTextDisabled]}>
              {formatTimeLabel(slot)}
            </Text>
            {disabled && !loading && <Text style={[styles.timeChipSub, isDark && styles.mutedTextDark]}>Closed</Text>}
          </Pressable>
        );
      })}
    </View>
  );
}

export function SupportScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { isDark } = useResolvedAppearance();
  const scrollY = useRef(new Animated.Value(0)).current;
  const handleTabAwareScroll = useHideTabBarOnScroll();
  const keyboardHeight = useKeyboardOffset();
  const { width } = useWindowDimensions();
  const cardWidth = Math.min(300, width * 0.78);
  const toast = useToast();
  const token = useAuthStore((s) => s.token);
  const isGuest = useAuthStore((s) => s.user?.guest ?? false);

  const counsellors = useSupportStore((s) => s.counsellors);
  const mentors = useSupportStore((s) => s.mentors);
  const appointments = useSupportStore((s) => s.appointments);
  const conversations = useSupportStore((s) => s.conversations);
  const myMentorRequests = useSupportStore((s) => s.myMentorRequests);
  const loading = useSupportStore((s) => s.loading);
  const load = useSupportStore((s) => s.load);
  const book = useSupportStore((s) => s.book);
  const cancelAppt = useSupportStore((s) => s.cancel);
  const rescheduleAppt = useSupportStore((s) => s.reschedule);
  const rateAppt = useSupportStore((s) => s.rateAppointment);
  const requestMentorAction = useSupportStore((s) => s.requestMentor);
  const openConversation = useSupportStore((s) => s.openConversation);
  const [requestingMentorId, setRequestingMentorId] = useState<number | null>(null);

  const [bookingId, setBookingId] = useState<number | null>(null);
  const [selectedDay, setSelectedDay] = useState(() => new Date());
  const [selectedTime, setSelectedTime] = useState(TIME_SLOTS[0]);
  const [booking, setBooking] = useState(false);
  const [bookedSlotsByCounsellor, setBookedSlotsByCounsellor] = useState<Record<number, BookedSlotView[]>>({});
  const [slotsLoadingFor, setSlotsLoadingFor] = useState<number | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [kindFilter, setKindFilter] = useState<'all' | 'counsellor' | 'mentor'>('all');

  const [rescheduling, setRescheduling] = useState(false);
  const [rescheduleDay, setRescheduleDay] = useState(() => new Date());
  const [rescheduleTime, setRescheduleTime] = useState(TIME_SLOTS[0]);
  const [reschedulingBusy, setReschedulingBusy] = useState(false);

  const [ratingAppointmentId, setRatingAppointmentId] = useState<number | null>(null);
  const [ratingStars, setRatingStars] = useState(5);
  const [ratingComment, setRatingComment] = useState('');
  const [ratingSubmitting, setRatingSubmitting] = useState(false);

  const refresh = useCallback(() => {
    if (!token || isGuest) return;
    load(token).catch((err) => toast(err instanceof ApiRequestError ? err.message : 'Could not load Support.'));
  }, [token, isGuest, load, toast]);

  const fetchBookedSlots = useCallback(async (counsellorId: number) => {
    if (!token) return;
    const from = startOfDay(new Date()).toISOString();
    const to = endOfDay(addDays(new Date(), 6)).toISOString();
    setSlotsLoadingFor(counsellorId);
    try {
      const slots = await listBookedSlots(token, counsellorId, from, to);
      setBookedSlotsByCounsellor((current) => ({ ...current, [counsellorId]: slots }));
    } catch (err) {
      toast(err instanceof ApiRequestError ? err.message : 'Could not load available times.');
    } finally {
      setSlotsLoadingFor((current) => (current === counsellorId ? null : current));
    }
  }, [token, toast]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const handleMessage = async (target: { counsellorId?: number; peerMentorId?: number }, name: string) => {
    if (!token) return;
    try {
      const conv = await openConversation(token, target);
      const role = target.counsellorId ? 'COUNSELLOR' : 'MENTOR';
      navigation.navigate('Chat', {
        conversationId: conv.id,
        otherPartyName: name,
        otherPartyRole: role,
        otherPartyId: target.counsellorId ?? target.peerMentorId,
      });
    } catch (err) {
      toast(err instanceof ApiRequestError ? err.message : 'Could not open that conversation.');
    }
  };

  const handleRequestMentor = async (peerMentorId: number) => {
    if (!token) return;
    setRequestingMentorId(peerMentorId);
    try {
      await requestMentorAction(token, peerMentorId);
      toast('Request sent ✓');
    } catch (err) {
      toast(err instanceof ApiRequestError ? err.message : 'Could not send that request.');
    } finally {
      setRequestingMentorId(null);
    }
  };

  const handleToggleBooking = (counsellorId: number) => {
    animateLayout();
    setBookingId((current) => {
      const next = current === counsellorId ? null : counsellorId;
      if (next !== null) void fetchBookedSlots(next);
      return next;
    });
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

  const handleToggleReschedule = () => {
    animateLayout();
    setRescheduling((v) => {
      const next = !v;
      if (next && upcoming) void fetchBookedSlots(upcoming.counsellorId);
      return next;
    });
    setRescheduleDay(new Date());
    setRescheduleTime(TIME_SLOTS[0]);
  };

  const handleConfirmReschedule = async (appointmentId: number) => {
    if (!token) return;
    const scheduledAt = new Date(rescheduleDay);
    const [hh, mm] = rescheduleTime.split(':').map(Number);
    scheduledAt.setHours(hh, mm, 0, 0);
    setReschedulingBusy(true);
    try {
      await rescheduleAppt(token, appointmentId, scheduledAt.toISOString());
      toast('Appointment rescheduled ✓');
      setRescheduling(false);
    } catch (err) {
      toast(err instanceof ApiRequestError ? err.message : 'Could not reschedule that appointment.');
    } finally {
      setReschedulingBusy(false);
    }
  };

  const upcoming = appointments
    .filter((a) => (a.status === 'PENDING' || a.status === 'CONFIRMED') && new Date(a.scheduledAt).getTime() > Date.now())
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())[0];

  const unratedCompleted = appointments
    .filter((a) => a.status === 'COMPLETED' && !a.rated)
    .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime());

  const handleToggleRating = (appointmentId: number) => {
    animateLayout();
    setRatingAppointmentId((current) => (current === appointmentId ? null : appointmentId));
    setRatingStars(5);
    setRatingComment('');
  };

  const handleSubmitRating = async (appointmentId: number) => {
    if (!token) return;
    setRatingSubmitting(true);
    try {
      await rateAppt(token, appointmentId, ratingStars, ratingComment.trim() || undefined);
      toast('Thanks for rating your session ✓');
      setRatingAppointmentId(null);
    } catch (err) {
      toast(err instanceof ApiRequestError ? err.message : 'Could not submit that rating.');
    } finally {
      setRatingSubmitting(false);
    }
  };

  const fullRoster: RosterItem[] = [
    ...counsellors.map((c): RosterItem => ({ kind: 'counsellor', data: c })),
    ...mentors.map((m): RosterItem => ({ kind: 'mentor', data: m })),
  ];

  const query = searchQuery.trim().toLowerCase();
  const roster = fullRoster.filter((item) => {
    if (kindFilter !== 'all' && item.kind !== kindFilter) return false;
    if (!query) return true;
    const { name } = item.data;
    const subtitle = item.kind === 'counsellor' ? item.data.title : item.data.focusArea;
    const specialties = item.kind === 'counsellor' ? item.data.specialties : [];
    const haystack = [name, subtitle, ...specialties].join(' ').toLowerCase();
    return haystack.includes(query);
  });

  const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0);
  const onlineCount =
    counsellors.filter((c) => c.availabilityStatus === 'ONLINE').length +
    mentors.filter((m) => m.available).length;
  const showSkeleton = loading && roster.length === 0;
  const visibleDays = [0, 1, 2, 3, 4, 5, 6].map((offset) => addDays(new Date(), offset));
  const inlineFormActive = bookingId != null || rescheduling || ratingAppointmentId != null;

  useEffect(() => {
    if (bookingId == null) return;
    const slots = bookedSlotsByCounsellor[bookingId] ?? [];
    if (!isSlotUnavailable(selectedDay, selectedTime, slots)) return;
    const nextOpen = TIME_SLOTS.find((slot) => !isSlotUnavailable(selectedDay, slot, slots));
    if (nextOpen) setSelectedTime(nextOpen);
  }, [bookedSlotsByCounsellor, bookingId, selectedDay, selectedTime]);

  useEffect(() => {
    if (!rescheduling || !upcoming) return;
    const slots = bookedSlotsByCounsellor[upcoming.counsellorId] ?? [];
    if (!isSlotUnavailable(rescheduleDay, rescheduleTime, slots)) return;
    const nextOpen = TIME_SLOTS.find((slot) => !isSlotUnavailable(rescheduleDay, slot, slots));
    if (nextOpen) setRescheduleTime(nextOpen);
  }, [bookedSlotsByCounsellor, rescheduleDay, rescheduleTime, rescheduling, upcoming]);

  let animIndex = 0;

  return (
    <View style={[styles.rootWrap, isDark && styles.rootWrapDark]}>
      <HeroHeader
        gradient={FOREST_GRAD}
        title="Support"
        subtitle="Someone in your corner"
        scrollY={scrollY}
        stats={[
          {
            key: 'online',
            icon: <Ionicons name="radio-button-on" size={12} color={calm.mint} />,
            value: onlineCount,
            label: 'online',
          },
          {
            key: 'unread',
            icon: <Ionicons name="chatbubble-ellipses" size={12} color={calm.mint} />,
            value: totalUnread,
            label: 'unread',
          },
          {
            key: 'people',
            icon: <Ionicons name="people" size={12} color={calm.mint} />,
            value: fullRoster.length,
            label: 'helpers',
          },
        ]}
      />

      {isGuest ? (
        <View style={styles.body}>
          <LiquidBackground preset="wellness" opacityScale={0.55} />
          <Screen
            backgroundColor="transparent"
            edges={{ top: false, bottom: false }}
            scrollEventThrottle={16}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { y: scrollY } } }],
              { useNativeDriver: true, listener: handleTabAwareScroll },
            )}
          >
            <GuestGate
              icon="people-outline"
              title="Connect with real support"
              message="Booking a counsellor or messaging a peer mentor needs a free account so they know who they're talking to."
              onCreateAccount={() => navigation.navigate('Signup')}
            />
          </Screen>
        </View>
      ) : (
        <View style={styles.body}>
          <LiquidBackground preset="wellness" opacityScale={0.55} />
          <Screen
            backgroundColor="transparent"
            contentContainerStyle={styles.content}
            edges={{ top: false, bottom: false }}
            extraBottomGap={insets.bottom + spacing.giant + (inlineFormActive ? keyboardHeight + spacing.xxxl : 0)}
            refreshing={loading && roster.length > 0}
            onRefresh={refresh}
            refreshTintColor={calm.primary}
            scrollEventThrottle={16}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { y: scrollY } } }],
              { useNativeDriver: true, listener: handleTabAwareScroll },
            )}
          >
            {upcoming && (
              <FadeInItem index={animIndex++}>
                <View style={[styles.nextSession, isDark && styles.surfaceDark]}>
                  <View style={[styles.nextSessionGlow, isDark && styles.nextSessionGlowDark]} />
                  <View style={styles.nextSessionTop}>
                    <View style={[styles.nextSessionTag, isDark && styles.greenPillDark]}>
                      <Ionicons name="calendar" size={12} color={isDark ? darkPalette.primary : calm.primary} />
                      <Text style={[styles.nextSessionTagTxt, isDark && styles.accentTextDark]}>Next session</Text>
                    </View>
                    {upcoming.priority && (
                      <View style={styles.priorityBadge}>
                        <Ionicons name="flash" size={11} color={calm.amber} />
                        <Text style={styles.priorityBadgeTxt}>Priority</Text>
                      </View>
                    )}
                  </View>
                  <Text style={[styles.nextName, isDark && styles.textDark]}>{upcoming.counsellorName}</Text>
                  <Text style={[styles.nextWhen, isDark && styles.mutedTextDark]}>{formatApptWhen(upcoming.scheduledAt)}</Text>
                  <View style={styles.apptActions}>
                    <Button label="Cancel" onPress={() => handleCancel(upcoming.id)} />
                    <Button label={rescheduling ? 'Never mind' : 'Reschedule'} onPress={handleToggleReschedule} />
                    <Button
                      label="Message"
                      onPress={() => handleMessage({ counsellorId: upcoming.counsellorId }, upcoming.counsellorName)}
                    />
                    {upcoming.status === 'CONFIRMED' && (
                      <Button
                        label="Join"
                        variant="primary"
                        onPress={() => navigation.navigate('VideoSession', {
                          appointmentId: upcoming.id,
                          otherPartyName: upcoming.counsellorName,
                        })}
                      />
                    )}
                  </View>

                  {rescheduling && (
                    <View style={[styles.bookingPanel, isDark && styles.bookingPanelDark]}>
                      <Text style={[styles.bookingLabel, isDark && styles.mutedTextDark]}>New day</Text>
                      <DayPicker days={visibleDays} selected={rescheduleDay} onSelect={setRescheduleDay} />
                      <Text style={[styles.bookingLabel, isDark && styles.mutedTextDark]}>New time</Text>
                      <TimePicker
                        selected={rescheduleTime}
                        onSelect={setRescheduleTime}
                        disabledSlots={disabledSlotsForDay(rescheduleDay, bookedSlotsByCounsellor[upcoming.counsellorId] ?? [])}
                        loading={slotsLoadingFor === upcoming.counsellorId}
                      />
                      <Button
                        label={reschedulingBusy ? 'Rescheduling…' : 'Confirm new time'}
                        variant="primary"
                        fullWidth
                        disabled={
                          reschedulingBusy ||
                          slotsLoadingFor === upcoming.counsellorId ||
                          isSlotUnavailable(rescheduleDay, rescheduleTime, bookedSlotsByCounsellor[upcoming.counsellorId] ?? [])
                        }
                        onPress={() => handleConfirmReschedule(upcoming.id)}
                        style={styles.confirmBtn}
                      />
                    </View>
                  )}
                </View>
              </FadeInItem>
            )}

            {unratedCompleted.map((appt) => {
              const isRatingThis = ratingAppointmentId === appt.id;
              const idx = animIndex++;
              return (
                <FadeInItem key={appt.id} index={idx}>
                  <View style={[styles.rateCard, isDark && styles.surfaceDark]}>
                    <Text style={styles.rateEyebrow}>How was it?</Text>
                    <Text style={[styles.rateName, isDark && styles.textDark]}>{appt.counsellorName}</Text>
                    <Text style={[styles.rateWhen, isDark && styles.mutedTextDark]}>{formatApptWhen(appt.scheduledAt)}</Text>
                    <Button
                      label={isRatingThis ? 'Never mind' : 'Rate this session'}
                      onPress={() => handleToggleRating(appt.id)}
                    />
                    {isRatingThis && (
                      <View style={[styles.bookingPanel, isDark && styles.bookingPanelDark]}>
                        <View style={styles.starRow}>
                          {[1, 2, 3, 4, 5].map((n) => (
                            <Pressable
                              key={n}
                              onPress={() => setRatingStars(n)}
                              accessibilityRole="button"
                              accessibilityLabel={`${n} star${n === 1 ? '' : 's'}`}
                            >
                              <Ionicons
                                name={n <= ratingStars ? 'star' : 'star-outline'}
                                size={30}
                                color={calm.amber}
                              />
                            </Pressable>
                          ))}
                        </View>
                        <TextInput
                          style={[styles.ratingCommentInput, isDark && styles.inputDark]}
                          placeholder="Add a comment (optional)"
                          placeholderTextColor={isDark ? darkPalette.textFaint : calm.faint}
                          value={ratingComment}
                          onChangeText={setRatingComment}
                          multiline
                        />
                        <Button
                          label={ratingSubmitting ? 'Submitting…' : 'Submit rating'}
                          variant="primary"
                          fullWidth
                          disabled={ratingSubmitting}
                          onPress={() => handleSubmitRating(appt.id)}
                          style={styles.confirmBtn}
                        />
                      </View>
                    )}
                  </View>
                </FadeInItem>
              );
            })}

            <FadeInItem index={animIndex++}>
              <View style={styles.sectionHead}>
                <Text style={[styles.sectionTitle, isDark && styles.textDark]}>Find someone</Text>
                <Text style={[styles.sectionMeta, isDark && styles.mutedTextDark]}>{roster.length} of {fullRoster.length}</Text>
              </View>
            </FadeInItem>

            <FadeInItem index={animIndex++}>
              <View style={[styles.searchWrap, isDark && styles.surfaceDark]}>
                <Ionicons name="search" size={16} color={isDark ? darkPalette.textMuted : calm.faint} style={styles.searchIcon} />
                <TextInput
                  style={[styles.searchInput, isDark && styles.textDark]}
                  placeholder="Name or specialty…"
                  placeholderTextColor={isDark ? darkPalette.textFaint : calm.faint}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  returnKeyType="search"
                />
              </View>
              <View style={styles.filterRow}>
                <Chip label="All" active={kindFilter === 'all'} onPress={() => setKindFilter('all')} />
                <Chip label="Counsellors" active={kindFilter === 'counsellor'} onPress={() => setKindFilter('counsellor')} />
                <Chip label="Mentors" active={kindFilter === 'mentor'} onPress={() => setKindFilter('mentor')} />
              </View>
            </FadeInItem>

            {showSkeleton ? (
              <View style={[styles.mentorCard, isDark && styles.surfaceDark, { width: cardWidth }]}>
                <Skeleton width={56} height={56} radius={28} style={styles.skeletonGap} />
                <Skeleton width="60%" height={14} style={styles.skeletonGap} />
                <Skeleton width="80%" height={11} />
              </View>
            ) : fullRoster.length === 0 ? (
              <View style={[styles.emptyCard, isDark && styles.surfaceDark]}>
                <Ionicons name="leaf-outline" size={28} color={isDark ? darkPalette.textMuted : calm.faint} />
                <Text style={[styles.emptyText, isDark && styles.mutedTextDark]}>No counsellors or mentors available right now.</Text>
              </View>
            ) : roster.length === 0 ? (
              <View style={[styles.emptyCard, isDark && styles.surfaceDark]}>
                <Text style={[styles.emptyText, isDark && styles.mutedTextDark]}>No matches for “{searchQuery}”. Try another search.</Text>
              </View>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                decelerationRate="fast"
                snapToInterval={cardWidth + spacing.md}
                contentContainerStyle={styles.carousel}
                style={styles.carouselOuter}
              >
                {roster.map((item, i) => {
                  const isCounsellor = item.kind === 'counsellor';
                  const { id, name, avatarEmoji, available } = item.data;
                  const subtitle = isCounsellor
                    ? (item.data as CounsellorView).title
                    : (item.data as MentorView).focusArea;
                  const specialties = isCounsellor ? (item.data as CounsellorView).specialties : [];
                  const isBookingThis = bookingId === id;

                  return (
                    <FadeInItem key={`${item.kind}-${id}`} index={i} style={{ width: cardWidth }}>
                      <View style={[styles.mentorCard, isDark && styles.surfaceDark]}>
                        <View style={styles.mentorCardTop}>
                          <View style={[styles.mentorBigAvatar, isDark && styles.greenPillDark]}>
                            <AppIcon name={avatarEmoji} size={32} color={isDark ? darkPalette.primary : calm.forest} fallback={DEFAULT_AVATAR_ICON} />
                          </View>
                          {isCounsellor ? (
                            (() => {
                              const meta = AVAILABILITY_META[(item.data as CounsellorView).availabilityStatus] ?? AVAILABILITY_META.ONLINE;
                              return (
                                <View style={[styles.onlineBadge, { backgroundColor: meta.bg }]}>
                                  <View style={[styles.onlineDot, { backgroundColor: meta.dot }]} />
                                  <Text style={[styles.onlineBadgeText, { color: meta.text }]}>{meta.label}</Text>
                                </View>
                              );
                            })()
                          ) : available ? (
                            <View style={styles.onlineBadge}>
                              <View style={styles.onlineDot} />
                              <Text style={styles.onlineBadgeText}>Available</Text>
                            </View>
                          ) : (
                            <Text style={styles.offlineText}>Unavailable</Text>
                          )}
                        </View>
                        <Text style={[styles.mentorBigName, isDark && styles.textDark]}>{name}</Text>
                        <Text style={[styles.mentorBigSpecialty, isDark && styles.mutedTextDark]}>{subtitle}</Text>
                        {isCounsellor && (
                          (item.data as CounsellorView).averageRating != null ? (
                            <View style={styles.ratingMetaRow}>
                              <Ionicons name="star" size={12} color={calm.amber} />
                              <Text style={[styles.ratingMeta, isDark && styles.mutedTextDark]}>
                                {(item.data as CounsellorView).averageRating!.toFixed(1)} ({(item.data as CounsellorView).ratingCount})
                              </Text>
                            </View>
                          ) : (
                            <Text style={[styles.ratingMeta, isDark && styles.mutedTextDark]}>New · no ratings yet</Text>
                          )
                        )}
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
                              label="Book"
                              onPress={() => navigation.navigate('CounsellorDetail', { counsellorId: id })}
                              disabled={!available}
                              style={styles.cardActionBtn}
                            />
                          )}
                          {isCounsellor ? (
                            <Button
                              label="Message"
                              variant="primary"
                              onPress={() => handleMessage({ counsellorId: id }, name)}
                              style={styles.cardActionBtn}
                            />
                          ) : (
                            (() => {
                              const myRequest = latestMentorRequestFor(id, myMentorRequests);
                              if (myRequest?.status === 'ACCEPTED') {
                                return (
                                  <Button
                                    label="Message"
                                    variant="primary"
                                    onPress={() => handleMessage({ peerMentorId: id }, name)}
                                    style={styles.cardActionBtn}
                                  />
                                );
                              }
                              if (myRequest?.status === 'PENDING') {
                                return (
                                  <Button label="Request sent" disabled style={styles.cardActionBtn} />
                                );
                              }
                              return (
                                <Button
                                  label={requestingMentorId === id ? 'Sending…' : myRequest?.status === 'DECLINED' ? 'Request again' : 'Request to connect'}
                                  variant="primary"
                                  disabled={requestingMentorId === id}
                                  onPress={() => handleRequestMentor(id)}
                                  style={styles.cardActionBtn}
                                />
                              );
                            })()
                          )}
                        </View>

                        {isBookingThis && (
                          <View style={[styles.bookingPanel, isDark && styles.bookingPanelDark]}>
                            <Text style={[styles.bookingLabel, isDark && styles.mutedTextDark]}>Pick a day</Text>
                            <DayPicker days={visibleDays} selected={selectedDay} onSelect={setSelectedDay} />
                            <Text style={[styles.bookingLabel, isDark && styles.mutedTextDark]}>Pick a time</Text>
                            <TimePicker
                              selected={selectedTime}
                              onSelect={setSelectedTime}
                              disabledSlots={disabledSlotsForDay(selectedDay, bookedSlotsByCounsellor[id] ?? [])}
                              loading={slotsLoadingFor === id}
                            />
                            <Button
                              label={booking ? 'Booking…' : 'Confirm booking'}
                              variant="primary"
                              fullWidth
                              disabled={
                                booking ||
                                slotsLoadingFor === id ||
                                isSlotUnavailable(selectedDay, selectedTime, bookedSlotsByCounsellor[id] ?? [])
                              }
                              onPress={() => handleConfirmBooking(id)}
                              style={styles.confirmBtn}
                            />
                          </View>
                        )}
                      </View>
                    </FadeInItem>
                  );
                })}
              </ScrollView>
            )}

            <FadeInItem index={animIndex++}>
              <View style={styles.sectionHead}>
                <Text style={[styles.sectionTitle, isDark && styles.textDark]}>Messages</Text>
                <Text style={[styles.sectionMeta, isDark && styles.mutedTextDark]}>{totalUnread > 0 ? `${totalUnread} unread` : 'All caught up'}</Text>
              </View>
            </FadeInItem>

            {conversations.length === 0 ? (
              <FadeInItem index={animIndex++}>
                <View style={[styles.msgEmpty, isDark && styles.surfaceDark]}>
                  <View style={[styles.msgEmptyIcon, isDark && styles.greenPillDark]}>
                    <Ionicons name="chatbubbles-outline" size={28} color={isDark ? darkPalette.primary : calm.primary} />
                  </View>
                  <Text style={[styles.msgEmptyTitle, isDark && styles.textDark]}>No messages yet</Text>
                  <Text style={[styles.msgEmptySub, isDark && styles.mutedTextDark]}>
                    Message a counsellor, or request a mentor when you’re ready.
                  </Text>
                </View>
              </FadeInItem>
            ) : (
              conversations.map((c, i) => {
                const otherName = c.counsellorName ?? c.peerMentorName ?? 'Conversation';
                const hasUnread = c.unreadCount > 0;
                const emoji = avatarFor(c, counsellors, mentors);
                const timeLabel = msgTimeAgo(c.lastMessageAt ?? c.createdAt);
                return (
                  <FadeInItem key={c.id} index={i}>
                    <PressScale
                      onPress={() => navigation.navigate('Chat', {
                        conversationId: c.id,
                        otherPartyName: otherName,
                        otherPartyRole: c.counsellorId != null ? 'COUNSELLOR' : 'MENTOR',
                        otherPartyId: c.counsellorId ?? c.peerMentorId ?? undefined,
                      })}
                      accessibilityLabel={`Open conversation with ${otherName}`}
                      style={styles.msgCardOuter}
                    >
                      <View style={[styles.msgCard, isDark && styles.surfaceDark, hasUnread && styles.msgCardUnread, isDark && hasUnread && styles.msgCardUnreadDark]}>
                        <View style={[styles.msgAvatarCircle, isDark && styles.greenPillDark, hasUnread && styles.msgAvatarCircleUnread, isDark && hasUnread && styles.msgAvatarCircleUnreadDark]}>
                          <AppIcon name={emoji} size={18} color={isDark ? darkPalette.primary : calm.primary} fallback={DEFAULT_AVATAR_ICON} />
                          {hasUnread && <View style={styles.msgLiveDot} />}
                        </View>
                        <View style={styles.msgBody}>
                          <View style={styles.msgTopRow}>
                            <Text style={[styles.msgName, isDark && styles.textDark, hasUnread && styles.msgNameBold]} numberOfLines={1}>
                              {otherName}
                            </Text>
                            <Text style={[styles.msgTime, isDark && styles.mutedTextDark, hasUnread && styles.msgTimeUnread]}>{timeLabel}</Text>
                          </View>
                          <Text style={[styles.msgPreview, isDark && styles.mutedTextDark, hasUnread && styles.msgPreviewBold]} numberOfLines={1}>
                            {c.lastMessagePreview ?? 'Tap to say hello…'}
                          </Text>
                        </View>
                        {hasUnread && (
                          <View style={styles.unreadBadge}>
                            <Text style={styles.unreadBadgeTxt}>{c.unreadCount > 9 ? '9+' : c.unreadCount}</Text>
                          </View>
                        )}
                      </View>
                    </PressScale>
                  </FadeInItem>
                );
              })
            )}
          </Screen>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  rootWrap: { flex: 1, backgroundColor: calm.bg },
  rootWrapDark: { backgroundColor: darkPalette.bg },
  body: { flex: 1 },
  content: { paddingHorizontal: spacing.lg, gap: spacing.md },
  surfaceDark: {
    backgroundColor: darkPalette.surface,
    borderColor: darkPalette.border,
  },
  textDark: { color: darkPalette.text },
  mutedTextDark: { color: darkPalette.textMuted },
  accentTextDark: { color: darkPalette.primary },
  greenPillDark: {
    backgroundColor: darkPalette.primarySoft,
    borderColor: darkPalette.border,
  },

  nextSession: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: calm.border,
    overflow: 'hidden',
    ...shadow.md,
  },
  nextSessionGlow: {
    position: 'absolute',
    top: -40,
    right: -30,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: calm.mintBg,
  },
  nextSessionGlowDark: { backgroundColor: darkPalette.primarySoft },
  nextSessionTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  nextSessionTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: calm.mintBg,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.pill,
  },
  nextSessionTagTxt: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.xs,
    color: calm.primaryDeep,
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.sunSoft,
    borderRadius: radii.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  priorityBadgeTxt: { fontFamily: fonts.bodyBold, fontSize: 10, color: colors.sunText },
  nextName: {
    fontFamily: fonts.displayExtraBold,
    fontSize: fontSizes.xl,
    color: calm.forest,
    letterSpacing: -0.3,
  },
  nextWhen: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.sm,
    color: calm.muted,
    marginTop: 4,
    marginBottom: spacing.md,
  },
  apptActions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs + 2 },

  rateCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: calm.border,
    gap: 4,
    ...shadow.sm,
  },
  rateEyebrow: { fontFamily: fonts.bodyBold, fontSize: fontSizes.xs, color: calm.primary },
  rateName: { fontFamily: fonts.bodyBold, fontSize: fontSizes.md, color: calm.ink },
  rateWhen: { fontFamily: fonts.bodyMedium, fontSize: fontSizes.xs, color: calm.muted, marginBottom: spacing.sm },

  sectionHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginTop: spacing.sm,
  },
  sectionTitle: {
    fontFamily: fonts.displayExtraBold,
    fontSize: fontSizes.lg,
    color: calm.forest,
    letterSpacing: -0.2,
  },
  sectionMeta: { fontFamily: fonts.bodyMedium, fontSize: fontSizes.xs, color: calm.faint },

  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1.5,
    borderColor: calm.border,
    paddingHorizontal: 12,
    ...shadow.sm,
  },
  searchIcon: { marginRight: 8 },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: calm.ink,
  },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: spacing.sm, gap: 2 },

  carouselOuter: { marginHorizontal: -spacing.lg },
  carousel: { paddingHorizontal: spacing.lg, gap: spacing.md, paddingVertical: 4 },

  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.xxl,
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: calm.border,
  },
  emptyText: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.sm,
    color: calm.muted,
    textAlign: 'center',
    lineHeight: 20,
  },
  skeletonGap: { marginBottom: 8 },

  mentorCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: calm.border,
    borderRadius: radii.card,
    padding: spacing.lg,
    ...shadow.md,
  },
  mentorCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm + 2,
  },
  mentorBigAvatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: calm.mintBg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(87,158,101,0.25)',
  },
  mentorBigAvatarEmoji: { fontSize: 26 },
  onlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.sageSoft,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: radii.pill,
  },
  onlineBadgeText: { fontFamily: fonts.bodyBold, fontSize: 10, color: colors.sageDeep },
  offlineText: { fontFamily: fonts.bodyMedium, fontSize: 10, color: calm.faint },
  onlineDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: colors.sage },
  mentorBigName: {
    fontFamily: fonts.displayExtraBold,
    fontSize: fontSizes.lg,
    color: calm.forest,
    marginBottom: 3,
    letterSpacing: -0.2,
  },
  mentorBigSpecialty: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.xs,
    color: calm.muted,
    marginBottom: spacing.sm,
  },
  specialtyRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing.sm },
  cardActions: { flexDirection: 'row', gap: spacing.xs + 2 },
  cardActionBtn: { flex: 1, paddingVertical: 10 },

  bookingPanel: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: calm.border,
  },
  bookingPanelDark: {
    borderTopColor: darkPalette.divider,
  },
  bookingLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.xs,
    color: calm.muted,
    marginBottom: spacing.xs,
    marginTop: spacing.xs,
  },
  dayRow: { flexDirection: 'row', gap: 5, marginBottom: spacing.sm },
  dayChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: radii.md,
    backgroundColor: calm.trackAlt,
    borderWidth: 1.5,
    borderColor: calm.border,
    alignItems: 'center',
  },
  dayChipDark: {
    backgroundColor: darkPalette.surfaceSunken,
    borderColor: darkPalette.border,
  },
  dayChipActive: { backgroundColor: calm.primary, borderColor: calm.primary },
  dayChipWeekday: { fontFamily: fonts.bodyMedium, fontSize: 9, color: calm.faint },
  dayChipNum: { fontFamily: fonts.bodyBold, fontSize: fontSizes.sm, color: calm.muted },
  dayChipTextActive: { color: '#FFFFFF' },
  timeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: spacing.md },
  timeChip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: radii.pill,
    backgroundColor: calm.trackAlt,
    borderWidth: 1.5,
    borderColor: calm.border,
    minWidth: 78,
    alignItems: 'center',
  },
  timeChipDark: {
    backgroundColor: darkPalette.surfaceSunken,
    borderColor: darkPalette.border,
  },
  timeChipActive: { backgroundColor: calm.primary, borderColor: calm.primary },
  timeChipDisabled: { opacity: 0.48, backgroundColor: colors.line },
  timeChipText: { fontFamily: fonts.bodyBold, fontSize: fontSizes.xs, color: calm.muted },
  timeChipTextActive: { color: '#FFFFFF' },
  timeChipTextDisabled: { color: calm.faint },
  timeChipSub: { fontFamily: fonts.bodyBold, fontSize: 9, color: calm.faint, marginTop: 2 },
  confirmBtn: { marginTop: spacing.xs },
  starRow: { flexDirection: 'row', gap: 8, marginBottom: spacing.sm },
  ratingCommentInput: {
    borderWidth: 1.5,
    borderColor: calm.border,
    borderRadius: radii.md,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    backgroundColor: calm.bg,
    color: calm.ink,
    minHeight: 48,
    textAlignVertical: 'top',
    marginBottom: spacing.sm,
  },
  inputDark: {
    backgroundColor: darkPalette.surfaceSunken,
    borderColor: darkPalette.border,
    color: darkPalette.text,
  },
  ratingMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: spacing.sm },
  ratingMeta: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.xs,
    color: calm.muted,
    marginBottom: spacing.sm,
  },

  msgCardOuter: { marginBottom: 2 },
  msgCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: calm.border,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    ...shadow.sm,
  },
  msgCardUnread: {
    borderColor: 'rgba(87,158,101,0.35)',
    backgroundColor: calm.mintBg,
  },
  msgCardUnreadDark: {
    borderColor: darkPalette.primary,
    backgroundColor: darkPalette.primarySoft,
  },
  msgAvatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: calm.mintBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  msgAvatarCircleUnread: { backgroundColor: colors.surface },
  msgAvatarCircleUnreadDark: { backgroundColor: darkPalette.surfaceRaised },
  msgLiveDot: {
    position: 'absolute',
    right: 1,
    bottom: 1,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: calm.primary,
    borderWidth: 2,
    borderColor: colors.surface,
  },
  msgAvatarEmoji: { fontSize: 20 },
  msgBody: { flex: 1, gap: 3 },
  msgTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  msgName: { fontFamily: fonts.bodyMedium, fontSize: fontSizes.sm, color: calm.ink, flex: 1 },
  msgNameBold: { fontFamily: fonts.bodyBold, color: calm.forest },
  msgTime: { fontFamily: fonts.bodyMedium, fontSize: 10, color: calm.faint, marginLeft: 6 },
  msgTimeUnread: { color: calm.primary, fontFamily: fonts.bodyBold },
  msgPreview: { fontFamily: fonts.body, fontSize: fontSizes.xs, color: calm.faint },
  msgPreviewBold: { fontFamily: fonts.bodyMedium, color: calm.muted },
  unreadBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: calm.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  unreadBadgeTxt: { fontFamily: fonts.bodyBold, fontSize: 10, color: '#FFFFFF' },
  msgEmpty: { alignItems: 'center', paddingVertical: spacing.xxxl, gap: spacing.sm },
  msgEmptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: calm.mintBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  msgEmptyTitle: { fontFamily: fonts.bodyBold, fontSize: fontSizes.base, color: calm.forest },
  msgEmptySub: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.xs,
    color: calm.muted,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: spacing.xl,
  },
});
