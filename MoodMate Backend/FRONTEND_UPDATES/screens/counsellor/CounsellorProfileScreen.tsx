import React, { useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Animated, StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { fonts, fontSizes } from '@/theme/tokens';
import { useAuthStore } from '@/state/useAuthStore';
import { useToast } from '@/state/useToast';

// ─── Design system ─────────────────────────────────────────────────────────
const BG     = '#F0EBFF';
const PURPLE = '#7C3AED';
const PL     = '#EDE9FE';
const PM     = '#C4B5FD';
const DARK   = '#1A0D40';
const MUTED  = '#8B6FC8';
const WHITE  = '#FFFFFF';
const GRAD_H = ['#1A0A3C', '#3B1275', '#7C3AED'] as const;
const CARD_SH = { shadowColor: PURPLE, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.10, shadowRadius: 12, elevation: 4 };

const AVAILABLE_TIMES = ['Mon 9am', 'Mon 2pm', 'Tue 10am', 'Wed 11am', 'Thu 3pm', 'Fri 9am'];

const BADGES = [
  { icon: 'star' as const, label: '4.9 Rating', color: '#F59E0B' },
  { icon: 'people-outline' as const, label: '312 Sessions', color: '#7C3AED' },
  { icon: 'shield-checkmark-outline' as const, label: 'Verified', color: '#059669' },
  { icon: 'school-outline' as const, label: 'PhD Licensed', color: '#2563EB' },
];

export function CounsellorProfileScreen() {
  const nav    = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const route  = useRoute<any>();
  const toast  = useToast();
  const token  = useAuthStore(s => s.token);

  const { counsellorName = 'Dr. Amara Osei', counsellorId = '1' } = route.params ?? {};

  const scrollY = useRef(new Animated.Value(0)).current;
  const fadeIn  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeIn, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, []);

  const initials = counsellorName.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();

  const handleBook = async () => {
    try {
      const res = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL ?? 'http://10.0.2.2:8080'}/api/conversations`,
        { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ counsellorId }) }
      );
      const data = await res.json();
      nav.navigate('CounsellorChat', { conversationId: data.conversationId ?? data.id, studentName: counsellorName });
    } catch {
      toast.show({ type: 'error', message: 'Could not book session. Try again.' });
    }
  };

  return (
    <View style={[s.root, { backgroundColor: BG }]}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <LinearGradient colors={GRAD_H} style={[s.header, { paddingTop: insets.top + 14 }]}>
        <TouchableOpacity onPress={() => nav.goBack()} style={s.backBtn}>
          <Ionicons name="chevron-back" size={24} color={WHITE} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Counsellor Profile</Text>
        <View style={{ width: 36 }} />
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 120 }]}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
        scrollEventThrottle={16}
      >
        {/* Profile hero */}
        <Animated.View style={[s.hero, CARD_SH, { opacity: fadeIn }]}>
          <View style={s.avatarWrap}>
            <LinearGradient colors={['#7C3AED', '#9333EA']} style={s.avatar}>
              <Text style={s.avatarTxt}>{initials}</Text>
            </LinearGradient>
            <View style={s.onlineBadge}>
              <View style={s.onlineDot} />
              <Text style={s.onlineTxt}>Available</Text>
            </View>
          </View>
          <Text style={s.heroName}>{counsellorName}</Text>
          <Text style={s.heroTitle}>Licensed Clinical Psychologist</Text>
          <Text style={s.heroSpec}>Specialising in Anxiety & Stress</Text>

          {/* Stat badges */}
          <View style={s.badgeRow}>
            {BADGES.map(b => (
              <View key={b.label} style={s.badge}>
                <Ionicons name={b.icon} size={16} color={b.color} />
                <Text style={s.badgeTxt}>{b.label}</Text>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* About */}
        <View style={[s.card, CARD_SH]}>
          <Text style={s.cardTitle}>About</Text>
          <Text style={s.aboutTxt}>
            {counsellorName} is a licensed clinical psychologist with over 10 years of experience supporting students in higher education. She specialises in anxiety management, academic stress, and building emotional resilience through evidence-based approaches including CBT and mindfulness.
          </Text>
        </View>

        {/* Available times */}
        <View style={[s.card, CARD_SH]}>
          <Text style={s.cardTitle}>Available Times</Text>
          <View style={s.timesGrid}>
            {AVAILABLE_TIMES.map(t => (
              <TouchableOpacity key={t} style={s.timePill}>
                <Ionicons name="time-outline" size={13} color={PURPLE} />
                <Text style={s.timeTxt}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Approach */}
        <View style={[s.card, CARD_SH]}>
          <Text style={s.cardTitle}>Therapeutic Approach</Text>
          {['Cognitive Behavioural Therapy (CBT)', 'Mindfulness-Based Stress Reduction', 'Solution-Focused Brief Therapy', 'Trauma-Informed Care'].map(approach => (
            <View key={approach} style={s.approachRow}>
              <View style={s.approachDot} />
              <Text style={s.approachTxt}>{approach}</Text>
            </View>
          ))}
        </View>

        {/* Reviews summary */}
        <View style={[s.card, CARD_SH]}>
          <View style={s.reviewHeader}>
            <Text style={s.cardTitle}>Student Reviews</Text>
            <View style={s.ratingBig}>
              <Ionicons name="star" size={18} color="#F59E0B" />
              <Text style={s.ratingTxt}>4.9</Text>
            </View>
          </View>
          {[
            { name: 'A.K.', text: 'She helped me manage my exam anxiety incredibly well. Highly recommend!' },
            { name: 'M.O.', text: 'Very professional and empathetic. I felt heard for the first time in years.' },
          ].map(r => (
            <View key={r.name} style={s.review}>
              <View style={s.reviewAvatar}><Text style={s.reviewAvatarTxt}>{r.name[0]}</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={s.reviewName}>{r.name}</Text>
                <Text style={s.reviewTxt}>{r.text}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Book button */}
      <View style={[s.bookBar, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity onPress={handleBook} style={{ flex: 1 }}>
          <LinearGradient colors={['#7C3AED', '#9333EA']} style={s.bookBtn}>
            <Ionicons name="calendar-outline" size={20} color={WHITE} />
            <Text style={s.bookTxt}>Book a Session</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root:        { flex: 1 },
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 16 },
  backBtn:     { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: fonts.displaySemibold, fontSize: fontSizes.md, color: WHITE },

  scroll: { padding: 16 },

  hero:       { backgroundColor: WHITE, borderRadius: 20, padding: 24, alignItems: 'center', marginBottom: 14 },
  avatarWrap: { marginBottom: 14, alignItems: 'center' },
  avatar:     { width: 80, height: 80, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  avatarTxt:  { fontFamily: fonts.display, fontSize: 28, color: WHITE },
  onlineBadge:{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#ECFDF5', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginTop: 8 },
  onlineDot:  { width: 6, height: 6, borderRadius: 3, backgroundColor: '#52B788' },
  onlineTxt:  { fontFamily: fonts.bodyMedium, fontSize: fontSizes.xs, color: '#059669' },
  heroName:   { fontFamily: fonts.display, fontSize: fontSizes.xl, color: DARK, marginBottom: 4 },
  heroTitle:  { fontFamily: fonts.bodyMedium, fontSize: fontSizes.base, color: MUTED },
  heroSpec:   { fontFamily: fonts.body, fontSize: fontSizes.sm, color: PM, marginBottom: 16 },
  badgeRow:   { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  badge:      { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: BG, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  badgeTxt:   { fontFamily: fonts.body, fontSize: fontSizes.xs, color: DARK },

  card:      { backgroundColor: WHITE, borderRadius: 18, padding: 18, marginBottom: 14 },
  cardTitle: { fontFamily: fonts.displaySemibold, fontSize: fontSizes.md, color: DARK, marginBottom: 12 },
  aboutTxt:  { fontFamily: fonts.body, fontSize: fontSizes.base, color: DARK, lineHeight: 22 },

  timesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  timePill:  { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: PL, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 },
  timeTxt:   { fontFamily: fonts.bodyMedium, fontSize: fontSizes.sm, color: PURPLE },

  approachRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  approachDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: PURPLE },
  approachTxt: { fontFamily: fonts.body, fontSize: fontSizes.base, color: DARK, flex: 1 },

  reviewHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  ratingBig:   { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingTxt:   { fontFamily: fonts.display, fontSize: fontSizes.xl, color: DARK },
  review:      { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 12 },
  reviewAvatar:{ width: 32, height: 32, borderRadius: 10, backgroundColor: PL, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  reviewAvatarTxt: { fontFamily: fonts.displaySemibold, fontSize: 13, color: PURPLE },
  reviewName:  { fontFamily: fonts.bodyBold, fontSize: fontSizes.sm, color: DARK, marginBottom: 2 },
  reviewTxt:   { fontFamily: fonts.body, fontSize: fontSizes.sm, color: MUTED, lineHeight: 18 },

  bookBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: WHITE, paddingHorizontal: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: PL },
  bookBtn: { height: 52, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  bookTxt: { fontFamily: fonts.displaySemibold, fontSize: fontSizes.md, color: WHITE },
});
