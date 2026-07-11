import React, { useState } from 'react';
import {
  View, Text, Pressable, StyleSheet, ScrollView,
  Switch,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { CounsellorTabParamList, RootStackParamList } from '@/navigation/types';
import { useAuthStore } from '@/state/useAuthStore';
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

export function CounsellorProfileScreen({ navigation }: Props) {
  const insets  = useSafeAreaInsets();
  const user    = useAuthStore((s) => s.user);
  const logout  = useAuthStore((s) => s.logout);

  const [accepting, setAccepting]     = useState(true);
  const [notifications, setNotifs]    = useState(true);

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
          <View style={[s.onlineDot, { backgroundColor: accepting ? '#27AE60' : '#95A5A6' }]} />
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
              <Text style={s.settingLabel}>Accepting new clients</Text>
              <Text style={s.settingHint}>Students can book appointments with you</Text>
            </View>
            <Switch
              value={accepting}
              onValueChange={v => { hapticLight(); setAccepting(v); }}
              trackColor={{ false: '#D5D8DC', true: '#2980B9' }}
              thumbColor='#FFFFFF'
            />
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
            <Text style={s.statsTitle}>This Month</Text>
            <View style={s.statsRow}>
              <View style={s.statItem}>
                <Text style={s.statNum}>12</Text>
                <Text style={s.statLbl}>Sessions</Text>
              </View>
              <View style={s.statDiv} />
              <View style={s.statItem}>
                <Text style={s.statNum}>8</Text>
                <Text style={s.statLbl}>Active clients</Text>
              </View>
              <View style={s.statDiv} />
              <View style={s.statItem}>
                <Text style={s.statNum}>4.9★</Text>
                <Text style={s.statLbl}>Rating</Text>
              </View>
            </View>
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
