import React, { useCallback, useState } from 'react';
import {
  View, Text, Pressable, StyleSheet, ScrollView,
  Switch,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { CounsellorTabParamList, RootStackParamList } from '@/navigation/types';
import { useAuthStore } from '@/state/useAuthStore';
import { useToast } from '@/state/useToast';
import {
  getCounsellorAnalytics,
  listCounsellorConversations,
  setCounsellorAvailabilityStatus,
} from '@/api/support';
import type { CounsellorAnalyticsView, CounsellorAvailabilityStatus } from '@/api/types';
import { hapticLight } from '@/utils/haptics';
import { colors, fonts, fontSizes, radii, spacing, shadow } from '@/theme/tokens';

type Props = CompositeScreenProps<
  BottomTabScreenProps<CounsellorTabParamList, 'CounsellorProfile'>,
  NativeStackScreenProps<RootStackParamList>
>;

const SPECIALTIES = ['Anxiety', 'Academic Stress', 'Depression', 'Grief', 'Identity', 'Relationships'];
const HOURS = [
  { day: 'Monday', time: '9:00 AM – 5:00 PM', active: true },
  { day: 'Tuesday', time: '9:00 AM – 5:00 PM', active: true },
  { day: 'Wednesday', time: '10:00 AM – 3:00 PM', active: true },
  { day: 'Thursday', time: '9:00 AM – 5:00 PM', active: true },
  { day: 'Friday', time: '9:00 AM – 1:00 PM', active: true },
  { day: 'Saturday', time: 'Unavailable', active: false },
  { day: 'Sunday', time: 'Unavailable', active: false },
];
// Specialties and Hours above are still static placeholders - the backend Counsellor entity has
// no self-profile GET endpoint yet (only listCounsellors, a public directory read), so this screen
// can't reliably resolve "my own" record's specialties/bio/hours without a new endpoint. Left as a
// documented follow-up rather than in scope for this pass (see Fix #3 scoping decision).

type StatusKey = CounsellorAvailabilityStatus;
// Mirrors CounsellorDashboardScreen.tsx's STATUS_OPTIONS/handleStatusChange exactly - this screen
// used to have its own separate, non-persisted "Accepting new clients" switch that duplicated (and
// contradicted) the real ONLINE/BUSY/AWAY status already wired up on the Dashboard. Replaced with
// the same real control so there's one source of truth for a counsellor's availability, not two.
const STATUS_OPTIONS: { key: StatusKey; label: string; color: string; bg: string }[] = [
  { key: 'ONLINE', label: '● Online', color: '#27AE60', bg: '#E8F8EF' },
  { key: 'BUSY',   label: '● Busy',   color: '#E67E22', bg: '#FEF3E2' },
  { key: 'AWAY',   label: '● Away',   color: '#95A5A6', bg: '#F2F3F4' },
];

export function CounsellorProfileScreen({ navigation }: Props) {
  const insets  = useSafeAreaInsets();
  const user    = useAuthStore((s) => s.user);
  const token   = useAuthStore((s) => s.token);
  const logout  = useAuthStore((s) => s.logout);
  const toast   = useToast();

  // Same known gap as the Dashboard: no "get my own counsellor row" endpoint yet, so this always
  // starts at ONLINE on load rather than restoring the last-saved value (documented, not a bug).
  const [status, setStatus]             = useState<StatusKey>('ONLINE');
  const [statusOpen, setStatusOpen]     = useState(false);
  const [statusSaving, setStatusSaving] = useState(false);
  const [notifications, setNotifs]      = useState(true);
  const [analytics, setAnalytics]       = useState<CounsellorAnalyticsView | null>(null);
  const [clientCount, setClientCount]   = useState<number | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const [analyticsData, convos] = await Promise.all([
        getCounsellorAnalytics(token),
        listCounsellorConversations(token),
      ]);
      setAnalytics(analyticsData);
      setClientCount(convos.length);
    } catch {
      toast('Could not load your stats');
    }
  }, [token, toast]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handleStatusChange = async (next: StatusKey) => {
    setStatusOpen(false);
    if (next === status || !token) return;
    const previous = status;
    setStatus(next); // optimistic
    setStatusSaving(true);
    hapticLight();
    try {
      await setCounsellorAvailabilityStatus(token, next);
    } catch {
      setStatus(previous);
      toast('Could not update your status. Try again.');
    } finally {
      setStatusSaving(false);
    }
  };

  const currentStatus = STATUS_OPTIONS.find((o) => o.key === status)!;

  const fullName  = user?.fullName ?? 'Counsellor';
  const initials  = fullName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  const email     = user?.email ?? '';

  return (
    <View style={s.root}>
      {/* Header */}
      <LinearGradient
        colors={['#1B4F72', '#2980B9', '#5DADE2']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[s.header, { paddingTop: insets.top + spacing.md }]}
      >
        <Text style={s.headerTitle}>My Profile</Text>

        {/* Avatar */}
        <View style={s.avatarWrap}>
          <View style={s.avatar}>
            <Text style={s.avatarTxt}>{initials}</Text>
          </View>
          <View style={[s.onlineDot, { backgroundColor: currentStatus.color }]} />
        </View>
        <Text style={s.name}>{fullName}</Text>
        <View style={s.rolePill}>
          <Text style={s.rolePillTxt}>💙 Counsellor / Peer Mentor</Text>
        </View>
        <Text style={s.email}>{email}</Text>
      </LinearGradient>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 110 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Specialties */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Specialties</Text>
          <View style={s.tags}>
            {SPECIALTIES.map(sp => (
              <View key={sp} style={s.tag}>
                <Text style={s.tagTxt}>{sp}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Bio */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Professional Bio</Text>
          <Text style={s.bioText}>
            I am a certified counsellor with a passion for supporting students through academic and
            personal challenges. I believe in creating a safe, non-judgmental space where students
            can explore their feelings and develop effective coping strategies.
          </Text>
        </View>

        {/* Availability Hours */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Availability</Text>
          {HOURS.map(h => (
            <View key={h.day} style={s.hourRow}>
              <Text style={[s.dayTxt, !h.active && s.inactive]}>{h.day}</Text>
              <Text style={[s.timeTxt, !h.active && s.inactive]}>{h.time}</Text>
            </View>
          ))}
        </View>

        {/* Settings toggles */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Settings</Text>

          <View style={s.settingRow}>
            <View>
              <Text style={s.settingLabel}>Availability status</Text>
              <Text style={s.settingHint}>Shown to students browsing Support</Text>
            </View>
            <View>
              <Pressable
                style={[s.statusPill, { backgroundColor: currentStatus.bg }, statusSaving && s.statusPillSaving]}
                onPress={() => { if (statusSaving) return; hapticLight(); setStatusOpen((v) => !v); }}
              >
                <Text style={[s.statusLabel, { color: currentStatus.color }]}>{currentStatus.label}</Text>
                <Text style={[s.statusCaret, { color: currentStatus.color }]}>▾</Text>
              </Pressable>
              {statusOpen && (
                <View style={s.statusDropdown}>
                  {STATUS_OPTIONS.map((opt) => (
                    <Pressable
                      key={opt.key}
                      style={[s.statusOption, opt.key === status && s.statusOptionActive]}
                      onPress={() => handleStatusChange(opt.key)}
                    >
                      <Text style={[s.statusOptionLabel, { color: opt.color }]}>{opt.label}</Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>
          </View>

          <View style={[s.settingRow, s.settingBorder]}>
            <View>
              <Text style={s.settingLabel}>Push notifications</Text>
              <Text style={s.settingHint}>New messages and appointment alerts</Text>
            </View>
            <Switch
              value={notifications}
              onValueChange={v => { hapticLight(); setNotifs(v); }}
              trackColor={{ false: '#D5D8DC', true: '#2980B9' }}
              thumbColor='#FFFFFF'
            />
          </View>
        </View>

        {/* Stats card */}
        <View style={s.statsCard}>
          <LinearGradient colors={['#1B4F72', '#2471A3']} style={s.statsGrad} start={{x:0,y:0}} end={{x:1,y:1}}>
            <Text style={s.statsTitle}>Your stats</Text>
            <View style={s.statsRow}>
              <View style={s.statItem}>
                <Text style={s.statNum}>{analytics ? analytics.totalAppointments : '–'}</Text>
                <Text style={s.statLbl}>Sessions</Text>
              </View>
              <View style={s.statDiv} />
              <View style={s.statItem}>
                <Text style={s.statNum}>{clientCount ?? '–'}</Text>
                <Text style={s.statLbl}>Active clients</Text>
              </View>
              <View style={s.statDiv} />
              <View style={s.statItem}>
                <Text style={s.statNum}>{analytics ? `${Math.round(analytics.completionRate * 100)}%` : '–'}</Text>
                <Text style={s.statLbl}>Completion rate</Text>
              </View>
            </View>
            {/* No rating/review system exists yet (see Fix #5) - showing a real completion rate
                here instead of a fabricated star rating. */}
          </LinearGradient>
        </View>

        {/* Logout */}
        <Pressable
          style={s.logoutBtn}
          onPress={() => {
            hapticLight();
            logout();
            (navigation as any).reset({ index: 0, routes: [{ name: 'Splash' }] });
          }}
        >
          <Text style={s.logoutTxt}>Sign Out</Text>
        </Pressable>

        <Text style={s.version}>MoodMate Counsellor Portal · v1.0</Text>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F0F6FF' },

  header: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl, alignItems: 'center' },
  headerTitle: { fontFamily: fonts.bodyBold, fontSize: fontSizes.xs, color: 'rgba(255,255,255,0.7)', alignSelf: 'flex-start' },

  avatarWrap: { marginTop: spacing.md, position: 'relative' },
  avatar: {
    width: 80, height: 80, borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.5)',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarTxt: { fontFamily: fonts.display, fontSize: 28, color: '#FFFFFF' },
  onlineDot: {
    position: 'absolute', bottom: 2, right: 2,
    width: 18, height: 18, borderRadius: 9,
    borderWidth: 2, borderColor: '#2980B9',
  },

  name: { fontFamily: fonts.display, fontSize: fontSizes.xl, color: '#FFFFFF', marginTop: spacing.md },
  rolePill: {
    marginTop: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12, paddingVertical: 4, borderRadius: radii.pill,
  },
  rolePillTxt: { fontFamily: fonts.bodyBold, fontSize: fontSizes.xs, color: '#FFFFFF' },
  email: { fontFamily: fonts.bodyMedium, fontSize: fontSizes.xs, color: 'rgba(255,255,255,0.7)', marginTop: 4 },

  scroll: { flex: 1 },
  content: { padding: spacing.lg, gap: spacing.md },

  card: { backgroundColor: '#FFFFFF', borderRadius: 18, padding: spacing.lg, ...shadow.sm, gap: spacing.sm },
  cardTitle: { fontFamily: fonts.bodyBold, fontSize: fontSizes.md, color: colors.ink },

  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: {
    backgroundColor: '#EBF5FB', borderRadius: radii.pill,
    paddingHorizontal: 12, paddingVertical: 5,
  },
  tagTxt: { fontFamily: fonts.bodyBold, fontSize: fontSizes.xs, color: '#1B4F72' },

  bioText: { fontFamily: fonts.bodyMedium, fontSize: fontSizes.sm, color: '#444', lineHeight: 22 },

  hourRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#F0F6FF' },
  dayTxt: { fontFamily: fonts.bodyBold, fontSize: fontSizes.sm, color: colors.ink },
  timeTxt: { fontFamily: fonts.bodyMedium, fontSize: fontSizes.sm, color: '#2980B9' },
  inactive: { color: colors.inkFaint },

  settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4 },
  settingBorder: { borderTopWidth: 1, borderTopColor: '#F0F6FF', marginTop: 8, paddingTop: 12 },
  settingLabel: { fontFamily: fonts.bodyBold, fontSize: fontSizes.sm, color: colors.ink },
  settingHint: { fontFamily: fonts.bodyMedium, fontSize: 10, color: colors.inkFaint, marginTop: 2 },

  // Availability status pill + dropdown (mirrors CounsellorDashboardScreen.tsx)
  statusPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: radii.pill,
  },
  statusPillSaving: { opacity: 0.6 },
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

  statsCard: { borderRadius: 18, overflow: 'hidden' },
  statsGrad: { padding: spacing.lg, gap: spacing.md },
  statsTitle: { fontFamily: fonts.bodyBold, fontSize: fontSizes.md, color: '#FFFFFF' },
  statsRow: { flexDirection: 'row' },
  statItem: { flex: 1, alignItems: 'center' },
  statNum: { fontFamily: fonts.display, fontSize: fontSizes.xl, color: '#FFFFFF' },
  statLbl: { fontFamily: fonts.bodyMedium, fontSize: 10, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  statDiv: { width: 1, backgroundColor: 'rgba(255,255,255,0.25)' },

  logoutBtn: {
    backgroundColor: '#FFFFFF', borderRadius: 14,
    padding: spacing.md, alignItems: 'center',
    borderWidth: 1.5, borderColor: '#E74C3C',
  },
  logoutTxt: { fontFamily: fonts.bodyBold, fontSize: fontSizes.base, color: '#E74C3C' },
  version: { fontFamily: fonts.bodyMedium, fontSize: 10, color: colors.inkFaint, textAlign: 'center' },
});
