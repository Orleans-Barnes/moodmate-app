/**
 * ResourcesScreen — Wellness Library
 * Curated articles, tips, and guides for student mental wellness.
 * Opens articles in the device browser via Linking.
 */

import React, { useState, useMemo } from 'react';
import { useNavigation } from '@react-navigation/native';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  Linking, Alert, TextInput, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, fontSizes, radii, spacing } from '@/theme/tokens';

// ── Article data ────────────────────────────────────────────────────────────

interface Article {
  id: string;
  title: string;
  summary: string;
  category: string;
  readTime: string;
  url: string;
  featured?: boolean;
}

const CATEGORIES = ['All', 'Mindfulness', 'Sleep', 'Anxiety', 'Focus', 'Self-Care', 'Social'] as const;
type Category = typeof CATEGORIES[number];

const CAT_COLORS: Record<string, { from: string; to: string; icon: keyof typeof import('@expo/vector-icons').Ionicons.glyphMap }> = {
  Mindfulness: { from: '#7B3CC9', to: '#C84895', icon: 'flower-outline' },
  Sleep:       { from: '#2D4BCC', to: '#5C8AE6', icon: 'moon-outline' },
  Anxiety:     { from: '#5F9E7C', to: '#8FC4A4', icon: 'leaf-outline' },
  Focus:       { from: '#E8861A', to: '#FFC857', icon: 'flash-outline' },
  'Self-Care': { from: '#C84895', to: '#FF6F4D', icon: 'heart-outline' },
  Social:      { from: '#3D6FD4', to: '#5C8AE6', icon: 'people-outline' },
};

const ARTICLES: Article[] = [
  // Mindfulness
  {
    id: '1', title: '5-Minute Mindfulness Practices for Busy Students',
    summary: 'Quick techniques you can do between classes to reset your nervous system and reduce overwhelm.',
    category: 'Mindfulness', readTime: '4 min', featured: true,
    url: 'https://www.headspace.com/articles/mindfulness-for-students',
  },
  {
    id: '2', title: 'Box Breathing: The Navy SEAL Technique for Instant Calm',
    summary: 'A simple 4-4-4-4 breathing pattern scientifically proven to lower cortisol in minutes.',
    category: 'Mindfulness', readTime: '3 min',
    url: 'https://www.healthline.com/health/box-breathing',
  },
  {
    id: '3', title: 'Body Scan Meditation: How to Release Tension You Didn\'t Know You Had',
    summary: 'A progressive relaxation technique that helps you reconnect with your body and release stored stress.',
    category: 'Mindfulness', readTime: '6 min',
    url: 'https://www.mindful.org/body-scan-meditation/',
  },

  // Sleep
  {
    id: '4', title: 'Why University Students Are the Most Sleep-Deprived Group',
    summary: 'Research shows 60% of students get less than 7 hours of sleep. Here\'s what to do about it.',
    category: 'Sleep', readTime: '5 min', featured: true,
    url: 'https://www.sleepfoundation.org/sleep-hygiene/college-students-and-sleep',
  },
  {
    id: '5', title: 'The 10-3-2-1-0 Rule: A Sleep Schedule That Actually Works',
    summary: 'Stop caffeine, food, work, screens, and phone at specific intervals before bed for perfect sleep.',
    category: 'Sleep', readTime: '3 min',
    url: 'https://www.sleepfoundation.org/sleep-hygiene',
  },
  {
    id: '6', title: 'How to Fix Your Sleep Schedule Before Exams',
    summary: 'Circadian rhythm hacks to get your sleep back on track in just 3 days.',
    category: 'Sleep', readTime: '5 min',
    url: 'https://www.health.harvard.edu/staying-healthy/improving-sleep-a-guide-to-a-good-nights-rest',
  },

  // Anxiety
  {
    id: '7', title: 'Understanding Exam Anxiety: Why It Happens and How to Beat It',
    summary: 'The science behind test anxiety and evidence-based strategies to turn nerves into performance fuel.',
    category: 'Anxiety', readTime: '7 min', featured: true,
    url: 'https://www.verywellmind.com/test-anxiety-causes-and-tips-for-coping-20621',
  },
  {
    id: '8', title: 'The 5-4-3-2-1 Grounding Technique for Panic',
    summary: 'Anchor yourself in the present moment using your five senses to interrupt an anxiety spiral.',
    category: 'Anxiety', readTime: '3 min',
    url: 'https://www.healthline.com/health/grounding-techniques',
  },
  {
    id: '9', title: 'Social Anxiety at University: You\'re Not Alone',
    summary: 'Practical CBT-based strategies for navigating social situations when anxiety makes them hard.',
    category: 'Anxiety', readTime: '6 min',
    url: 'https://www.mind.org.uk/information-support/types-of-mental-health-problems/anxiety-and-panic-attacks/self-care-for-anxiety/',
  },

  // Focus
  {
    id: '10', title: 'Pomodoro 2.0: How Top Students Use Time Blocks',
    summary: 'The classic 25/5 technique upgraded with research on optimal study-to-break ratios.',
    category: 'Focus', readTime: '4 min', featured: true,
    url: 'https://www.psychologytoday.com/us/blog/the-peak-performing-student/201609/7-ways-to-focus-better-when-studying',
  },
  {
    id: '11', title: 'Digital Minimalism for Students: Reclaim Your Attention',
    summary: 'How constant notifications fragment your focus and simple systems to protect deep work time.',
    category: 'Focus', readTime: '5 min',
    url: 'https://www.verywellmind.com/how-to-minimize-distractions-while-studying-3144676',
  },
  {
    id: '12', title: 'The Science of Background Music and Studying',
    summary: 'Does music help or hurt? Research reveals which sounds boost concentration and which derail it.',
    category: 'Focus', readTime: '4 min',
    url: 'https://www.sciencedaily.com/releases/2019/07/190708103648.htm',
  },

  // Self-Care
  {
    id: '13', title: 'The Student Self-Care Checklist You\'ll Actually Use',
    summary: 'A realistic, evidence-backed daily routine for when you\'re busy, broke, and overwhelmed.',
    category: 'Self-Care', readTime: '4 min',
    url: 'https://www.verywellmind.com/self-care-strategies-overall-stress-reduction-3144729',
  },
  {
    id: '14', title: 'How Exercise Literally Changes Your Brain Chemistry',
    summary: 'Even 20 minutes of walking raises dopamine, serotonin, and BDNF — nature\'s antidepressants.',
    category: 'Self-Care', readTime: '5 min',
    url: 'https://www.health.harvard.edu/mind-and-mood/exercise-is-an-all-natural-treatment-to-fight-depression',
  },
  {
    id: '15', title: 'Journaling for Mental Health: The Research Behind It',
    summary: 'Studies show 20 minutes of expressive writing lowers anxiety and improves working memory.',
    category: 'Self-Care', readTime: '5 min',
    url: 'https://www.health.harvard.edu/blog/journaling-to-cope-with-anxiety-2018052613807',
  },

  // Social
  {
    id: '16', title: 'Loneliness at University: The Hidden Epidemic',
    summary: '64% of students report significant loneliness. Practical steps to build real connection on campus.',
    category: 'Social', readTime: '6 min',
    url: 'https://www.psychologytoday.com/us/basics/loneliness',
  },
  {
    id: '17', title: 'Setting Boundaries Without Guilt',
    summary: 'How to protect your energy and mental health while maintaining meaningful relationships.',
    category: 'Social', readTime: '5 min',
    url: 'https://www.verywellmind.com/how-to-set-healthy-boundaries-4428984',
  },
  {
    id: '18', title: 'Toxic Friendships: Signs and How to Navigate Them',
    summary: 'Red flags that a relationship is draining rather than energising, and what to do about it.',
    category: 'Social', readTime: '5 min',
    url: 'https://www.psychologytoday.com/us/blog/the-friendship-doctor/201012/are-you-in-a-toxic-friendship',
  },
];

// ── Components ─────────────────────────────────────────────────────────────

function CategoryPill({ label, active, onPress }:
  { label: string; active: boolean; onPress: () => void }) {
  const cat = CAT_COLORS[label];
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.75} style={{ marginRight: 8 }}>
      {active && cat ? (
        <LinearGradient colors={[cat.from, cat.to]}
          style={s.pillActive} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <Text style={s.pillTxtActive}>{label}</Text>
        </LinearGradient>
      ) : (
        <View style={[s.pillInactive, active && s.pillActiveAll]}>
          <Text style={[s.pillTxtInactive, active && s.pillTxtActiveAll]}>{label}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

function FeaturedCard({ article }: { article: Article }) {
  const cat = CAT_COLORS[article.category] ?? { from: colors.lavender, to: colors.coral, icon: 'document-outline' };
  const openUrl = () => Linking.openURL(article.url).catch(() =>
    Alert.alert('Could not open link', 'Check your internet connection.'));
  return (
    <TouchableOpacity onPress={openUrl} activeOpacity={0.88} style={s.featuredCard}>
      <LinearGradient colors={[cat.from + 'DD', cat.to + 'BB']}
        style={s.featuredGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <View style={s.featuredTop}>
          <View style={s.catTag}>
            <Ionicons name={cat.icon as any} size={11} color="#fff" />
            <Text style={s.catTagTxt}>{article.category}</Text>
          </View>
          <Text style={s.featuredReadTime}>{article.readTime} read</Text>
        </View>
        <Text style={s.featuredTitle}>{article.title}</Text>
        <Text style={s.featuredSummary} numberOfLines={2}>{article.summary}</Text>
        <View style={s.featuredFooter}>
          <Text style={s.readNow}>Read article</Text>
          <Ionicons name="arrow-forward" size={14} color="rgba(255,255,255,0.8)" />
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

function ArticleCard({ article }: { article: Article }) {
  const cat = CAT_COLORS[article.category] ?? { from: colors.lavender, to: colors.coral, icon: 'document-outline' };
  const openUrl = () => Linking.openURL(article.url).catch(() =>
    Alert.alert('Could not open link', 'Check your internet connection.'));
  return (
    <TouchableOpacity onPress={openUrl} activeOpacity={0.80} style={s.articleCard}>
      <LinearGradient colors={[cat.from + '30', cat.to + '18']}
        style={s.articleAccent} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <Ionicons name={cat.icon as any} size={18} color={cat.from} />
      </LinearGradient>
      <View style={s.articleBody}>
        <View style={s.articleMeta}>
          <Text style={[s.articleCat, { color: cat.from }]}>{article.category}</Text>
          <Text style={s.articleTime}>{article.readTime} read</Text>
        </View>
        <Text style={s.articleTitle} numberOfLines={2}>{article.title}</Text>
        <Text style={s.articleSummary} numberOfLines={2}>{article.summary}</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.inkFaint} style={{ alignSelf: 'center' }} />
    </TouchableOpacity>
  );
}

// ── Screen ─────────────────────────────────────────────────────────────────
export function ResourcesScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [active, setActive] = useState<Category>('All');
  const [query, setQuery]   = useState('');

  const filtered = useMemo(() => {
    let list = ARTICLES;
    if (active !== 'All') list = list.filter(a => a.category === active);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(a =>
        a.title.toLowerCase().includes(q) || a.summary.toLowerCase().includes(q));
    }
    return list;
  }, [active, query]);

  const featured = filtered.filter(a => a.featured);
  const rest     = filtered.filter(a => !a.featured || active !== 'All');

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <LinearGradient colors={['#3B1F7A','#6B2FA0','#C84895']}
        style={s.header} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn} hitSlop={12}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Wellness Library</Text>
        <Text style={s.headerSub}>Curated resources for student wellbeing</Text>

        {/* Search */}
        <View style={s.searchWrap}>
          <Ionicons name="search" size={16} color="rgba(255,255,255,0.5)" />
          <TextInput
            style={s.searchInput}
            placeholder="Search articles…"
            placeholderTextColor="rgba(255,255,255,0.4)"
            value={query} onChangeText={setQuery}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')} hitSlop={8}>
              <Ionicons name="close-circle" size={16} color="rgba(255,255,255,0.5)" />
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}>
        {/* Category pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.catRow}>
          {CATEGORIES.map(c => (
            <CategoryPill key={c} label={c} active={active === c}
              onPress={() => setActive(c)} />
          ))}
        </ScrollView>

        {/* Featured articles */}
        {featured.length > 0 && active === 'All' && (
          <>
            <Text style={s.sectionLabel}>Featured</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}
              contentContainerStyle={s.featuredRow}>
              {featured.map(a => <FeaturedCard key={a.id} article={a} />)}
            </ScrollView>
          </>
        )}

        {/* Article list */}
        <Text style={s.sectionLabel}>
          {active === 'All' ? 'All Articles' : active} · {filtered.length}
        </Text>
        <View style={s.articleList}>
          {(active === 'All' ? rest : filtered).map(a => (
            <ArticleCard key={a.id} article={a} />
          ))}
          {filtered.length === 0 && (
            <View style={s.emptySearch}>
              <Ionicons name="search-outline" size={32} color={colors.inkFaint} />
              <Text style={s.emptyTxt}>No articles found for "{query}"</Text>
            </View>
          )}
        </View>

        {/* Footer note */}
        <Text style={s.footerNote}>
          Articles open in your browser · Sources: Headspace, Verywell Mind,
          Mind.org, Sleep Foundation, Harvard Health
        </Text>
      </ScrollView>
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  backBtn: { marginBottom: spacing.xs },

  header: { paddingHorizontal: spacing.xl, paddingTop: 20, paddingBottom: 24 },
  headerTitle: { fontFamily: fonts.display, fontSize: fontSizes.xxl + 2, color: '#fff', marginBottom: 4 },
  headerSub:   { fontFamily: fonts.body, fontSize: fontSizes.base, color: 'rgba(255,255,255,0.7)', marginBottom: 16 },

  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: radii.pill, paddingHorizontal: 14, paddingVertical: 10,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.20)',
  },
  searchInput: {
    flex: 1, fontFamily: fonts.body, fontSize: fontSizes.base, color: '#fff',
    padding: 0, margin: 0,
  },

  catRow: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  pillActive:      { borderRadius: radii.pill, paddingHorizontal: 14, paddingVertical: 7 },
  pillInactive:    { borderRadius: radii.pill, paddingHorizontal: 14, paddingVertical: 7,
                     backgroundColor: '#F0EEF4', borderWidth: 1, borderColor: '#E2DEE8' },
  pillActiveAll:   { backgroundColor: colors.ink, borderColor: colors.ink },
  pillTxtActive:   { fontFamily: fonts.bodyBold, fontSize: fontSizes.sm, color: '#fff' },
  pillTxtInactive: { fontFamily: fonts.bodyMedium, fontSize: fontSizes.sm, color: colors.inkSoft },
  pillTxtActiveAll:{ color: '#fff' },

  sectionLabel: {
    fontFamily: fonts.displaySemibold, fontSize: fontSizes.lg,
    color: colors.ink, marginHorizontal: spacing.lg, marginTop: 4, marginBottom: 12,
  },

  // Featured
  featuredRow: { paddingLeft: spacing.lg, paddingRight: spacing.lg, gap: 14 },
  featuredCard: { width: 280, borderRadius: radii.xl, overflow: 'hidden', marginBottom: 4,
    shadowColor: 'rgba(100,50,200,0.30)', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1, shadowRadius: 18, elevation: 8 },
  featuredGrad: { padding: spacing.xl },
  featuredTop:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  catTag:       { flexDirection: 'row', alignItems: 'center', gap: 4,
                  backgroundColor: 'rgba(255,255,255,0.20)', borderRadius: radii.pill,
                  paddingHorizontal: 8, paddingVertical: 3 },
  catTagTxt:    { fontFamily: fonts.bodyBold, fontSize: 10, color: '#fff' },
  featuredReadTime: { fontFamily: fonts.body, fontSize: 10, color: 'rgba(255,255,255,0.65)' },
  featuredTitle:    { fontFamily: fonts.displaySemibold, fontSize: fontSizes.lg, color: '#fff',
                      marginBottom: 8, lineHeight: 24 },
  featuredSummary:  { fontFamily: fonts.body, fontSize: fontSizes.sm, color: 'rgba(255,255,255,0.75)',
                      lineHeight: 19, marginBottom: 16 },
  featuredFooter:   { flexDirection: 'row', alignItems: 'center', gap: 4 },
  readNow:          { fontFamily: fonts.bodyBold, fontSize: fontSizes.sm, color: 'rgba(255,255,255,0.85)' },

  // Article list
  articleList: { marginHorizontal: spacing.lg, gap: 10, marginBottom: 8 },
  articleCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    backgroundColor: '#fff', borderRadius: radii.lg, padding: spacing.md,
    shadowColor: 'rgba(43,37,48,0.10)', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1, shadowRadius: 10, elevation: 4,
  },
  articleAccent: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  articleBody:   { flex: 1 },
  articleMeta:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  articleCat:    { fontFamily: fonts.bodyBold, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  articleTime:   { fontFamily: fonts.body, fontSize: 10, color: colors.inkFaint },
  articleTitle:  { fontFamily: fonts.bodyBold, fontSize: fontSizes.base, color: colors.ink,
                   lineHeight: 20, marginBottom: 3 },
  articleSummary:{ fontFamily: fonts.body, fontSize: fontSizes.sm, color: colors.inkSoft, lineHeight: 18 },

  // Empty search
  emptySearch: { alignItems: 'center', paddingVertical: 40, gap: 12 },
  emptyTxt:    { fontFamily: fonts.body, fontSize: fontSizes.base, color: colors.inkFaint, textAlign: 'center' },

  footerNote: {
    fontFamily: fonts.body, fontSize: fontSizes.xs, color: colors.inkFaint,
    textAlign: 'center', marginHorizontal: spacing.xl, marginTop: 16, lineHeight: 17,
  },
});
