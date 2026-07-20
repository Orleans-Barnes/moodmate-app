import React, { useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Animated, ScrollView, StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { fonts, fontSizes, spacing } from '@/theme/tokens';
import { useAuthStore } from '@/state/useAuthStore';

// ─── Design system ─────────────────────────────────────────────────────────
const BG     = '#F0EBFF';
const PURPLE = '#7C3AED';
const PL     = '#EDE9FE';
const PM     = '#C4B5FD';
const DARK   = '#1A0D40';
const MUTED  = '#8B6FC8';
const WHITE  = '#FFFFFF';
const GRAD_H = ['#1A0A3C', '#3B1275', '#7C3AED'] as const;
const CARD_SH = { shadowColor: PURPLE, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 14, elevation: 5 };

const ROLES = [
  {
    key: 'STUDENT',
    icon: 'school-outline' as const,
    label: 'Student / Individual',
    desc: 'Track your mood, access resources, and grow your mental wellness every day.',
    accentTop: '#7C3AED',
    accentBorder: '#C4B5FD',
  },
  {
    key: 'COUNSELLOR',
    icon: 'people-outline' as const,
    label: 'Counsellor / Therapist',
    desc: 'Manage sessions, monitor student wellbeing, and deliver impactful care.',
    accentTop: '#2563EB',
    accentBorder: '#93C5FD',
  },
  {
    key: 'ADMIN',
    icon: 'settings-outline' as const,
    label: 'Administrator',
    desc: 'Oversee the platform, configure settings, and manage your organisation.',
    accentTop: '#059669',
    accentBorder: '#6EE7B7',
  },
];

export function RoleSelectScreen() {
  const nav           = useNavigation<any>();
  const insets        = useSafeAreaInsets();
  const loginAsGuest  = useAuthStore((s) => s.loginAsGuest);

  const headerY  = useRef(new Animated.Value(-40)).current;
  const headerOp = useRef(new Animated.Value(0)).current;
  const cardAnims = useRef(ROLES.map(() => ({ op: new Animated.Value(0), y: new Animated.Value(30) }))).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerOp, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(headerY, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start();

    Animated.stagger(100, cardAnims.map(a =>
      Animated.parallel([
        Animated.spring(a.op, { toValue: 1, friction: 7, tension: 120, useNativeDriver: true }),
        Animated.spring(a.y,  { toValue: 0, friction: 7, tension: 120, useNativeDriver: true }),
      ])
    )).start();
  }, []);

  return (
    <View style={[s.root, { backgroundColor: BG }]}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <LinearGradient colors={GRAD_H} style={[s.header, { paddingTop: insets.top + 20 }]}>
        <Animated.View style={{ opacity: headerOp, transform: [{ translateY: headerY }] }}>
          <View style={s.logoRow}>
            <View style={s.logoBg}>
              <Ionicons name="leaf" size={20} color={WHITE} />
            </View>
            <Text style={s.logoTxt}>MoodMate</Text>
          </View>
          <Text style={s.headerTitle}>How are you joining?</Text>
          <Text style={s.headerSub}>Choose the role that best describes you</Text>
        </Animated.View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Stats strip */}
        <View style={s.statsRow}>
          {[['2.4k+', 'Students'], ['4.9', 'Rating'], ['98%', 'Satisfaction']].map(([val, lbl]) => (
            <View key={lbl} style={s.statItem}>
              <Text style={s.statVal}>{val}</Text>
              <Text style={s.statLbl}>{lbl}</Text>
            </View>
          ))}
        </View>

        {/* Role cards */}
        {ROLES.map((role, i) => (
          <Animated.View key={role.key} style={{ opacity: cardAnims[i].op, transform: [{ translateY: cardAnims[i].y }] }}>
            <TouchableOpacity
              activeOpacity={0.85}
              style={[s.card, CARD_SH]}
              onPress={() => nav.navigate('Signup', { role: role.key })}
            >
              <View style={[s.cardTop, { backgroundColor: role.accentTop }]} />
              <View style={s.cardInner}>
                <View style={[s.iconBox, { backgroundColor: `${role.accentTop}18`, borderColor: role.accentBorder }]}>
                  <Ionicons name={role.icon} size={28} color={role.accentTop} />
                </View>
                <View style={s.cardText}>
                  <Text style={s.cardTitle}>{role.label}</Text>
                  <Text style={s.cardDesc}>{role.desc}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={PM} />
              </View>
            </TouchableOpacity>
          </Animated.View>
        ))}

        {/* Guest */}
        <TouchableOpacity
          style={s.guestBtn}
          onPress={() => {
            loginAsGuest();
            nav.navigate('Main');
          }}
        >
          <Ionicons name="person-outline" size={16} color={MUTED} />
          <Text style={s.guestTxt}>Continue as Guest</Text>
        </TouchableOpacity>

        {/* Security note */}
        <View style={s.secRow}>
          <Ionicons name="shield-checkmark-outline" size={14} color={MUTED} />
          <Text style={s.secTxt}>All data is encrypted and private</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root:   { flex: 1 },
  header: { paddingHorizontal: 24, paddingBottom: 28 },
  logoRow:    { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20 },
  logoBg:     { width: 32, height: 32, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  logoTxt:    { fontFamily: fonts.displaySemibold, fontSize: fontSizes.lg, color: WHITE },
  headerTitle:{ fontFamily: fonts.display, fontSize: 26, color: WHITE, marginBottom: 6 },
  headerSub:  { fontFamily: fonts.body, fontSize: fontSizes.base, color: 'rgba(255,255,255,0.65)' },

  scroll: { paddingHorizontal: 20, paddingTop: 20 },

  statsRow: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: WHITE, borderRadius: 16, padding: 16, marginBottom: 20, ...({ shadowColor: PURPLE, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 3 } as any) },
  statItem: { alignItems: 'center' },
  statVal:  { fontFamily: fonts.display, fontSize: fontSizes.xl, color: PURPLE },
  statLbl:  { fontFamily: fonts.body, fontSize: fontSizes.xs, color: MUTED, marginTop: 2 },

  card:      { backgroundColor: WHITE, borderRadius: 18, marginBottom: 14, overflow: 'hidden' },
  cardTop:   { height: 4 },
  cardInner: { flexDirection: 'row', alignItems: 'center', padding: 18, gap: 14 },
  iconBox:   { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  cardText:  { flex: 1 },
  cardTitle: { fontFamily: fonts.displaySemibold, fontSize: fontSizes.md, color: DARK, marginBottom: 4 },
  cardDesc:  { fontFamily: fonts.body, fontSize: fontSizes.sm, color: MUTED, lineHeight: 18 },

  guestBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 8, paddingVertical: 14 },
  guestTxt: { fontFamily: fonts.bodyMedium, fontSize: fontSizes.base, color: MUTED },

  secRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 4 },
  secTxt: { fontFamily: fonts.body, fontSize: fontSizes.xs, color: MUTED },
});
