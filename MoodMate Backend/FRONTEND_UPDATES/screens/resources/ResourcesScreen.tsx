import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  TextInput, Animated, Dimensions, StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { fonts, fontSizes, spacing } from '@/theme/tokens';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: W } = Dimensions.get('window');

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

const CATS = ['All', 'Articles', 'Podcasts', 'Workshops'];

const FEATURED = [
  { id: 'f1', title: '5 Ways to Manage Academic Stress', duration: '6 min read', tag: 'Mental Health', xp: 15 },
  { id: 'f2', title: 'Understanding Anxiety in Students', duration: '8 min read', tag: 'Anxiety', xp: 15 },
];

const ARTICLES = [
  { id: 'a1', title: 'The Power of Journaling for Mental Clarity', time: '4 min', tag: 'Journaling' },
  { id: 'a2', title: 'Building Resilience Through Daily Habits', time: '5 min', tag: 'Habits' },
  { id: 'a3', title: 'Sleep and Your Mental Health: The Connection', time: '7 min', tag: 'Sleep' },
  { id: 'a4', title: 'Mindfulness Practices for Busy Students', time: '3 min', tag: 'Mindfulness' },
];

const WORKSHOPS = [
  { id: 'w1', title: 'CBT Skills for Everyday Life', date: 'Fri 18 Jul', time: '3:00 PM', spots: 8 },
  { id: 'w2', title: 'Stress Management Masterclass', date: 'Mon 21 Jul', time: '5:00 PM', spots: 4 },
];

const PODCASTS = [
  { id: 'p1', title: 'The Mindful Student', ep: 'Ep 12 · Dealing with Imposter Syndrome', duration: '28 min' },
  { id: 'p2', title: 'Therapy Talks', ep: 'Ep 7 · Breaking the Stigma Around Mental Health', duration: '34 min' },
];

const KEY_XP      = '@resources_xp';
const KEY_OFFLINE = '@resources_offline';

export function ResourcesScreen() {
  const nav    = useNavigation<any>();
  const insets = useSafeAreaInsets();

  const [cat, setCat] = useState('All');
  const [search, setSearch] = useState('');
  const [xp, setXp] = useState(0);
  const [offline, setOffline] = useState<Set<string>>(new Set());
  const [searchFocus, setSearchFocus] = useState(false);

  const headerOp = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(headerOp, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    AsyncStorage.getItem(KEY_XP).then(v => v && setXp(+v));
    AsyncStorage.getItem(KEY_OFFLINE).then(v => v && setOffline(new Set(JSON.parse(v))));
  }, []);

  const addXp = async (n: number) => {
    const next = xp + n;
    setXp(next);
    await AsyncStorage.setItem(KEY_XP, String(next));
  };

  const toggleOffline = async (id: string) => {
    const next = new Set(offline);
    next.has(id) ? next.delete(id) : next.add(id);
    setOffline(next);
    await AsyncStorage.setItem(KEY_OFFLINE, JSON.stringify([...next]));
  };

  const level = xp < 100 ? 'Seedling' : xp < 300 ? 'Sprout' : xp < 600 ? 'Bloom' : 'Forest';

  return (
    <View style={[s.root, { backgroundColor: BG }]}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <LinearGradient colors={GRAD_H} style={[s.header, { paddingTop: insets.top + 16 }]}>
        <Animated.View style={{ opacity: headerOp }}>
          <View style={s.headerTop}>
            <View>
              <Text style={s.headerTitle}>Wellness Library</Text>
              <Text style={s.headerSub}>Grow your knowledge, grow yourself</Text>
            </View>
            <View style={s.xpBadge}>
              <Ionicons name="leaf-outline" size={13} color="#86EFAC" />
              <Text style={s.xpTxt}>{level}</Text>
            </View>
          </View>

          {/* Search */}
          <View style={[s.searchBar, searchFocus && s.searchFocused]}>
            <Ionicons name="search-outline" size={18} color={searchFocus ? PURPLE : MUTED} />
            <TextInput
              style={s.searchInput}
              placeholder="Search articles, podcasts..."
              placeholderTextColor={PM}
              value={search}
              onChangeText={setSearch}
              onFocus={() => setSearchFocus(true)}
              onBlur={() => setSearchFocus(false)}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <Ionicons name="close-circle" size={18} color={MUTED} />
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>
      </LinearGradient>

      {/* Category pills */}
      <View style={s.catWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.cats}>
          {CATS.map(c => (
            <TouchableOpacity key={c} onPress={() => setCat(c)}>
              {c === cat ? (
                <LinearGradient colors={['#7C3AED', '#9333EA']} style={s.catActive}>
                  <Text style={[s.catTxt, { color: WHITE }]}>{c}</Text>
                </LinearGradient>
              ) : (
                <View style={s.catInactive}>
                  <Text style={[s.catTxt, { color: MUTED }]}>{c}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 100 }]}>

        {/* Featured */}
        {(cat === 'All' || cat === 'Articles') && (
          <>
            <SectionHdr icon="star-outline" title="Featured" />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 12, paddingBottom: 4 }}>
              {FEATURED.map(f => (
                <TouchableOpacity key={f.id} activeOpacity={0.85} onPress={() => addXp(f.xp)} style={s.featCard}>
                  <LinearGradient colors={['#5B21B6', '#7C3AED', '#9333EA']} style={s.featGrad}>
                    <View style={s.featTag}>
                      <Text style={s.featTagTxt}>{f.tag}</Text>
                    </View>
                    <View style={{ flex: 1, justifyContent: 'flex-end' }}>
                      <Text style={s.featTitle}>{f.title}</Text>
                      <View style={s.featMeta}>
                        <Ionicons name="time-outline" size={12} color="rgba(255,255,255,0.7)" />
                        <Text style={s.featMetaTxt}>{f.duration}</Text>
                        <View style={s.featXp}>
                          <Text style={s.featXpTxt}>+{f.xp} XP</Text>
                        </View>
                      </View>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </>
        )}

        {/* Articles */}
        {(cat === 'All' || cat === 'Articles') && (
          <>
            <SectionHdr icon="document-text-outline" title="Articles" count={ARTICLES.length} />
            {ARTICLES.map(a => (
              <TouchableOpacity key={a.id} style={[s.articleCard, CARD_SH]} onPress={() => addXp(15)}>
                <View style={s.articleIcon}>
                  <Ionicons name="document-text-outline" size={22} color={PURPLE} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.articleTitle}>{a.title}</Text>
                  <View style={s.articleMeta}>
                    <View style={s.tagPill}><Text style={s.tagTxt}>{a.tag}</Text></View>
                    <Text style={s.articleTime}>{a.time} read</Text>
                  </View>
                </View>
                <TouchableOpacity onPress={() => toggleOffline(a.id)}>
                  <Ionicons
                    name={offline.has(a.id) ? 'checkmark-circle' : 'download-outline'}
                    size={22}
                    color={offline.has(a.id) ? '#52B788' : PM}
                  />
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </>
        )}

        {/* Workshops */}
        {(cat === 'All' || cat === 'Workshops') && (
          <>
            <SectionHdr icon="calendar-outline" title="Workshops" />
            {WORKSHOPS.map(w => (
              <View key={w.id} style={[s.workshopCard, CARD_SH]}>
                <View style={s.workshopLeft}>
                  <View style={s.dateBadge}>
                    <Text style={s.dateTxt}>{w.date.split(' ')[1]}</Text>
                    <Text style={s.dateMonth}>{w.date.split(' ').slice(2).join(' ')}</Text>
                  </View>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.workshopTitle}>{w.title}</Text>
                  <View style={s.workshopMeta}>
                    <Ionicons name="time-outline" size={12} color={MUTED} />
                    <Text style={s.workshopTime}>{w.time}</Text>
                    <View style={[s.spotsPill, w.spots <= 5 && s.spotsPillUrgent]}>
                      <Text style={[s.spotsTxt, w.spots <= 5 && { color: '#EF4444' }]}>{w.spots} spots left</Text>
                    </View>
                  </View>
                </View>
                <TouchableOpacity style={s.joinBtn}>
                  <LinearGradient colors={['#7C3AED', '#9333EA']} style={s.joinGrad}>
                    <Text style={s.joinTxt}>Join</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            ))}
          </>
        )}

        {/* Podcasts */}
        {(cat === 'All' || cat === 'Podcasts') && (
          <>
            <SectionHdr icon="mic-outline" title="Podcasts" />
            {PODCASTS.map(p => (
              <TouchableOpacity key={p.id} style={[s.podCard, CARD_SH]}>
                <View style={s.podIcon}>
                  <Ionicons name="mic" size={22} color={PURPLE} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.podTitle}>{p.title}</Text>
                  <Text style={s.podEp}>{p.ep}</Text>
                  <Text style={s.podDur}>{p.duration}</Text>
                </View>
                <View style={s.playBtn}>
                  <Ionicons name="play" size={18} color={WHITE} />
                </View>
              </TouchableOpacity>
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}

function SectionHdr({ icon, title, count }: { icon: any; title: string; count?: number }) {
  return (
    <View style={sh.row}>
      <View style={sh.iconBox}><Ionicons name={icon} size={15} color={PURPLE} /></View>
      <Text style={sh.title}>{title}</Text>
      {count != null && <View style={sh.countBadge}><Text style={sh.countTxt}>{count}</Text></View>}
    </View>
  );
}
const sh = StyleSheet.create({
  row:       { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, marginTop: 20, marginBottom: 10 },
  iconBox:   { width: 28, height: 28, borderRadius: 8, backgroundColor: PL, alignItems: 'center', justifyContent: 'center' },
  title:     { fontFamily: fonts.displaySemibold, fontSize: fontSizes.md, color: DARK, flex: 1 },
  countBadge:{ backgroundColor: PM, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  countTxt:  { fontFamily: fonts.bodyBold, fontSize: fontSizes.xs, color: WHITE },
});

const s = StyleSheet.create({
  root:    { flex: 1 },
  header:  { paddingHorizontal: 20, paddingBottom: 20 },
  headerTop:   { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 },
  headerTitle: { fontFamily: fonts.display, fontSize: fontSizes.xl, color: WHITE, marginBottom: 4 },
  headerSub:   { fontFamily: fonts.body, fontSize: fontSizes.sm, color: 'rgba(255,255,255,0.65)' },
  xpBadge:     { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.14)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  xpTxt:       { fontFamily: fonts.bodyBold, fontSize: fontSizes.xs, color: '#86EFAC' },

  searchBar:    { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: WHITE, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1.5, borderColor: 'transparent' },
  searchFocused:{ borderColor: PM },
  searchInput:  { flex: 1, fontFamily: fonts.body, fontSize: fontSizes.base, color: DARK },

  catWrap: { backgroundColor: BG },
  cats:    { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  catActive:   { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  catInactive: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: WHITE, borderWidth: 1, borderColor: PL },
  catTxt:      { fontFamily: fonts.bodyBold, fontSize: fontSizes.sm },

  scroll: { paddingBottom: 24 },

  featCard: { width: 240, height: 150, borderRadius: 18, overflow: 'hidden' },
  featGrad: { flex: 1, padding: 16 },
  featTag:  { backgroundColor: 'rgba(255,255,255,0.2)', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  featTagTxt:  { fontFamily: fonts.bodyBold, fontSize: fontSizes.xs, color: WHITE },
  featTitle:   { fontFamily: fonts.displaySemibold, fontSize: fontSizes.base, color: WHITE, marginBottom: 8, lineHeight: 20 },
  featMeta:    { flexDirection: 'row', alignItems: 'center', gap: 6 },
  featMetaTxt: { fontFamily: fonts.body, fontSize: fontSizes.xs, color: 'rgba(255,255,255,0.7)', flex: 1 },
  featXp:      { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  featXpTxt:   { fontFamily: fonts.bodyBold, fontSize: 10, color: '#FCD34D' },

  articleCard:  { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: WHITE, marginHorizontal: 16, marginBottom: 10, borderRadius: 16, padding: 14 },
  articleIcon:  { width: 44, height: 44, borderRadius: 13, backgroundColor: PL, alignItems: 'center', justifyContent: 'center' },
  articleTitle: { fontFamily: fonts.bodyBold, fontSize: fontSizes.base, color: DARK, marginBottom: 6, lineHeight: 20 },
  articleMeta:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  tagPill:      { backgroundColor: PL, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  tagTxt:       { fontFamily: fonts.bodyBold, fontSize: 10, color: PURPLE },
  articleTime:  { fontFamily: fonts.body, fontSize: fontSizes.xs, color: MUTED },

  workshopCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: WHITE, marginHorizontal: 16, marginBottom: 10, borderRadius: 16, padding: 14 },
  workshopLeft: {},
  dateBadge:    { width: 44, alignItems: 'center', backgroundColor: PL, borderRadius: 10, paddingVertical: 6 },
  dateTxt:      { fontFamily: fonts.display, fontSize: fontSizes.lg, color: PURPLE },
  dateMonth:    { fontFamily: fonts.body, fontSize: 9, color: MUTED },
  workshopTitle:{ fontFamily: fonts.bodyBold, fontSize: fontSizes.base, color: DARK, marginBottom: 6 },
  workshopMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  workshopTime: { fontFamily: fonts.body, fontSize: fontSizes.xs, color: MUTED, flex: 1 },
  spotsPill:    { backgroundColor: PL, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  spotsPillUrgent:{ backgroundColor: '#FEE2E2' },
  spotsTxt:     { fontFamily: fonts.bodyBold, fontSize: 10, color: MUTED },
  joinBtn:      {},
  joinGrad:     { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  joinTxt:      { fontFamily: fonts.bodyBold, fontSize: fontSizes.sm, color: WHITE },

  podCard:  { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: WHITE, marginHorizontal: 16, marginBottom: 10, borderRadius: 16, padding: 14 },
  podIcon:  { width: 52, height: 52, borderRadius: 16, backgroundColor: PL, alignItems: 'center', justifyContent: 'center' },
  podTitle: { fontFamily: fonts.bodyBold, fontSize: fontSizes.base, color: DARK, marginBottom: 3 },
  podEp:    { fontFamily: fonts.body, fontSize: fontSizes.xs, color: MUTED, marginBottom: 3 },
  podDur:   { fontFamily: fonts.body, fontSize: fontSizes.xs, color: PM },
  playBtn:  { width: 40, height: 40, borderRadius: 20, backgroundColor: PURPLE, alignItems: 'center', justifyContent: 'center' },
});
