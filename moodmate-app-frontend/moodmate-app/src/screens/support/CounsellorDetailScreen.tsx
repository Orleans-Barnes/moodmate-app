/**
 * CounsellorDetailScreen - student counsellor profile and booking.
 *
 * THESIS: A student should see one calm support person, one clear schedule,
 * and one confident next step instead of opening an inline booking form in a
 * carousel.
 * OWN-WORLD: Calm Forest, WhatsApp-green actions, restrained white panels,
 * warm amber reward cues, avatar-first identity when real photos are absent.
 * STORY: Review counsellor -> pick an open time -> book -> message or join
 * a confirmed session.
 * FIRST VIEWPORT: Forest profile hero, quick actions, trust/rating strip,
 * then the date/time picker with a sticky CTA.
 * FORM: Operate surface adapted from the approved support spec.
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { AppIcon } from '@/components/AppIcon';
import { BackButton } from '@/components/BackButton';
import { Button } from '@/components/Button';
import { Chip } from '@/components/Chip';
import { FadeInItem } from '@/components/FadeInItem';
import { PressScale } from '@/components/PressScale';
import { ApiRequestError } from '@/api/client';
import { listBookedSlots } from '@/api/support';
import type { BookedSlotView, CounsellorAvailabilityStatus } from '@/api/types';
import { useAuthStore } from '@/state/useAuthStore';
import { useSupportStore } from '@/state/useSupportStore';
import { useToast } from '@/state/useToast';
import { DEFAULT_AVATAR_ICON } from '@/theme/iconMap';
import { calm, colors, fonts, fontSizes, radii, shadow, spacing } from '@/theme/tokens';
import {
  TIME_SLOTS,
  addDays,
  disabledSlotsForDay,
  endOfDay,
  formatApptWhen,
  formatTimeLabel,
  isSameDay,
  isSlotUnavailable,
  slotDateTime,
  startOfDay,
} from './supportScheduling';

type Props = NativeStackScreenProps<RootStackParamList, 'CounsellorDetail'>;

const AVAILABILITY_META: Record<CounsellorAvailabilityStatus, { label: string; bg: string; fg: string; dot: string }> = {
  ONLINE: { label: 'Online', bg: colors.sageSoft, fg: colors.sageDeep, dot: colors.sage },
  BUSY: { label: 'Busy', bg: colors.warningSoft, fg: colors.sunText, dot: colors.warning },
  AWAY: { label: 'Away', bg: calm.trackAlt, fg: calm.muted, dot: calm.faint },
};

function DayPicker({
  days,
  selected,
  onSelect,
}: {
  days: Date[];
  selected: Date;
  onSelect: (day: Date) => void;
}) {
  return (
    <View style={s.dayRow}>
      {days.map((day) => {
        const active = isSameDay(day, selected);
        return (
          <PressScale key={day.toISOString()} onPress={() => onSelect(day)} style={s.dayPress}>
            <View style={[s.dayChip, active && s.dayChipActive]}>
              <Text style={[s.dayWeek, active && s.dayTextActive]}>
                {day.toLocaleDateString('en-US', { weekday: 'short' })}
              </Text>
              <Text style={[s.dayNum, active && s.dayTextActive]}>{day.getDate()}</Text>
            </View>
          </PressScale>
        );
      })}
    </View>
  );
}

function TimePicker({
  selected,
  onSelect,
  disabledSlots,
  loading,
}: {
  selected: string;
  onSelect: (slot: string) => void;
  disabledSlots: Set<string>;
  loading: boolean;
}) {
  return (
    <View style={s.timeGrid}>
      {TIME_SLOTS.map((slot) => {
        const active = selected === slot;
        const disabled = loading || disabledSlots.has(slot);
        return (
          <Pressable
            key={slot}
            disabled={disabled}
            onPress={() => onSelect(slot)}
            accessibilityRole="button"
            accessibilityState={{ selected: active, disabled }}
            style={[s.timeChip, active && s.timeChipActive, disabled && s.timeChipDisabled]}
          >
            <Ionicons
              name={disabled ? 'lock-closed-outline' : 'time-outline'}
              size={15}
              color={active ? '#FFFFFF' : disabled ? calm.faint : calm.primary}
            />
            <Text style={[s.timeText, active && s.timeTextActive, disabled && s.timeTextDisabled]}>
              {formatTimeLabel(slot)}
            </Text>
            {disabled && !loading ? <Text style={s.closedText}>Closed</Text> : null}
          </Pressable>
        );
      })}
    </View>
  );
}

export function CounsellorDetailScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const token = useAuthStore((state) => state.token);
  const counsellorId = route.params.counsellorId;

  const counsellors = useSupportStore((state) => state.counsellors);
  const appointments = useSupportStore((state) => state.appointments);
  const load = useSupportStore((state) => state.load);
  const book = useSupportStore((state) => state.book);
  const openConversation = useSupportStore((state) => state.openConversation);

  const counsellor = counsellors.find((item) => item.id === counsellorId);
  const [selectedDay, setSelectedDay] = useState(() => new Date());
  const [selectedTime, setSelectedTime] = useState(TIME_SLOTS[0]);
  const [bookedSlots, setBookedSlots] = useState<BookedSlotView[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);
  const [booking, setBooking] = useState(false);
  const [successAt, setSuccessAt] = useState<string | null>(null);

  const days = useMemo(() => [0, 1, 2, 3, 4, 5, 6].map((offset) => addDays(new Date(), offset)), []);
  const confirmedAppointment = appointments
    .filter((item) => item.counsellorId === counsellorId && item.status === 'CONFIRMED')
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())[0];

  const fetchSlots = useCallback(async () => {
    if (!token || token === 'guest') return;
    setSlotsLoading(true);
    setSlotsError(null);
    try {
      const from = startOfDay(new Date()).toISOString();
      const to = endOfDay(addDays(new Date(), 6)).toISOString();
      setBookedSlots(await listBookedSlots(token, counsellorId, from, to));
    } catch (err) {
      const message = err instanceof ApiRequestError ? err.message : 'Could not load available times.';
      setSlotsError(message);
      toast(message);
    } finally {
      setSlotsLoading(false);
    }
  }, [counsellorId, token, toast]);

  useFocusEffect(
    useCallback(() => {
      if (!token || token === 'guest') return;
      load(token).catch((err) => toast(err instanceof ApiRequestError ? err.message : 'Could not refresh support.'));
      fetchSlots();
    }, [fetchSlots, load, token, toast]),
  );

  const disabledSlots = useMemo(() => disabledSlotsForDay(selectedDay, bookedSlots), [bookedSlots, selectedDay]);

  useEffect(() => {
    if (!disabledSlots.has(selectedTime)) return;
    const nextOpen = TIME_SLOTS.find((slot) => !disabledSlots.has(slot));
    if (nextOpen) setSelectedTime(nextOpen);
  }, [disabledSlots, selectedTime]);

  const selectedDateTime = slotDateTime(selectedDay, selectedTime);
  const selectedClosed = isSlotUnavailable(selectedDay, selectedTime, bookedSlots);
  const canBook = !!counsellor && !booking && !slotsLoading && !slotsError && !selectedClosed && counsellor.available;

  const handleMessage = async () => {
    if (!token || !counsellor) return;
    try {
      const conversation = await openConversation(token, { counsellorId: counsellor.id });
      navigation.navigate('Chat', {
        conversationId: conversation.id,
        otherPartyName: counsellor.name,
        otherPartyRole: 'COUNSELLOR',
        otherPartyId: counsellor.id,
      });
    } catch (err) {
      toast(err instanceof ApiRequestError ? err.message : 'Could not open that conversation.');
    }
  };

  const handleBook = async () => {
    if (!token || !counsellor || !canBook) return;
    setBooking(true);
    try {
      const appointment = await book(token, counsellor.id, selectedDateTime.toISOString());
      setSuccessAt(appointment.scheduledAt);
      await fetchSlots();
      Alert.alert('Session requested', 'Your counsellor will confirm this time before video opens.');
    } catch (err) {
      toast(err instanceof ApiRequestError ? err.message : 'Could not book that session.');
    } finally {
      setBooking(false);
    }
  };

  if (!counsellor) {
    return (
      <View style={[s.root, { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + spacing.lg }]}>
        <BackButton onPress={() => navigation.goBack()} style={s.backFloating} />
        <View style={s.centerState}>
          <Ionicons name="person-circle-outline" size={44} color={calm.faint} />
          <Text style={s.emptyTitle}>Counsellor not found</Text>
          <Text style={s.emptyBody}>Go back to Support and refresh the counsellor list.</Text>
        </View>
      </View>
    );
  }

  const availability = AVAILABILITY_META[counsellor.availabilityStatus];

  return (
    <View style={s.root}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 112 }}
      >
        <LinearGradient
          colors={[calm.forest, calm.forestPanel]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[s.hero, { paddingTop: insets.top + spacing.lg }]}
        >
          <View style={s.heroGlow} />
          <View style={s.topRow}>
            <BackButton inverted onPress={() => navigation.goBack()} />
            <View style={[s.availabilityBadge, { backgroundColor: availability.bg }]}>
              <View style={[s.availabilityDot, { backgroundColor: availability.dot }]} />
              <Text style={[s.availabilityText, { color: availability.fg }]}>{availability.label}</Text>
            </View>
          </View>

          <FadeInItem index={0}>
            <View style={s.identityRow}>
              <View style={s.avatar}>
                <AppIcon name={counsellor.avatarEmoji} size={40} color={calm.primary} fallback={DEFAULT_AVATAR_ICON} />
              </View>
              <View style={s.identityCopy}>
                <Text style={s.name}>{counsellor.name}</Text>
                <Text style={s.title}>{counsellor.title}</Text>
                <View style={s.ratingRow}>
                  <Ionicons name="star" size={14} color={calm.amber} />
                  <Text style={s.ratingText}>
                    {counsellor.averageRating == null
                      ? 'New counsellor'
                      : `${counsellor.averageRating.toFixed(1)} from ${counsellor.ratingCount} rating${counsellor.ratingCount === 1 ? '' : 's'}`}
                  </Text>
                </View>
              </View>
            </View>
          </FadeInItem>

          <FadeInItem index={1}>
            <View style={s.quickActions}>
              <Pressable style={s.quickButton} onPress={handleMessage}>
                <Ionicons name="chatbubble-ellipses-outline" size={20} color={calm.forest} />
              </Pressable>
              <Pressable
                style={[s.quickButton, !confirmedAppointment && s.quickDisabled]}
                disabled={!confirmedAppointment}
                onPress={() =>
                  confirmedAppointment &&
                  navigation.navigate('VideoSession', {
                    appointmentId: confirmedAppointment.id,
                    otherPartyName: counsellor.name,
                  })
                }
              >
                <Ionicons name="videocam-outline" size={20} color={calm.forest} />
              </Pressable>
            </View>
          </FadeInItem>
        </LinearGradient>

        <View style={s.content}>
          <FadeInItem index={2}>
            <View style={s.bioCard}>
              <Text style={s.sectionTitle}>Support focus</Text>
              <Text style={s.bio}>{counsellor.bio}</Text>
              {counsellor.specialties.length > 0 ? (
                <View style={s.chipRow}>
                  {counsellor.specialties.map((item) => (
                    <Chip key={item} label={item} />
                  ))}
                </View>
              ) : null}
            </View>
          </FadeInItem>

          <FadeInItem index={3}>
            <View style={s.bookingCard}>
              <View style={s.sectionHead}>
                <View>
                  <Text style={s.sectionTitle}>Select date</Text>
                  <Text style={s.sectionSub}>Closed times are already booked.</Text>
                </View>
                {slotsLoading ? <ActivityIndicator color={calm.primary} /> : null}
              </View>
              <DayPicker days={days} selected={selectedDay} onSelect={setSelectedDay} />

              <Text style={[s.sectionTitle, s.timeTitle]}>Select time</Text>
              {slotsError ? (
                <Pressable style={s.retryBox} onPress={fetchSlots}>
                  <Ionicons name="refresh-outline" size={18} color={colors.error} />
                  <Text style={s.retryText}>{slotsError} Tap to retry.</Text>
                </Pressable>
              ) : (
                <TimePicker
                  selected={selectedTime}
                  onSelect={setSelectedTime}
                  disabledSlots={disabledSlots}
                  loading={slotsLoading}
                />
              )}
            </View>
          </FadeInItem>

          {successAt ? (
            <FadeInItem index={4}>
              <View style={s.successCard}>
                <View style={s.successIcon}>
                  <Ionicons name="leaf" size={18} color={calm.primary} />
                </View>
                <View style={s.successCopy}>
                  <Text style={s.successTitle}>Courage Leaf earned</Text>
                  <Text style={s.successBody}>Session requested for {formatApptWhen(successAt)}.</Text>
                </View>
              </View>
            </FadeInItem>
          ) : null}
        </View>
      </ScrollView>

      <View style={[s.bottomBar, { paddingBottom: insets.bottom + spacing.md }]}>
        <View style={s.selectedSummary}>
          <Text style={s.selectedLabel}>Selected</Text>
          <Text style={s.selectedValue}>
            {selectedDateTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} at{' '}
            {formatTimeLabel(selectedTime)}
          </Text>
        </View>
        <Button
          label={booking ? 'Booking...' : 'Book session'}
          variant="primary"
          disabled={!canBook}
          onPress={handleBook}
          style={s.cta}
        />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: calm.bg },
  hero: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl,
    overflow: 'hidden',
  },
  heroGlow: {
    position: 'absolute',
    width: 190,
    height: 190,
    borderRadius: 95,
    right: -60,
    top: 40,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xxl },
  backFloating: { marginLeft: spacing.lg },
  availabilityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: radii.pill,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  availabilityDot: { width: 7, height: 7, borderRadius: 4 },
  availabilityText: { fontFamily: fonts.bodyBold, fontSize: fontSizes.xs },
  identityRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 32,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.38)',
  },
  identityCopy: { flex: 1 },
  name: { fontFamily: fonts.displayExtraBold, fontSize: 28, lineHeight: 34, color: '#FFFFFF' },
  title: { fontFamily: fonts.bodyMedium, fontSize: fontSizes.base, color: calm.mutedOnDark, marginTop: 4 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: spacing.sm },
  ratingText: { fontFamily: fonts.bodyBold, fontSize: fontSizes.xs + 1, color: '#FFFFFF' },
  quickActions: { flexDirection: 'row', gap: spacing.md, alignSelf: 'flex-end', marginTop: spacing.lg },
  quickButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickDisabled: { opacity: 0.45 },
  content: { padding: spacing.xl, gap: spacing.md },
  bioCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radii.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: calm.border,
    ...shadow.sm,
  },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontFamily: fonts.bodyBold, fontSize: fontSizes.md, color: calm.forest },
  sectionSub: { fontFamily: fonts.bodyMedium, fontSize: fontSizes.xs, color: calm.muted, marginTop: 3 },
  bio: { fontFamily: fonts.body, fontSize: fontSizes.base, lineHeight: 22, color: calm.ink, marginTop: spacing.sm },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: spacing.md },
  bookingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radii.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: calm.border,
    ...shadow.sm,
  },
  dayRow: { flexDirection: 'row', gap: 7, marginTop: spacing.md },
  dayPress: { flex: 1 },
  dayChip: {
    minHeight: 62,
    borderRadius: radii.md,
    backgroundColor: calm.trackAlt,
    borderWidth: 1.5,
    borderColor: calm.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayChipActive: { backgroundColor: calm.forest, borderColor: calm.forest },
  dayWeek: { fontFamily: fonts.bodyMedium, fontSize: 10, color: calm.faint },
  dayNum: { fontFamily: fonts.displayExtraBold, fontSize: fontSizes.lg, color: calm.ink },
  dayTextActive: { color: '#FFFFFF' },
  timeTitle: { marginTop: spacing.lg, marginBottom: spacing.sm },
  timeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  timeChip: {
    minHeight: 46,
    minWidth: '30%',
    flexGrow: 1,
    borderRadius: radii.pill,
    borderWidth: 1.5,
    borderColor: calm.border,
    backgroundColor: calm.trackAlt,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 5,
  },
  timeChipActive: { backgroundColor: calm.primary, borderColor: calm.primary },
  timeChipDisabled: { opacity: 0.5, backgroundColor: colors.line },
  timeText: { fontFamily: fonts.bodyBold, fontSize: fontSizes.xs + 1, color: calm.ink },
  timeTextActive: { color: '#FFFFFF' },
  timeTextDisabled: { color: calm.faint },
  closedText: { fontFamily: fonts.bodyBold, fontSize: 9, color: calm.faint },
  retryBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radii.md,
    backgroundColor: colors.errorSoft,
    padding: spacing.md,
  },
  retryText: { flex: 1, fontFamily: fonts.bodyBold, fontSize: fontSizes.xs + 1, color: colors.errorDeep },
  successCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.sunSoft,
    borderRadius: radii.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: '#F5DFA6',
  },
  successIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  successCopy: { flex: 1 },
  successTitle: { fontFamily: fonts.bodyBold, fontSize: fontSizes.base, color: calm.forest },
  successBody: { fontFamily: fonts.bodyMedium, fontSize: fontSizes.xs + 1, color: colors.sunText, marginTop: 3 },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: calm.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  selectedSummary: { flex: 1 },
  selectedLabel: { fontFamily: fonts.bodyBold, fontSize: 10, color: calm.faint },
  selectedValue: { fontFamily: fonts.bodyBold, fontSize: fontSizes.xs + 1, color: calm.forest, marginTop: 2 },
  cta: { minWidth: 142, paddingHorizontal: spacing.md },
  centerState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  emptyTitle: { fontFamily: fonts.bodyBold, fontSize: fontSizes.lg, color: calm.forest, marginTop: spacing.md },
  emptyBody: { fontFamily: fonts.bodyMedium, fontSize: fontSizes.sm, color: calm.muted, textAlign: 'center', marginTop: spacing.xs },
});
