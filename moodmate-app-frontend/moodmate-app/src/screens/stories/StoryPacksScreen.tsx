import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { calm, colors, fonts, radii, spacing } from '@/theme/tokens';
import { useAuthStore } from '@/state/useAuthStore';
import { usePaymentsStore } from '@/state/usePaymentsStore';
import { openProUpgrade } from '@/utils/openProUpgrade';

type Props = NativeStackScreenProps<RootStackParamList, 'StoryPacks'>;
type Story = { title: string; pack: string; minutes: string; icon: keyof typeof Ionicons.glyphMap; body: string };

const STORIES: Story[] = [
  { title: 'The Quiet Forest', pack: 'Sleep stories', minutes: '5 min', icon: 'moon-outline', body: 'At the edge of the campus, a small forest kept the sound of the day. A student walked beneath its soft leaves, naming each worry and leaving it beside the path. By the time the stars appeared, there was room enough inside their chest for one slow breath, then another.' },
  { title: 'The Lighthouse Keeper', pack: 'Sleep stories', minutes: '6 min', icon: 'sunny-outline', body: 'Every evening, the lighthouse keeper lit one lamp for every person finding their way home. The light did not solve the sea. It simply stayed visible, patient and warm, until the next safe step became clear.' },
  { title: 'The Night Train', pack: 'Sleep stories', minutes: '4 min', icon: 'train-outline', body: 'The night train did not hurry. It carried tired thoughts past quiet stations, past fields silvered by moonlight, toward a morning that did not need everything solved at once.' },
  { title: 'The Golden River', pack: 'Hope stories', minutes: '5 min', icon: 'water-outline', body: 'A river turned gold whenever someone chose a small beginning. One student opened a notebook. Another sent a message. Neither knew where the river ended, but both learned that movement can begin gently.' },
  { title: 'The Sleeping Village', pack: 'Reflection stories', minutes: '7 min', icon: 'home-outline', body: 'In the sleeping village, every window held a different dream. Some were bright, some unfinished, and some needed rest. The village kept them all without asking any dream to become another.' },
];

export function StoryPacksScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState<Story | null>(null);
  const token = useAuthStore((state) => state.token);
  const isPro = usePaymentsStore((state) => state.subscription.pro);
  const loadPayments = usePaymentsStore((state) => state.load);
  useEffect(() => { if (token && token !== 'guest') loadPayments(token); }, [token, loadPayments]);
  return (
    <View style={[s.root, { paddingTop: insets.top }]}>      
      <View style={s.header}><Pressable onPress={() => selected ? setSelected(null) : navigation.goBack()} hitSlop={10}><Ionicons name="chevron-back" size={23} color={calm.forest} /></Pressable><View style={s.headerCopy}><Text style={s.kicker}>WIND DOWN</Text><Text style={s.title}>{selected ? selected.title : 'Story packs'}</Text></View><Ionicons name="book-outline" size={24} color={calm.primary} /></View>
      <ScrollView contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 36 }]} showsVerticalScrollIndicator={false}>
        {selected ? (
          <>
            <View style={s.readerHero}><Ionicons name={selected.icon} size={34} color={calm.primary} /><Text style={s.readerPack}>{selected.pack} · {selected.minutes}</Text><Text style={s.readerTitle}>{selected.title}</Text></View>
            <View style={s.readerBody}><Text style={s.storyText}>{selected.body}</Text><Text style={s.storyText}>Close your eyes for a moment. Let the last sentence settle. You do not need to carry tomorrow into tonight.</Text></View>
            <Pressable style={s.primaryButton} onPress={() => setSelected(null)}><Text style={s.primaryText}>Choose another story</Text></Pressable>
          </>
        ) : (
          <>
            <View style={s.intro}><Ionicons name="sparkles-outline" size={25} color={calm.primary} /><Text style={s.introTitle}>A softer ending to the day.</Text><Text style={s.introBody}>Short, original stories for sleep, hope, and quiet reflection.</Text></View>
            {STORIES.map((story, index) => { const premium = index > 2; return <Pressable key={story.title} style={s.storyCard} onPress={() => premium && !isPro ? openProUpgrade(navigation, 'story-pack') : setSelected(story)}><View style={s.storyIcon}><Ionicons name={story.icon} size={22} color={premium && !isPro ? calm.amber : calm.primary} /></View><View style={s.storyCopy}><View style={s.packRow}><Text style={s.storyPack}>{story.pack}</Text>{premium && <View style={s.premiumBadge}><Ionicons name="star" size={9} color={colors.sunText} /><Text style={s.premiumText}>PRO</Text></View>}</View><Text style={s.storyTitle}>{story.title}</Text><Text style={s.storyMeta}>{premium && !isPro ? 'Unlock with Pro' : `${story.minutes} read`}</Text></View><Ionicons name={premium && !isPro ? 'lock-closed-outline' : 'play-circle-outline'} size={27} color={premium && !isPro ? calm.amber : calm.primary} /></Pressable>; })}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: calm.bg }, header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: calm.border }, headerCopy: { flex: 1 }, kicker: { fontFamily: fonts.bodyBold, fontSize: 10, letterSpacing: 1.2, color: calm.primary }, title: { fontFamily: fonts.display, fontSize: 20, color: calm.forest, marginTop: 2 }, content: { padding: spacing.lg, gap: spacing.md }, intro: { backgroundColor: calm.forest, borderRadius: radii.lg, padding: spacing.lg }, introTitle: { fontFamily: fonts.display, fontSize: 24, lineHeight: 30, color: '#FFFFFF', marginTop: spacing.md }, introBody: { fontFamily: fonts.body, fontSize: 14, lineHeight: 21, color: calm.mutedOnDark, marginTop: spacing.sm }, storyCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, backgroundColor: '#FFFFFF', borderRadius: radii.md, borderWidth: 1, borderColor: calm.border }, storyIcon: { width: 46, height: 46, borderRadius: 23, backgroundColor: calm.mintBg, alignItems: 'center', justifyContent: 'center' }, storyCopy: { flex: 1 }, packRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm }, storyPack: { fontFamily: fonts.bodyBold, fontSize: 10, letterSpacing: 1, color: calm.primary, textTransform: 'uppercase' }, premiumBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: colors.premiumGoldSoft, borderRadius: radii.pill, paddingHorizontal: 6, paddingVertical: 3 }, premiumText: { fontFamily: fonts.bodyBold, fontSize: 8, color: colors.sunText }, storyTitle: { fontFamily: fonts.display, fontSize: 17, color: calm.forest, marginTop: 3 }, storyMeta: { fontFamily: fonts.body, fontSize: 12, color: calm.muted, marginTop: 3 }, readerHero: { backgroundColor: calm.mintBg, borderRadius: radii.lg, padding: spacing.xl }, readerPack: { fontFamily: fonts.bodyBold, fontSize: 11, color: calm.primary, marginTop: spacing.lg, textTransform: 'uppercase', letterSpacing: 1 }, readerTitle: { fontFamily: fonts.display, fontSize: 30, lineHeight: 37, color: calm.forest, marginTop: spacing.sm }, readerBody: { backgroundColor: '#FFFFFF', borderRadius: radii.md, padding: spacing.lg, borderWidth: 1, borderColor: calm.border }, storyText: { fontFamily: fonts.body, fontSize: 17, lineHeight: 29, color: calm.ink, marginBottom: spacing.lg }, primaryButton: { minHeight: 52, borderRadius: radii.md, backgroundColor: calm.primary, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.md }, primaryText: { fontFamily: fonts.bodyBold, color: '#FFFFFF', fontSize: 14 },
});
