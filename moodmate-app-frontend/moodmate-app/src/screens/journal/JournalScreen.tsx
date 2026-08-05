import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainTabParamList, RootStackParamList } from '@/navigation/types';
import { Skeleton } from '@/components/Skeleton';
import { useJournalStore } from '@/state/useJournalStore';
import { useAuthStore } from '@/state/useAuthStore';
import { useToast } from '@/state/useToast';
import { ApiRequestError } from '@/api/client';
import { fonts, fontSizes, radii, spacing, calm, darkPalette } from '@/theme/tokens';
import { hapticMedium, hapticLight } from '@/utils/haptics';
import { useHideTabBarOnScroll } from '@/hooks/useHideTabBarOnScroll';
import { useResolvedAppearance } from '@/hooks/useResolvedAppearance';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Journal'>,
  NativeStackScreenProps<RootStackParamList>
>;

const TODAYS_PROMPT = "What is one thing you're carrying that isn't actually yours?";

const TEMPLATES = [
  { label: 'Free write', template: 'Free write', emoji: 'journal', color: '#FFFFFF', textColor: calm.forest, bordered: true },
  { label: 'Gratitude', template: 'Gratitude jar', emoji: 'gratitude', color: calm.dustyPink, textColor: '#FFFFFF', bordered: false },
  { label: 'Exam stress', template: 'Exam stress', emoji: 'exam', color: calm.terracotta, textColor: '#FFFFFF', bordered: false },
  { label: 'Reflection', template: 'Reflection', emoji: 'reflection', color: '#FFFFFF', textColor: calm.forest, bordered: true },
] as const;

const JOURNAL_GUIDE_CARDS = [
  {
    title: 'Caring For Your Mental Health',
    sub: 'Steps you can take to support your mental wellbeing.',
    icon: 'flower-outline',
    route: 'CaringMentalHealthArticle',
    tint: '#FCE8E1',
    accent: calm.terracotta,
  },
  {
    title: 'Mental Health Questionnaires',
    sub: "How they're an important part of caring for your wellbeing.",
    icon: 'speedometer-outline',
    route: 'MentalHealthArticle',
    tint: '#E9F3F8',
    accent: calm.dustyBlue,
  },
  {
    title: 'Common Concerns About Mental Health',
    sub: 'Learn what to pay attention to and when to seek support.',
    icon: 'people-outline',
    route: 'CommonConcernsArticle',
    tint: '#FBEDE3',
    accent: calm.rust,
  },
  {
    title: 'Learning About Mental Health',
    sub: 'Understand what contributes to your mental health and why it matters.',
    icon: 'chatbubbles-outline',
    route: 'LearningMentalHealthArticle',
    tint: '#E7F8EE',
    accent: calm.primary,
  },
  {
    title: 'The Difference Between Emotion and Mood',
    sub: 'Learn about how emotions and moods can affect you.',
    icon: 'contrast-outline',
    route: 'EmotionMoodArticle',
    tint: '#ECEAF7',
    accent: calm.dustyPurple,
  },
] as const;

export function JournalScreen({ navigation }: Props) {
  const [query, setQuery] = useState('');
  const entries = useJournalStore((s) => s.entries);
  const loading = useJournalStore((s) => s.loading);
  const load = useJournalStore((s) => s.load);
  const token = useAuthStore((s) => s.token);
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const handleTabAwareScroll = useHideTabBarOnScroll();
  const { isDark } = useResolvedAppearance();

  const refresh = useCallback(() => {
    if (!token) return;
    load(token).catch((err) => toast(err instanceof ApiRequestError ? err.message : 'Could not load journal.'));
  }, [token, load, toast]);

  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));

  const filteredEntries = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter((e) => e.title.toLowerCase().includes(q) || e.body.toLowerCase().includes(q));
  }, [entries, query]);

  const handleTemplate = (t: typeof TEMPLATES[number]) => {
    hapticMedium();
    if (t.template === 'Gratitude jar') navigation.navigate('GratitudeJar');
    else navigation.navigate('JournalEntry', { template: t.template, emoji: t.emoji });
  };

  return (
    <View style={[s.root, isDark && s.rootDark]}>
      <ScrollView
        style={s.scroll}
        contentContainerStyle={[s.content, { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={handleTabAwareScroll}
      >
        <View style={s.headerRow}>
          <Text style={[s.headerTitle, isDark && s.textDark]}>Journal</Text>
          <View style={[s.privatePill, isDark && s.privatePillDark]}>
            <Ionicons name="lock-closed" size={11} color={isDark ? darkPalette.primary : calm.primary} />
            <Text style={[s.privateText, isDark && s.accentTextDark]}>Private</Text>
          </View>
        </View>

        <View style={[s.searchBar, isDark && s.surfaceDark]}>
          <Ionicons name="search-outline" size={17} color={isDark ? darkPalette.textMuted : calm.muted} />
          <TextInput
            style={[s.searchInput, isDark && s.textDark]}
            placeholder="Search your entries"
            placeholderTextColor={isDark ? darkPalette.textFaint : calm.faint}
            value={query}
            onChangeText={setQuery}
          />
        </View>

        <Pressable
          style={s.promptCard}
          onPress={() => { hapticMedium(); navigation.navigate('JournalEntry', { template: "Today's prompt", emoji: 'prompt' }); }}
        >
          <Text style={s.promptLabel}>TODAY'S PROMPT</Text>
          <Text style={s.promptText}>{TODAYS_PROMPT}</Text>
          <View style={s.promptCta}>
            <Text style={s.promptCtaText}>Start writing</Text>
          </View>
        </Pressable>

        <Text style={[s.sectionTitle, isDark && s.textDark]}>Templates</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.templateRow}>
          {TEMPLATES.map((t) => (
            <Pressable
              key={t.label}
              style={[
                s.templateChip,
                { backgroundColor: isDark && t.bordered ? darkPalette.surface : t.color },
                t.bordered && s.templateChipBordered,
                isDark && t.bordered && s.surfaceDark,
              ]}
              onPress={() => handleTemplate(t)}
            >
              <Text style={[s.templateChipText, { color: isDark && t.bordered ? darkPalette.text : t.textColor }]}>{t.label}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <View style={s.sectionRow}>
          <Text style={[s.sectionTitle, isDark && s.textDark]}>Recent entries</Text>
          <Text style={[s.sectionMeta, isDark && s.mutedTextDark]}>{entries.length} total</Text>
        </View>

        {loading && entries.length === 0 && (
          [0, 1, 2].map((i) => (
            <View key={`skel-${i}`} style={[s.entryCard, isDark && s.surfaceDark]}>
              <Skeleton width={140} height={13} />
              <Skeleton width="70%" height={11} />
            </View>
          ))
        )}

        {!loading && entries.length === 0 && (
          <View style={s.emptyWrap}>
            <Text style={[s.emptyTitle, isDark && s.textDark]}>No entries yet</Text>
            <Text style={[s.emptySub, isDark && s.mutedTextDark]}>Pick a template above to start your first journal entry.</Text>
          </View>
        )}

        {!loading && entries.length > 0 && filteredEntries.length === 0 && (
          <Text style={[s.emptySub, isDark && s.mutedTextDark]}>No entries match "{query}".</Text>
        )}

        {filteredEntries.map((entry) => (
          <Pressable
            key={entry.id}
            style={[s.entryCard, isDark && s.surfaceDark]}
            onPress={() => {
              hapticLight();
              navigation.navigate('JournalView', {
                id: entry.id, title: entry.title, body: entry.body, moodEmoji: entry.moodEmoji, date: entry.date,
              });
            }}
          >
            <View style={s.entryTop}>
              <View style={s.entryTopLeft}>
                <View style={s.entryDot} />
                <Text style={[s.entryDate, isDark && s.mutedTextDark]}>{entry.date}</Text>
              </View>
              {entry.moodEmoji && (
                <Ionicons name="heart-outline" size={14} color={calm.terracotta} />
              )}
            </View>
            <Text style={[s.entryTitle, isDark && s.textDark]} numberOfLines={1}>{entry.title}</Text>
            {!!entry.body && <Text style={[s.entryPreview, isDark && s.mutedTextDark]} numberOfLines={2}>{entry.body}</Text>}
          </Pressable>
        ))}

        <Text style={[s.sectionTitle, isDark && s.textDark]}>Journal Guides</Text>
        <View style={[s.guideIntro, isDark && s.surfaceDark]}>
          <Text style={[s.guideIntroTitle, isDark && s.textDark]}>About Journal</Text>
          <Text style={[s.guideIntroText, isDark && s.mutedTextDark]}>
            A journal can help you notice patterns in your mood, study pressure, rest, and relationships.
            Add context when you write so future you can understand what affected the day.
          </Text>
        </View>

        <View style={s.guideList}>
          {JOURNAL_GUIDE_CARDS.map((guide) => (
            <Pressable
              key={guide.title}
              style={[s.guideCard, isDark && s.surfaceDark]}
              onPress={() => {
                hapticLight();
                navigation.navigate(guide.route);
              }}
              accessibilityRole="button"
              accessibilityLabel={guide.title}
            >
              <View style={[s.guideIcon, { backgroundColor: isDark ? darkPalette.primarySoft : guide.tint }]}>
                <Ionicons name={guide.icon} size={24} color={isDark ? darkPalette.primary : guide.accent} />
              </View>
              <View style={s.guideCopy}>
                <Text style={[s.guideTitle, isDark && s.textDark]} numberOfLines={2}>{guide.title}</Text>
                <Text style={[s.guideSub, isDark && s.mutedTextDark]} numberOfLines={2}>{guide.sub}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={isDark ? darkPalette.textFaint : calm.faint} />
            </Pressable>
          ))}
        </View>
      </ScrollView>

      <Pressable
        style={[s.fab, { bottom: insets.bottom + 72 }]}
        onPress={() => { hapticMedium(); navigation.navigate('JournalEntry', { template: 'Free write', emoji: 'journal' }); }}
      >
        <Ionicons name="pencil" size={22} color="#FFFFFF" />
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: calm.bg },
  rootDark: { backgroundColor: darkPalette.bg },
  surfaceDark: { backgroundColor: darkPalette.surface, borderColor: darkPalette.border },
  textDark: { color: darkPalette.text },
  mutedTextDark: { color: darkPalette.textMuted },
  accentTextDark: { color: darkPalette.primary },
  scroll: { flex: 1 },
  content: { paddingHorizontal: spacing.xl, gap: spacing.md },

  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontFamily: fonts.displayExtraBold, fontSize: fontSizes.xxl + 4, color: calm.forest, letterSpacing: -0.45 },
  privatePill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: calm.mintBg, borderRadius: radii.pill, paddingHorizontal: 12, paddingVertical: 8 },
  privatePillDark: { backgroundColor: darkPalette.primarySoft, borderWidth: 1, borderColor: darkPalette.border },
  privateText: { fontFamily: fonts.bodyBold, fontSize: fontSizes.xs + 1, color: calm.primary },

  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: calm.border,
    borderRadius: radii.pill, paddingHorizontal: spacing.lg, paddingVertical: 13,
  },
  searchInput: { flex: 1, fontFamily: fonts.body, fontSize: fontSizes.base - 1, color: calm.ink },

  promptCard: { backgroundColor: calm.forest, borderRadius: radii.card + 2, padding: spacing.lg, overflow: 'hidden', gap: spacing.sm },
  promptLabel: { fontFamily: fonts.bodyBold, fontSize: fontSizes.xs, color: calm.mint, letterSpacing: 0.6 },
  promptText: { fontFamily: fonts.bodyBold, fontSize: fontSizes.base + 1, color: '#FFFFFF', lineHeight: 24 },
  promptCta: { backgroundColor: calm.primary, borderRadius: radii.pill, paddingHorizontal: 18, paddingVertical: 11, alignSelf: 'flex-start', marginTop: spacing.xs },
  promptCtaText: { fontFamily: fonts.bodyBold, fontSize: fontSizes.sm + 1, color: '#FFFFFF' },

  sectionTitle: { fontFamily: fonts.bodyBold, fontSize: fontSizes.base + 1, color: calm.forest, marginTop: spacing.xs },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginTop: spacing.md },
  sectionMeta: { fontFamily: fonts.body, fontSize: fontSizes.sm, color: calm.muted },

  templateRow: { gap: spacing.sm, paddingBottom: 4 },
  templateChip: { borderRadius: radii.pill, paddingHorizontal: 18, paddingVertical: 11 },
  templateChipBordered: { borderWidth: 1, borderColor: calm.border },
  templateChipText: { fontFamily: fonts.bodyBold, fontSize: fontSizes.sm + 1 },

  entryCard: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: calm.border, borderRadius: radii.lg + 2, padding: spacing.lg, gap: 6 },
  entryTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  entryTopLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  entryDot: { width: 9, height: 9, borderRadius: 4.5, backgroundColor: calm.terracotta },
  entryDate: { fontFamily: fonts.body, fontSize: fontSizes.sm - 1, color: calm.muted },
  entryTitle: { fontFamily: fonts.bodyBold, fontSize: fontSizes.md - 1, color: calm.forest },
  entryPreview: { fontFamily: fonts.body, fontSize: fontSizes.sm, color: calm.muted, lineHeight: 20 },

  emptyWrap: { alignItems: 'center', paddingVertical: spacing.xxxl, gap: spacing.sm },
  emptyTitle: { fontFamily: fonts.bodyBold, fontSize: fontSizes.md, color: calm.forest },
  emptySub: { fontFamily: fonts.body, fontSize: fontSizes.sm, color: calm.muted, textAlign: 'center', paddingHorizontal: spacing.xl, lineHeight: 20 },

  guideIntro: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: calm.border,
    borderRadius: radii.lg + 2,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  guideIntroTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.md,
    color: calm.forest,
  },
  guideIntroText: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: calm.muted,
    lineHeight: 20,
  },
  guideList: {
    gap: spacing.md,
  },
  guideCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: calm.border,
    borderRadius: radii.lg + 2,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  guideIcon: {
    width: 50,
    height: 50,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guideCopy: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  guideTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.md,
    color: calm.forest,
    lineHeight: 21,
  },
  guideSub: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: calm.muted,
    lineHeight: 19,
  },

  fab: {
    position: 'absolute', right: spacing.xl,
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: calm.primary,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: calm.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 6,
  },
});
