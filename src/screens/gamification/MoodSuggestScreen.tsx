/**
 * MoodSuggestScreen — shown immediately after the MoodGate check-in.
 * Presents 3 personalised activity suggestions based on the mood score (1-5).
 */
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { hapticLight } from '@/utils/haptics';
import { fonts, fontSizes, spacing, radii } from '@/theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'MoodSuggest'>;

// ── Activity cards per mood tier ─────────────────────────────────────────────
const LOW_SUGGESTIONS = [
  { key: 'Grounding',        icon: '🌿', label: 'Grounding Exercise',   sub: 'Anchor yourself with the 5-senses technique', from: '#065F46', to: '#059669' },
  { key: 'BreathingSession', icon: '🫁', label: 'Box Breathing',        sub: 'Slow your nervous system in 4 minutes', from: '#1A3A6B', to: '#2C6FA0', params: { session: 'Box Breathing', duration: 4 } },
  { key: 'Support',          icon: '💬', label: 'Talk to Someone',      sub: 'Connect with a peer counsellor now', from: '#4A1C96', to: '#7B2D8B' },
] as const;

const MID_SUGGESTIONS = [
  { key: 'BubblePop',        icon: '🫧', label: 'Bubble Pop',           sub: 'A quick mindful distraction', from: '#1A5276', to: '#2980B9' },
  { key: 'JournalEntry',     icon: '📓', label: 'Write in Journal',     sub: 'Process your thoughts on paper', from: '#145A32', to: '#27AE60', params: { template: 'Free write', icon: '📝' } },
  { key: 'Explore',          icon: '🔮', label: 'Explore Sounds',       sub: 'Find your calm with ambient audio', from: '#512E5F', to: '#8E44AD' },
] as const;

const HIGH_SUGGESTIONS = [
  { key: 'GratitudeJar',    icon: '🙏', label: 'Add Gratitude',        sub: 'Capture this good moment', from: '#7D6608', to: '#F1C40F' },
  { key: 'Community',       icon: '🌍', label: 'Share with Community', sub: 'Inspire others with your energy', from: '#1A5276', to: '#2E86C1' },
  { key: 'Explore',         icon: '🎵', label: 'Explore Sounds',       sub: 'Celebrate with your favourite track', from: '#065F46', to: '#1ABC9C' },
] as const;

function getSuggestions(score: number) {
  if (score <= 2) return LOW_SUGGESTIONS;
  if (score === 3) return MID_SUGGESTIONS;
  return HIGH_SUGGESTIONS;
}

function getMoodMeta(score: number) {
  const map: Record<number, { emoji: string; label: string; gradStart: string; gradEnd: string }> = {
    1: { emoji: '😔', label: 'Struggling', gradStart: '#0A0A14', gradEnd: '#1A0A2E' },
    2: { emoji: '😟', label: 'Low',        gradStart: '#0A0A14', gradEnd: '#0D1B33' },
    3: { emoji: '😐', label: 'Okay',       gradStart: '#0A0A14', gradEnd: '#0D2014' },
    4: { emoji: '🙂', label: 'Good',       gradStart: '#0A0A14', gradEnd: '#0A2014' },
    5: { emoji: '😊', label: 'Great',      gradStart: '#0A0A14', gradEnd: '#1A1200' },
  };
  return map[score] ?? map[3];
}

export function MoodSuggestScreen({ route, navigation }: Props) {
  const insets  = useSafeAreaInsets();
  const moodScore = route.params?.moodScore ?? 3;
  const suggestions = getSuggestions(moodScore);
  const meta = getMoodMeta(moodScore);

  const handleTap = (item: typeof suggestions[number]) => {
    hapticLight();
    const key = item.key as string;
    const params = 'params' in item ? (item as any).params : undefined;
    // Tab screens live inside Main — navigate there, not replace with tab name
    const TAB_SCREENS = ['Support', 'Community', 'Explore', 'Journal', 'Insights'];
    if (TAB_SCREENS.includes(key)) {
      navigation.replace('Main');
    } else {
      try {
        (navigation as any).navigate(key, params);
      } catch {
        navigation.replace('Main');
      }
    }
  };

  return (
    <View style={s.root}>
      <LinearGradient
        colors={[meta.gradStart, meta.gradEnd]}
        style={StyleSheet.absoluteFill}
      />

      <View style={[s.inner, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 32 }]}>
        {/* Header */}
        <View style={s.header}>
          <Text style={s.moodEmoji}>{meta.emoji}</Text>
          <Text style={s.title}>You're feeling{'\n'}{meta.label} today</Text>
          <Text style={s.sub}>Here's what might help right now</Text>
        </View>

        {/* Suggestion cards */}
        <View style={s.cards}>
          {suggestions.map((item, idx) => (
            <Pressable
              key={idx}
              style={({ pressed }) => [s.card, { opacity: pressed ? 0.85 : 1 }]}
              onPress={() => handleTap(item)}
            >
              <LinearGradient
                colors={[item.from, item.to]}
                style={s.cardGrad}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              >
                <Text style={s.cardIcon}>{item.icon}</Text>
                <View style={s.cardText}>
                  <Text style={s.cardLabel}>{item.label}</Text>
                  <Text style={s.cardSub}>{item.sub}</Text>
                </View>
                <Text style={s.cardArrow}>›</Text>
              </LinearGradient>
            </Pressable>
          ))}
        </View>

        {/* Go Home */}
        <Pressable
          style={s.homeBtn}
          onPress={() => { hapticLight(); navigation.replace('Main'); }}
        >
          <Text style={s.homeTxt}>Go to Home →</Text>
        </Pressable>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root:  { flex: 1, backgroundColor: '#0A0A14' },
  inner: { flex: 1, paddingHorizontal: spacing.xl, justifyContent: 'space-between' },
  header: { alignItems: 'center', marginBottom: 32 },
  moodEmoji: { fontSize: 56, marginBottom: 12 },
  title: { fontFamily: fonts.display, fontSize: 24, color: '#FFFFFF', textAlign: 'center', lineHeight: 32, marginBottom: 8 },
  sub:   { fontFamily: fonts.bodyMedium, fontSize: fontSizes.sm, color: 'rgba(255,255,255,0.55)', textAlign: 'center' },

  cards: { gap: 12, flex: 1, justifyContent: 'center' },
  card:  { borderRadius: radii.md, overflow: 'hidden' },
  cardGrad: { flexDirection: 'row', alignItems: 'center', padding: 20, gap: 16 },
  cardIcon: { fontSize: 32 },
  cardText: { flex: 1 },
  cardLabel: { fontFamily: fonts.bodyBold, fontSize: fontSizes.base, color: '#FFFFFF', marginBottom: 3 },
  cardSub:   { fontFamily: fonts.bodyMedium, fontSize: fontSizes.xs, color: 'rgba(255,255,255,0.72)' },
  cardArrow: { fontSize: 24, color: 'rgba(255,255,255,0.6)' },

  homeBtn: { marginTop: 24, alignItems: 'center', padding: 16, borderRadius: radii.md, backgroundColor: 'rgba(255,255,255,0.1)' },
  homeTxt: { fontFamily: fonts.bodyBold, fontSize: fontSizes.base, color: 'rgba(255,255,255,0.8)' },
});
