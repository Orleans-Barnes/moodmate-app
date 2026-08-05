import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  TextInput, Animated, StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { fonts, fontSizes } from '@/theme/tokens';
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
const CARD_SH = { shadowColor: PURPLE, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.10, shadowRadius: 12, elevation: 4 };

const SPECIALTIES = ['All', 'Anxiety', 'Depression', 'Stress', 'Trauma', 'Academic'];

const COUNSELLORS = [
  { id: '1', name: 'Dr. Amara Osei', title: 'Licensed Psychologist', specialty: 'Anxiety',    rating: 4.9, sessions: 312, available: true,  color: '#7C3AED' },
  { id: '2', name: 'Mr. Kofi Mensah', title: 'Counselling Therapist', specialty: 'Depression', rating: 4.8, sessions: 198, available: true,  color: '#2563EB' },
  { id: '3', name: 'Ms. Abena Darko', title: 'Student Counsellor',   specialty: 'Academic',   rating: 4.7, sessions: 145, available: false, color: '#059669' },
  { id: '4', name: 'Dr. Yaw Asante',  title: 'Clinical Psychologist', specialty: 'Trauma',    rating: 5.0, sessions: 427, available: true,  color: '#D97706' },
  { id: '5', name: 'Ms. Esi Boateng', title: 'Stress Specialist',    specialty: 'Stress',     rating: 4.6, sessions: 89,  available: false, color: '#DC2626' },
];

export function CounsellorListScreen() {
  const nav    = useNavigation<any>();
  const insets = useSafeAreaInsets();

  const [query, setQuery]     = useState('');
  const [selected, setSelected] = useState('All');

  const headerOp = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(headerOp, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, []);

  const filtered = COUNSELLORS.filter(c => {
    const matchQ = c.name.toLowerCase().includes(query.toLowerCase()) || c.specialty.toLowerCase().includes(query.toLowerCase());
    const matchS = selected === 'All' || c.specialty === selected;
    return matchQ && matchS;
  });

  const initials = (name: string) => name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <View style={[s.root, { backgroundColor: BG }]}>
      <StatusBar barStyle="light-content" />

      <LinearGradient colors={GRAD_H} style={[s.header, { paddingTop: insets.top + 16 }]}>
        <Animated.View style={{ opacity: headerOp }}>
          <View style={s.headerRow}>
            <TouchableOpacity onPress={() => nav.goBack()} style={s.backBtn}>
              <Ionicons name="chevron-back" size={24} color={WHITE} />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={s.headerTitle}>Find a Counsellor</Text>
              <Text style={s.headerSub}>Book a professional session</Text>
            </View>
          </View>

          {/* Search */}
          <View style={s.searchWrap}>
            <Ionicons name="search-outline" size={18} color={PM} />
            <TextInput
              style={s.searchInput}
              placeholder="Search by name or specialty..."
              placeholderTextColor="rgba(196,181,253,0.5)"
              value={query}
              onChangeText={setQuery}
            />
          </View>
        </Animated.View>
      </LinearGradient>

      {/* Specialty filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filterRow}>
        {SPECIALTIES.map(sp => {
          const active = selected === sp;
          return (
            <TouchableOpacity key={sp} onPress={() => setSelected(sp)}>
              {active
                ? <LinearGradient colors={['#7C3AED', '#9333EA']} style={s.filterPill}>
                    <Text style={[s.filterTxt, { color: WHITE }]}>{sp}</Text>
                  </LinearGradient>
                : <View style={[s.filterPill, { backgroundColor: WHITE, borderWidth: 1, borderColor: PL }]}>
                    <Text style={[s.filterTxt, { color: MUTED }]}>{sp}</Text>
                  </View>
              }
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[s.list, { paddingBottom: insets.bottom + 100 }]}>
        <Text style={s.resultCount}>{filtered.length} counsellor{filtered.length !== 1 ? 's' : ''} found</Text>

        {filtered.map(c => (
          <TouchableOpacity
            key={c.id}
            style={[s.card, CARD_SH]}
            onPress={() => nav.navigate('CounsellorProfile', { counsellorId: c.id, counsellorName: c.name })}
          >
            <View style={[s.avatar, { backgroundColor: c.color + '20' }]}>
              <Text style={[s.avatarTxt, { color: c.color }]}>{initials(c.name)}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={s.nameRow}>
                <Text style={s.name}>{c.name}</Text>
                {c.available && <View style={s.avail}><Text style={s.availTxt}>Available</Text></View>}
              </View>
              <Text style={s.title}>{c.title}</Text>
              <View style={s.metaRow}>
                <View style={s.metaItem}>
                  <Ionicons name="star" size={12} color="#F59E0B" />
                  <Text style={s.metaTxt}>{c.rating}</Text>
                </View>
                <View style={s.metaDot} />
                <Text style={s.metaTxt}>{c.sessions} sessions</Text>
                <View style={s.metaDot} />
                <Text style={[s.metaTxt, { color: c.color }]}>{c.specialty}</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={PM} />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root:   { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 20 },
  headerRow:   { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  backBtn:     { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: fonts.display, fontSize: fontSizes.xl, color: WHITE },
  headerSub:   { fontFamily: fonts.body, fontSize: fontSizes.sm, color: 'rgba(255,255,255,0.65)', marginTop: 2 },
  searchWrap:  { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  searchInput: { flex: 1, fontFamily: fonts.body, fontSize: fontSizes.base, color: WHITE },

  filterRow:  { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  filterPill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  filterTxt:  { fontFamily: fonts.bodyMedium, fontSize: fontSizes.sm },

  list:        { paddingHorizontal: 16, paddingTop: 4 },
  resultCount: { fontFamily: fonts.body, fontSize: fontSizes.sm, color: MUTED, marginBottom: 12 },

  card:      { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: WHITE, borderRadius: 18, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: PL },
  avatar:    { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  avatarTxt: { fontFamily: fonts.display, fontSize: 18 },
  nameRow:   { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  name:      { fontFamily: fonts.displaySemibold, fontSize: fontSizes.base, color: DARK },
  title:     { fontFamily: fonts.body, fontSize: fontSizes.sm, color: MUTED, marginBottom: 6 },
  avail:     { backgroundColor: '#ECFDF5', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  availTxt:  { fontFamily: fonts.bodyMedium, fontSize: 10, color: '#059669' },
  metaRow:   { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaItem:  { flexDirection: 'row', alignItems: 'center', gap: 2 },
  metaTxt:   { fontFamily: fonts.body, fontSize: fontSizes.xs, color: MUTED },
  metaDot:   { width: 3, height: 3, borderRadius: 1.5, backgroundColor: PM },
});
