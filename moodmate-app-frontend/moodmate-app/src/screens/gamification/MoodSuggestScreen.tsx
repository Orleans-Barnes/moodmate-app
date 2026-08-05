/**
 * MoodSuggestScreen — Calm Forest — shown immediately after the MoodGate check-in.
 * Presents 3 personalised activity suggestions based on the mood score (1-5).
 */
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { hapticLight } from '@/utils/haptics';
import { fonts, fontSizes, spacing, radii, calm } from '@/theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'MoodSuggest'>;

type Suggestion = { key: string; icon: keyof typeof Ionicons.glyphMap; label: string; sub: string; color: string; params?: Record<string, unknown> };

const LOW_SUGGESTIONS: Suggestion[] = [
  { key: 'Grounding', icon: 'leaf-outline', label: 'Grounding Exercise', sub: 'Anchor yourself with the 5-senses technique', color: calm.primary },
  { key: 'BreathingSession', icon: 'water-outline', label: 'Box Breathing', sub: 'Slow your nervous system in 4 minutes', color: calm.dustyBlue, params: { session: 'Box Breathing', duration: 240 } },
  { key: 'Support', icon: 'chatbubbles-outline', label: 'Talk to Someone', sub: 'Connect with a peer counsellor now', color: calm.dustyPurple },
];

const MID_SUGGESTIONS: Suggestion[] = [
  { key: 'BubblePop', icon: 'ellipse-outline', label: 'Bubble Pop', sub: 'A quick mindful distraction', color: calm.dustyBlue },
  { key: 'JournalEntry', icon: 'book-outline', label: 'Write in Journal', sub: 'Process your thoughts on paper', color: calm.mint, params: { template: 'Free write', emoji: '✍️' } },
  { key: 'Explore', icon: 'musical-notes-outline', label: 'Explore Sounds', sub: 'Find your calm with ambient audio', color: calm.dustyPurple },
];

const HIGH_SUGGESTIONS: Suggestion[] = [
  { key: 'GratitudeJar', icon: 'heart-outline', label: 'Add Gratitude', sub: 'Capture this good moment', color: calm.amber },
  { key: 'Community', icon: 'people-outline', label: 'Share with Community', sub: 'Inspire others with your energy', color: calm.dustyBlue },
  { key: 'Explore', icon: 'musical-notes-outline', label: 'Explore Sounds', sub: 'Celebrate with your favourite track', color: calm.mint },
];

function getSuggestions(score: number) {
  if (score <= 2) return LOW_SUGGESTIONS;
  if (score === 3) return MID_SUGGESTIONS;
  return HIGH_SUGGESTIONS;
}

const MOOD_META: Record<number, { label: string; color: string }> = {
  1: { label: 'Struggling', color: calm.rust },
  2: { label: 'Low', color: calm.terracotta },
  3: { label: 'Okay', color: calm.amber },
  4: { label: 'Good', color: calm.mint },
  5: { label: 'Great', color: calm.primary },
};

export function MoodSuggestScreen({ route, navigation }: Props) {
  const insets = useSafeAreaInsets();
  const moodScore = route.params?.moodScore ?? 3;
  const suggestions = getSuggestions(moodScore);
  const meta = MOOD_META[moodScore] ?? MOOD_META[3];

  const handleTap = (item: Suggestion) => {
    hapticLight();
    const TAB_SCREENS = ['Support', 'Community', 'Explore', 'Journal', 'Insights'];
    if (TAB_SCREENS.includes(item.key)) {
      navigation.replace('Main');
    } else {
      try {
        (navigation as any).navigate(item.key, item.params);
      } catch {
        navigation.replace('Main');
      }
    }
  };

  return (
    <View style={[s.root, { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing.xl }]}>
      <View style={s.header}>
        <View style={[s.moodDot, { backgroundColor: meta.color }]} />
        <Text style={s.title}>You're feeling{'\n'}{meta.label} today</Text>
        <Text style={s.sub}>Here's what might help right now</Text>
      </View>

      <View style={s.cards}>
        {suggestions.map((item, idx) => (
          <Pressable
            key={idx}
            style={({ pressed }) => [s.card, { opacity: pressed ? 0.85 : 1 }]}
            onPress={() => handleTap(item)}
          >
            <View style={[s.cardIconWrap, { backgroundColor: item.color + '1F' }]}>
              <Ionicons name={item.icon} size={22} color={item.color} />
            </View>
            <View style={s.cardText}>
              <Text style={s.cardLabel}>{item.label}</Text>
              <Text style={s.cardSub}>{item.sub}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={calm.faint} />
          </Pressable>
        ))}
      </View>

      <Pressable style={s.homeBtn} onPress={() => { hapticLight(); navigation.replace('Main'); }}>
        <Text style={s.homeTxt}>Go to Home</Text>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: calm.bg, paddingHorizontal: spacing.xl, justifyContent: 'space-between' },
  header: { alignItems: 'center', marginBottom: spacing.xl, gap: spacing.sm },
  moodDot: { width: 44, height: 44, borderRadius: 22, marginBottom: 4 },
  title: { fontFamily: fonts.displayExtraBold, fontSize: fontSizes.xxl, color: calm.forest, textAlign: 'center', lineHeight: 32, letterSpacing: -0.3 },
  sub: { fontFamily: fonts.body, fontSize: fontSizes.sm, color: calm.muted, textAlign: 'center' },

  cards: { gap: spacing.md, flex: 1, justifyContent: 'center' },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    borderRadius: radii.card - 2, padding: spacing.lg,
    backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: calm.border,
  },
  cardIconWrap: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  cardText: { flex: 1 },
  cardLabel: { fontFamily: fonts.bodyBold, fontSize: fontSizes.base, color: calm.forest, marginBottom: 3 },
  cardSub: { fontFamily: fonts.body, fontSize: fontSizes.xs + 1, color: calm.muted },

  homeBtn: { marginTop: spacing.xl, alignItems: 'center', padding: 16, borderRadius: radii.pill, backgroundColor: calm.mintBg },
  homeTxt: { fontFamily: fonts.bodyBold, fontSize: fontSizes.base, color: calm.primary },
});
