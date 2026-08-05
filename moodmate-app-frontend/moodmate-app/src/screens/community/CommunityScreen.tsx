/**
 * CommunityScreen — Calm Forest campus voices
 *
 * THESIS: The feed is the product — composer and posts lead; XP/challenge sit
 * as quiet secondary beats, not a dashboard of feature tiles.
 * OWN-WORLD: Calm Forest — forest hero, mint surfaces, sage CTAs, living blobs.
 * STORY: Pick a topic → share anonymously → react → feel less alone.
 * FIRST VIEWPORT: Forest hero with presence cue, topic rail, composer, then posts.
 * FORM: Home-matched Operate craft. Behavior and API wiring unchanged.
 */
import React, { useCallback, useRef, useState } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet, ScrollView, Alert, ActionSheetIOS, Platform,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MainTabParamList, RootStackParamList } from '@/navigation/types';
import { Screen } from '@/components/Screen';
import { Skeleton } from '@/components/Skeleton';
import { HeroHeader } from '@/components/HeroHeader';
import { LiquidBackground } from '@/components/LiquidBackground';
import { FadeInItem } from '@/components/FadeInItem';
import { PressScale } from '@/components/PressScale';
import { IconBurst, IconBurstHandle } from '@/components/IconBurst';
import { resolveIcon } from '@/theme/iconMap';
import { useCommunityStore } from '@/state/useCommunityStore';
import { useGamificationStore } from '@/state/useGamificationStore';
import type { Reaction } from '@/state/useCommunityStore';
import { useAuthStore } from '@/state/useAuthStore';
import { useFeatureFlagStore } from '@/state/useFeatureFlagStore';
import { useToast } from '@/state/useToast';
import { GuestGate } from '@/components/GuestGate';
import { ApiRequestError } from '@/api/client';
import { reportPost } from '@/api/community';
import { hapticLight, hapticSuccess } from '@/utils/haptics';
import { colors, calm, darkPalette, fonts, fontSizes, radii, spacing, shadow } from '@/theme/tokens';
import { useHideTabBarOnScroll } from '@/hooks/useHideTabBarOnScroll';
import { useResolvedAppearance } from '@/hooks/useResolvedAppearance';

type Props = BottomTabScreenProps<MainTabParamList, 'Community'>;

const TOPICS = ['#exam-season', '#anxiety', '#first-year', '#relationships', '#wins', '#sleep'];
const FOREST_GRAD = [calm.forest, calm.forest] as const;

function stripHash(t: string) { return t.startsWith('#') ? t.slice(1) : t; }

function ReactChip({
  reaction,
  onPress,
  isDark,
}: {
  reaction: Reaction;
  onPress: (pageX: number, pageY: number) => void;
  isDark: boolean;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const bounce = () => {
    Animated.sequence([
      Animated.spring(scale, { toValue: 1.18, speed: 60, bounciness: 8, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, speed: 40, bounciness: 6, useNativeDriver: true }),
    ]).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        style={[s.reactBtn, isDark && s.reactBtnDark, reaction.on && s.reactBtnOn, reaction.on && isDark && s.reactBtnOnDark]}
        onPress={(e) => {
          bounce();
          onPress(e.nativeEvent.pageX, e.nativeEvent.pageY);
        }}
      >
        <View style={s.reactInner}>
          <Ionicons
            name={resolveIcon(reaction.icon, 'heart-outline')}
            size={15}
            color={reaction.on ? darkPalette.primary : isDark ? darkPalette.textMuted : calm.muted}
          />
          <Text style={[s.reactTxt, isDark && s.mutedTextDark, reaction.on && s.reactTxtOn, reaction.on && isDark && s.accentTextDark]}>{reaction.count}</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

export function CommunityScreen(props: Props) {
  const { isDark } = useResolvedAppearance();
  const [activeTopic, setActiveTopic] = useState(TOPICS[0]);
  const [draft, setDraft]             = useState('');
  const [composerFocused, setComposerFocused] = useState(false);
  const [posting, setPosting]         = useState(false);
  const posts        = useCommunityStore((s) => s.posts);
  const loading      = useCommunityStore((s) => s.loading);
  const load         = useCommunityStore((s) => s.load);
  const addPost      = useCommunityStore((s) => s.addPost);
  const reactToPost  = useCommunityStore((s) => s.react);
  const deletePost   = useCommunityStore((s) => s.deletePost);
  const token        = useAuthStore((s) => s.token);
  const isGuest       = useAuthStore((s) => s.user?.guest ?? false);
  const postingEnabled = useFeatureFlagStore((s) => s.isEnabled('community_posting'));
  const toast        = useToast();
  const burstRef     = useRef<IconBurstHandle>(null);
  const insets       = useSafeAreaInsets();
  const rootNavigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const scrollY      = useRef(new Animated.Value(0)).current;
  const handleTabAwareScroll = useHideTabBarOnScroll();

  const refresh = useCallback(() => {
    if (!token || isGuest) return;
    load(token, stripHash(activeTopic)).catch((err) =>
      toast(err instanceof ApiRequestError ? err.message : 'Could not load the feed.')
    );
  }, [token, isGuest, activeTopic, load, toast]);

  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));

  const canPost = draft.trim().length > 0 && !posting && !!token;

  const handlePost = async () => {
    if (!canPost || !token) return;
    setPosting(true);
    try {
      await addPost(token, draft.trim(), stripHash(activeTopic));
      hapticSuccess();
      toast('Posted anonymously');
      setDraft('');
    } catch (err) {
      toast(err instanceof ApiRequestError ? err.message : 'Could not post.');
    } finally {
      setPosting(false);
    }
  };

  const handleDelete = (postId: number) => {
    const doDelete = async () => {
      if (!token) return;
      try {
        await deletePost(token, postId);
        hapticSuccess();
      } catch {
        toast('Could not delete post.');
      }
    };
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: ['Cancel', 'Delete post'], destructiveButtonIndex: 1, cancelButtonIndex: 0 },
        (idx) => { if (idx === 1) doDelete(); },
      );
    } else {
      Alert.alert('Delete post?', 'This cannot be undone.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: doDelete },
      ]);
    }
  };

  const doReport = async (postId: number) => {
    if (!token) return;
    try {
      await reportPost(token, postId, 'Inappropriate content');
      toast('Reported. Our team will review it.');
    } catch (err) {
      toast(err instanceof ApiRequestError ? err.message : 'Could not report post.');
    }
  };

  const handleReport = (postId: number) => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: ['Cancel', 'Report post'], destructiveButtonIndex: 1, cancelButtonIndex: 0 },
        (idx) => { if (idx === 1) doReport(postId); },
      );
    } else {
      Alert.alert('Report this post?', 'Our moderation team will review it.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Report', style: 'destructive', onPress: () => doReport(postId) },
      ]);
    }
  };

  const handleReact = async (
    postId: number, type: Reaction['type'], icon: string, pageX: number, pageY: number,
  ) => {
    if (!token) return;
    const wasOn = posts.find((p) => p.id === postId)?.reactions.find((r) => r.type === type)?.on ?? false;
    try {
      await reactToPost(token, postId, type);
      if (!wasOn) { hapticLight(); burstRef.current?.fire(icon, pageX, pageY); }
    } catch (err) {
      toast(err instanceof ApiRequestError ? err.message : 'Could not react.');
    }
  };

  const totalXp        = useGamificationStore((s) => s.totalXp);
  const unlockedBadges = useGamificationStore((s) => s.unlockedBadges);

  return (
    <View style={[s.root, isDark && s.rootDark]}>
      <HeroHeader
        gradient={FOREST_GRAD}
        title="Community"
        subtitle="You're not alone here"
        scrollY={scrollY}
        stats={[
          {
            key: 'topic',
            icon: <Ionicons name="pricetag" size={12} color={calm.mint} />,
            value: activeTopic.replace('#', ''),
            label: 'topic',
          },
          {
            key: 'posts',
            icon: <Ionicons name="chatbubbles" size={12} color={calm.mint} />,
            value: posts.length,
            label: 'voices',
          },
        ]}
      />

      {isGuest ? (
        <View style={s.body}>
          <LiquidBackground preset="wellness" opacityScale={isDark ? 0.16 : 0.55} />
          <Screen
            backgroundColor="transparent"
            edges={{ top: false, bottom: false }}
            scrollEventThrottle={16}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { y: scrollY } } }],
              { useNativeDriver: true, listener: handleTabAwareScroll },
            )}
          >
            <GuestGate
              icon="chatbubbles-outline"
              title="Join the conversation"
              message="Campus Voices is a real, anonymous community feed — create a free account to read and post."
              onCreateAccount={() => rootNavigation.navigate('Signup')}
            />
          </Screen>
        </View>
      ) : (
        <View style={s.body}>
          <LiquidBackground preset="wellness" opacityScale={isDark ? 0.16 : 0.55} />
          <Screen
            backgroundColor="transparent"
            contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 110 }]}
            edges={{ top: false, bottom: false }}
            refreshing={loading && posts.length > 0}
            onRefresh={refresh}
            refreshTintColor={calm.primary}
            scrollEventThrottle={16}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { y: scrollY } } }],
              { useNativeDriver: true, listener: handleTabAwareScroll },
            )}
          >
            <FadeInItem index={0}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={s.topicRow}
              >
                {TOPICS.map((topic) => {
                  const active = activeTopic === topic;
                  return (
                    <PressScale
                      key={topic}
                      pressedScale={0.94}
                      onPress={() => setActiveTopic(topic)}
                      style={active ? s.topicChipActiveOuter : undefined}
                    >
                      <View style={[s.topicChip, isDark && s.topicChipDark, active && s.topicChipActive]}>
                        <Text style={[s.topicLabel, isDark && s.mutedTextDark, active && s.topicLabelActive]}>{topic}</Text>
                      </View>
                    </PressScale>
                  );
                })}
              </ScrollView>
            </FadeInItem>

            {postingEnabled && (
              <FadeInItem index={1}>
                <View style={[s.composerCard, isDark && s.surfaceDark, composerFocused && s.composerCardFocused]}>
                  <View style={s.composerTop}>
                    <View style={[s.anonBadge, isDark && s.greenPillDark]}>
                      <Ionicons name="eye-off-outline" size={12} color={isDark ? darkPalette.primary : calm.primaryDeep} />
                      <Text style={[s.anonBadgeTxt, isDark && s.accentTextDark]}>Anonymous</Text>
                    </View>
                    <Text style={[s.composerTopic, isDark && s.accentTextDark]}>{activeTopic}</Text>
                  </View>
                  <TextInput
                    style={[s.composerInput, isDark && s.textDark]}
                    placeholder="Share how you're feeling…"
                    placeholderTextColor={isDark ? darkPalette.textFaint : calm.faint}
                    value={draft}
                    onChangeText={setDraft}
                    onFocus={() => setComposerFocused(true)}
                    onBlur={() => setComposerFocused(false)}
                    multiline
                  />
                  <View style={s.composerFooter}>
                    <Text style={[s.composerHint, isDark && s.mutedTextDark]}>
                      {draft.trim().length === 0 ? 'Kind words travel far' : `${draft.trim().length} chars`}
                    </Text>
                    <PressScale disabled={!canPost} onPress={handlePost}>
                      <View style={[s.postBtn, !canPost && s.postBtnDisabled]}>
                        <Text style={s.postBtnTxt}>{posting ? 'Posting…' : 'Post'}</Text>
                        {!posting && <Ionicons name="arrow-forward" size={14} color="#FFFFFF" />}
                      </View>
                    </PressScale>
                  </View>
                </View>
              </FadeInItem>
            )}

            {loading && posts.length === 0 ? (
              [0, 1, 2].map((i) => (
                <View key={`skel-${i}`} style={[s.postCard, isDark && s.surfaceDark]}>
                  <Skeleton width={110} height={10} />
                  <Skeleton width="90%" height={13} />
                  <Skeleton width="60%" height={13} />
                </View>
              ))
            ) : posts.length === 0 ? (
              <FadeInItem index={2}>
                <View style={s.emptyWrap}>
                  <View style={[s.emptyIcon, isDark && s.greenPillDark]}>
                    <Ionicons name="chatbubbles-outline" size={28} color={isDark ? darkPalette.primary : calm.primary} />
                  </View>
                  <Text style={[s.emptyTitle, isDark && s.textDark]}>Quiet in {activeTopic}</Text>
                  <Text style={s.emptySub}>Be the first voice here — someone else is probably waiting to feel less alone too.</Text>
                </View>
              </FadeInItem>
            ) : (
              posts.map((post, i) => (
                <FadeInItem key={post.id} index={i + 2}>
                  <View style={[s.postCard, isDark && s.surfaceDark]}>
                    <View style={s.postTop}>
                      <View style={[s.postAnonDot, isDark && s.greenPillDark]}>
                        <Ionicons name="person" size={15} color={isDark ? darkPalette.primary : calm.primaryDeep} />
                      </View>
                      <View style={s.postTopRight}>
                        <Text style={[s.postAuthor, isDark && s.textDark]}>{post.author}</Text>
                        <Text style={[s.postTime, isDark && s.mutedTextDark]}>{post.time}</Text>
                      </View>
                      <Pressable
                        style={s.deleteMenuBtn}
                        hitSlop={10}
                        onPress={() => (post.isOwn ? handleDelete(post.id) : handleReport(post.id))}
                      >
                        <Ionicons name="ellipsis-horizontal" size={16} color={isDark ? darkPalette.textMuted : calm.faint} />
                      </Pressable>
                    </View>
                    <Text style={[s.postText, isDark && s.textDark]}>{post.text}</Text>
                    <View style={s.reactRow}>
                      {post.reactions.map((r) => (
                        <ReactChip
                          key={r.type}
                          reaction={r}
                          isDark={isDark}
                          onPress={(pageX, pageY) => handleReact(post.id, r.type, r.icon, pageX, pageY)}
                        />
                      ))}
                      <Pressable
                        style={[s.reactBtn, isDark && s.reactBtnDark]}
                        onPress={() =>
                          rootNavigation.navigate('CommunityPostDetail', {
                            postId: post.id,
                            author: post.author,
                            time: post.time,
                            text: post.text,
                            isOwn: post.isOwn,
                          })
                        }
                      >
                        <Ionicons name="chatbubble-outline" size={13} color={isDark ? darkPalette.textMuted : calm.muted} />
                        <Text style={[s.reactTxt, isDark && s.mutedTextDark]}>{post.commentCount}</Text>
                      </Pressable>
                    </View>
                  </View>
                </FadeInItem>
              ))
            )}

            <FadeInItem index={posts.length + 4}>
              <View style={s.sideRail}>
                <View style={[s.wxpStrip, isDark && s.surfaceDark]}>
                  <Ionicons name="sparkles" size={16} color={calm.amber} />
                  <View style={s.wxpCopy}>
                    <Text style={[s.wxpTitle, isDark && s.textDark]}>{totalXp} campus XP</Text>
                    <Text style={[s.wxpSub, isDark && s.mutedTextDark]}>{unlockedBadges.length} badge{unlockedBadges.length !== 1 ? 's' : ''} earned</Text>
                  </View>
                </View>

                <View style={[s.challengeCard, isDark && s.surfaceDark]}>
                  <Text style={[s.challengeTitle, isDark && s.textDark]}>7-Day Streak Week</Text>
                  <Text style={[s.challengeSub, isDark && s.mutedTextDark]}>
                    Check in every day this week for the Week Warrior badge and bonus XP.
                  </Text>
                  <Text style={s.challengeRewardTxt}>+35 XP · Week Warrior</Text>
                </View>

                <PressScale onPress={() => props.navigation.navigate('Support')}>
                  <View style={[s.mentorCard, isDark && s.surfaceDark]}>
                    <View style={[s.mentorAvatar, isDark && s.greenPillDark]}>
                      <Ionicons name="people-outline" size={20} color={isDark ? darkPalette.primary : calm.primary} />
                    </View>
                    <View style={s.mentorInfo}>
                      <Text style={[s.mentorName, isDark && s.textDark]}>Need a real conversation?</Text>
                      <Text style={[s.mentorSub, isDark && s.mutedTextDark]}>Peer mentors are in Support</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={isDark ? darkPalette.textMuted : calm.faint} />
                  </View>
                </PressScale>
              </View>
            </FadeInItem>
          </Screen>
        </View>
      )}

      <IconBurst ref={burstRef} />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: calm.bg },
  rootDark: { backgroundColor: darkPalette.bg },
  body: { flex: 1 },
  content: { padding: spacing.lg, gap: spacing.md },

  topicRow: { gap: spacing.sm, paddingBottom: 2, paddingRight: spacing.lg },
  topicChipActiveOuter: {},
  topicChip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: calm.border,
  },
  topicChipDark: {
    backgroundColor: darkPalette.surface,
    borderColor: darkPalette.border,
  },
  topicChipActive: {
    backgroundColor: calm.forest,
    borderColor: calm.forest,
  },
  topicLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.xs,
    color: calm.muted,
  },
  topicLabelActive: { color: '#FFFFFF' },

  composerCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    padding: spacing.lg,
    gap: spacing.md,
    borderWidth: 1.5,
    borderColor: calm.border,
    ...shadow.md,
  },
  composerCardFocused: {
    borderColor: calm.primary,
  },
  composerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  anonBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: calm.mintBg,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radii.pill,
  },
  anonBadgeTxt: {
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    color: calm.primaryDeep,
  },
  composerTopic: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.xs,
    color: calm.primary,
  },
  composerInput: {
    minHeight: 72,
    fontFamily: fonts.body,
    fontSize: fontSizes.md,
    color: calm.ink,
    textAlignVertical: 'top',
    lineHeight: 22,
  },
  composerFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  composerHint: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.xs,
    color: calm.faint,
  },
  postBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: calm.primary,
    paddingVertical: 11,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.pill,
  },
  postBtnDisabled: { opacity: 0.4 },
  postBtnTxt: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.sm,
    color: '#FFFFFF',
  },

  postCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    padding: spacing.lg,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: calm.border,
    ...shadow.sm,
  },
  postTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  postAnonDot: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: calm.mintBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  postTopRight: { flex: 1 },
  postAuthor: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.xs,
    color: calm.forest,
  },
  postTime: {
    fontFamily: fonts.bodyMedium,
    fontSize: 10,
    color: calm.faint,
    marginTop: 1,
  },
  postText: {
    fontFamily: fonts.body,
    fontSize: fontSizes.md,
    color: calm.ink,
    lineHeight: 23,
  },
  reactRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  reactInner: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  reactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: radii.pill,
    backgroundColor: calm.trackAlt,
    borderWidth: 1.5,
    borderColor: calm.border,
  },
  reactBtnDark: {
    backgroundColor: darkPalette.surfaceSunken,
    borderColor: darkPalette.border,
  },
  reactBtnOn: {
    backgroundColor: calm.mintBg,
    borderColor: calm.primary,
  },
  reactBtnOnDark: {
    backgroundColor: darkPalette.primarySoft,
    borderColor: darkPalette.primary,
  },
  reactTxt: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.xs,
    color: calm.muted,
  },
  reactTxtOn: { color: calm.primaryDeep },

  deleteMenuBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.sm,
    backgroundColor: calm.trackAlt,
  },

  emptyWrap: { alignItems: 'center', paddingVertical: spacing.xxxl, gap: spacing.sm },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: calm.mintBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: { fontFamily: fonts.displayExtraBold, fontSize: fontSizes.md, color: calm.forest },
  emptySub: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.sm,
    color: calm.muted,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: spacing.lg,
  },

  sideRail: { gap: spacing.md, marginTop: spacing.sm },
  wxpStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: calm.border,
    ...shadow.sm,
  },
  wxpCopy: { flex: 1, gap: 2 },
  wxpTitle: { fontFamily: fonts.bodyBold, fontSize: fontSizes.base, color: calm.forest },
  wxpSub: { fontFamily: fonts.bodyMedium, fontSize: fontSizes.xs, color: calm.muted },

  challengeCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: calm.border,
    gap: 6,
    ...shadow.sm,
  },
  challengeTitle: { fontFamily: fonts.bodyBold, fontSize: fontSizes.md, color: calm.forest },
  challengeSub: { fontFamily: fonts.body, fontSize: fontSizes.sm, color: calm.muted, lineHeight: 19 },
  challengeRewardTxt: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.xs,
    color: calm.primaryDeep,
    marginTop: 4,
  },

  mentorCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: calm.border,
    ...shadow.sm,
  },
  mentorAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: calm.mintBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mentorInfo: { flex: 1 },
  mentorName: { fontFamily: fonts.bodyBold, fontSize: fontSizes.base, color: calm.forest },
  mentorSub: { fontFamily: fonts.bodyMedium, fontSize: fontSizes.xs, color: calm.muted, marginTop: 2 },
  surfaceDark: { backgroundColor: darkPalette.surface, borderColor: darkPalette.border },
  textDark: { color: darkPalette.text },
  mutedTextDark: { color: darkPalette.textMuted },
  accentTextDark: { color: darkPalette.primary },
  greenPillDark: { backgroundColor: darkPalette.primarySoft, borderColor: darkPalette.border },
});
