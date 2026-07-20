import React, { useCallback, useRef, useState } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet, ScrollView, Alert, ActionSheetIOS, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { MainTabParamList } from '@/navigation/types';
import { Screen } from '@/components/Screen';
import { Skeleton } from '@/components/Skeleton';
import { EmojiBurst, EmojiBurstHandle } from '@/components/EmojiBurst';
import { useCommunityStore } from '@/state/useCommunityStore';
import { useGamificationStore } from '@/state/useGamificationStore';
import type { Reaction } from '@/state/useCommunityStore';
import { useAuthStore } from '@/state/useAuthStore';
import { useToast } from '@/state/useToast';
import { ApiRequestError } from '@/api/client';
import { hapticLight, hapticSuccess } from '@/utils/haptics';
import { colors, fonts, fontSizes, radii, spacing, shadow } from '@/theme/tokens';

type Props = BottomTabScreenProps<MainTabParamList, 'Community'>;

const TOPICS = ['#exam-season', '#anxiety', '#first-year', '#relationships', '#wins', '#sleep'];

function stripHash(t: string) { return t.startsWith('#') ? t.slice(1) : t; }

// ── Main screen ──────────────────────────────────────────────────────────────
// Note: this screen used to have a second "PeerConnect" mode with a hardcoded mentor list and
// Message/Connect buttons that only fired a toast - no real chat, no real request, nothing backend-
// wired. The actual peer-mentor request/chat flow already exists and works in the Support tab
// (PeerMentorDashboardScreen + SupportScreen's request UI), so that fake duplicate was removed
// rather than built out a second time. See the "Find a peer mentor" card below for the real link.

export function CommunityScreen(props: Props) {
  const [activeTopic, setActiveTopic] = useState(TOPICS[0]);
  const [draft, setDraft]             = useState('');
  const [posting, setPosting]         = useState(false);
  const posts        = useCommunityStore((s) => s.posts);
  const loading      = useCommunityStore((s) => s.loading);
  const load         = useCommunityStore((s) => s.load);
  const addPost      = useCommunityStore((s) => s.addPost);
  const reactToPost  = useCommunityStore((s) => s.react);
  const deletePost   = useCommunityStore((s) => s.deletePost);
  const token        = useAuthStore((s) => s.token);
  const toast        = useToast();
  const burstRef     = useRef<EmojiBurstHandle>(null);
  const insets       = useSafeAreaInsets();

  const refresh = useCallback(() => {
    if (!token) return;
    load(token, stripHash(activeTopic)).catch((err) =>
      toast(err instanceof ApiRequestError ? err.message : 'Could not load the feed.')
    );
  }, [token, activeTopic, load, toast]);

  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));

  const canPost = draft.trim().length > 0 && !posting && !!token;

  const handlePost = async () => {
    if (!canPost || !token) return;
    setPosting(true);
    try {
      await addPost(token, draft.trim(), stripHash(activeTopic));
      hapticSuccess();
      toast('Posted anonymously 🗣️');
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

  const handleReact = async (
    postId: number, type: Reaction['type'], emoji: string, pageX: number, pageY: number,
  ) => {
    if (!token) return;
    const wasOn = posts.find((p) => p.id === postId)?.reactions.find((r) => r.type === type)?.on ?? false;
    try {
      await reactToPost(token, postId, type);
      if (!wasOn) { hapticLight(); burstRef.current?.fire(emoji, pageX, pageY); }
    } catch (err) {
      toast(err instanceof ApiRequestError ? err.message : 'Could not react.');
    }
  };

  const totalXp        = useGamificationStore((s) => s.totalXp);
  const unlockedBadges = useGamificationStore((s) => s.unlockedBadges);

  return (
    <View style={s.root}>
      {/* ── Header ── */}
      <LinearGradient
        colors={['#1A0A2E', '#2D1478', '#3D1E8F']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[s.header, { paddingTop: insets.top + spacing.md }]}
      >
        <Text style={s.headerTitle}>Community</Text>
        <Text style={s.headerSub}>You're not alone here 💚</Text>
      </LinearGradient>

      <Screen
        backgroundColor={colors.bg}
        contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 100 }]}
        edges={{ top: false, bottom: false }}
        refreshing={loading && posts.length > 0}
        onRefresh={refresh}
        refreshTintColor={colors.coral}
      >
            {/* Topic pills */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={s.topicRow}
            >
              {TOPICS.map((topic) => (
                <Pressable
                  key={topic}
                  style={[s.topicChip, activeTopic === topic && s.topicChipActive]}
                  onPress={() => { setActiveTopic(topic); }}
                >
                  <Text style={[s.topicLabel, activeTopic === topic && s.topicLabelActive]}>{topic}</Text>
                </Pressable>
              ))}
            </ScrollView>

            {/* Composer */}
            <View style={s.composerCard}>
              <View style={s.composerTop}>
                <View style={s.anonBadge}>
                  <Text style={s.anonBadgeTxt}>👤 Anonymous</Text>
                </View>
                <Text style={s.composerTopic}>{activeTopic}</Text>
              </View>
              <TextInput
                style={s.composerInput}
                placeholder="Share how you're feeling…"
                placeholderTextColor={colors.inkFaint}
                value={draft}
                onChangeText={setDraft}
                multiline
              />
              <Pressable
                style={[s.postBtn, !canPost && s.postBtnDisabled]}
                disabled={!canPost}
                onPress={handlePost}
              >
                <Text style={s.postBtnTxt}>{posting ? 'Posting…' : 'Post anonymously →'}</Text>
              </Pressable>
            </View>

            {/* Feed */}
            {loading && posts.length === 0 ? (
              [0, 1, 2].map((i) => (
                <View key={`skel-${i}`} style={s.postCard}>
                  <Skeleton width={110} height={10} />
                  <Skeleton width="90%" height={13} />
                  <Skeleton width="60%" height={13} />
                </View>
              ))
            ) : posts.length === 0 ? (
              <View style={s.emptyWrap}>
                <Text style={s.emptyEmoji}>💬</Text>
                <Text style={s.emptyTitle}>No posts yet</Text>
                <Text style={s.emptySub}>Be the first to share something about {activeTopic}</Text>
              </View>
            ) : (
              posts.map((post) => (
                <View key={post.id} style={s.postCard}>
                  <View style={s.postTop}>
                    <View style={s.postAnonDot}>
                      <Text style={s.postAnonEmoji}>👤</Text>
                    </View>
                    <View style={s.postTopRight}>
                      <Text style={s.postAuthor}>{post.author}</Text>
                      <Text style={s.postTime}>{post.time}</Text>
                    </View>
                    {post.isOwn && (
                      <Pressable
                        style={s.deleteMenuBtn}
                        hitSlop={10}
                        onPress={() => handleDelete(post.id)}
                      >
                        <Text style={s.deleteMenuIcon}>⋯</Text>
                      </Pressable>
                    )}
                  </View>
                  <Text style={s.postText}>{post.text}</Text>
                  <View style={s.reactRow}>
                    {post.reactions.map((r) => (
                      <Pressable
                        key={r.type}
                        style={[s.reactBtn, r.on && s.reactBtnOn]}
                        onPress={(e) => handleReact(post.id, r.type, r.emoji, e.nativeEvent.pageX, e.nativeEvent.pageY)}
                      >
                        <Text style={[s.reactTxt, r.on && s.reactTxtOn]}>
                          {r.emoji} {r.count}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              ))
            )}

            {/* ── Weekly XP card ── */}
            <View style={s.weeklyXpCard}>
              <View style={s.wxpLeft}>
                <Text style={s.wxpTitle}>Your Campus XP</Text>
                <Text style={s.wxpXp}>⭐ {totalXp} XP total</Text>
                <Text style={s.wxpBadges}>🏅 {unlockedBadges.length} badge{unlockedBadges.length !== 1 ? 's' : ''} earned</Text>
              </View>
              <View style={s.wxpRight}>
                <Text style={s.wxpEmoji}>🏆</Text>
                <Text style={s.wxpRankLabel}>Keep going!</Text>
              </View>
            </View>

            {/* ── Campus Challenge ── */}
            <View style={s.challengeCard}>
              <Text style={s.challengeTag}>🎯 Campus Challenge</Text>
              <Text style={s.challengeTitle}>7-Day Streak Week</Text>
              <Text style={s.challengeSub}>Check in every day this week to earn the Week Warrior badge and bonus XP.</Text>
              <View style={s.challengeReward}>
                <Text style={s.challengeRewardTxt}>🔥 Reward: +35 XP · ⚡ Week Warrior badge</Text>
              </View>
            </View>

            {/* Find a peer mentor - real link to the Support tab, where mentor requests + chat
                actually work end-to-end. This used to be a hardcoded "Kwame is online now" card
                with a Chat button that only showed a toast; replaced with an honest CTA instead
                of a second fake mentor feature. */}
            <View style={s.mentorCard}>
              <View style={s.mentorAvatar}>
                <Text style={s.mentorEmoji}>🤝</Text>
              </View>
              <View style={s.mentorInfo}>
                <Text style={s.mentorName}>Want to talk to someone?</Text>
                <Text style={s.mentorSub}>Peer mentors are ready to chat in Support</Text>
              </View>
              <Pressable style={s.chatBtn} onPress={() => props.navigation.navigate('Support')}>
                <Text style={s.chatBtnTxt}>Go</Text>
              </Pressable>
            </View>
      </Screen>

      <EmojiBurst ref={burstRef} />
    </View>
  );
}

// ── Campus Voices styles ─────────────────────────────────────────────────────
const CARD_R = 18;

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },

  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  headerTitle: {
    fontFamily: fonts.display,
    fontSize: fontSizes.xl,
    color: '#FFFFFF',
  },
  headerSub: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.xs,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 2,
    marginBottom: spacing.md,
  },
  content: { padding: spacing.lg, gap: spacing.md },

  topicRow: { gap: spacing.sm, paddingBottom: 2 },
  topicChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radii.pill,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: colors.line,
    ...shadow.sm,
  },
  topicChipActive: {
    backgroundColor: colors.sageSoft,
    borderColor: colors.sage,
  },
  topicLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.xs,
    color: colors.inkSoft,
  },
  topicLabelActive: { color: colors.sage },

  composerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: CARD_R,
    padding: spacing.lg,
    gap: spacing.md,
    ...shadow.sm,
  },
  composerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  anonBadge: {
    backgroundColor: colors.lavenderSoft,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.pill,
  },
  anonBadgeTxt: {
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    color: colors.lavender,
  },
  composerTopic: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.xs,
    color: colors.sage,
  },
  composerInput: {
    minHeight: 64,
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.ink,
    textAlignVertical: 'top',
    lineHeight: 20,
  },
  postBtn: {
    alignSelf: 'flex-end',
    backgroundColor: colors.sage,
    paddingVertical: 10,
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
    backgroundColor: '#FFFFFF',
    borderRadius: CARD_R,
    padding: spacing.lg,
    gap: spacing.md,
    ...shadow.sm,
  },
  postTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  postAnonDot: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.lavenderSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  postAnonEmoji: { fontSize: 16 },
  postTopRight: { flex: 1 },
  postAuthor: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.xs,
    color: colors.inkSoft,
  },
  postTime: {
    fontFamily: fonts.bodyMedium,
    fontSize: 10,
    color: colors.inkFaint,
    marginTop: 1,
  },
  postText: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.sm,
    color: colors.ink,
    lineHeight: 20,
  },
  reactRow: { flexDirection: 'row', gap: spacing.sm },
  reactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radii.pill,
    backgroundColor: colors.bg,
    borderWidth: 1.5,
    borderColor: colors.line,
  },
  reactBtnOn: {
    backgroundColor: colors.coralSoft,
    borderColor: colors.coral,
  },
  reactTxt: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.xs,
    color: colors.inkSoft,
  },
  reactTxtOn: { color: colors.coralDeep },

  deleteMenuBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: colors.bg,
  },
  deleteMenuIcon: {
    fontSize: 18,
    color: colors.inkFaint,
    lineHeight: 20,
  },

  emptyWrap: { alignItems: 'center', paddingVertical: spacing.xxl, gap: spacing.sm },
  emptyEmoji: { fontSize: 40 },
  emptyTitle: { fontFamily: fonts.bodyBold, fontSize: fontSizes.md, color: colors.ink },
  emptySub: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.sm,
    color: colors.inkFaint,
    textAlign: 'center',
    lineHeight: 20,
  },

  mentorCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: CARD_R,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    ...shadow.sm,
  },
  mentorAvatar: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.sageSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mentorEmoji: { fontSize: 22 },
  weeklyXpCard: {
    backgroundColor: '#1B4F72',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  wxpLeft: { flex: 1, gap: 4 },
  wxpTitle: { fontFamily: fonts.bodyBold, fontSize: 11, color: 'rgba(255,255,255,0.65)', textTransform: 'uppercase', letterSpacing: 0.8 },
  wxpXp:    { fontFamily: fonts.bodyBold, fontSize: 20, color: '#FBBF24' },
  wxpBadges:{ fontFamily: fonts.bodyMedium, fontSize: 12, color: 'rgba(255,255,255,0.8)' },
  wxpRight: { alignItems: 'center', gap: 2 },
  wxpEmoji: { fontSize: 36 },
  wxpRankLabel: { fontFamily: fonts.bodyBold, fontSize: 10, color: 'rgba(255,255,255,0.6)' },

  challengeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 5, shadowOffset: { width: 0, height: 2 }, elevation: 2,
    gap: 6,
  },
  challengeTag:       { fontFamily: fonts.bodyBold, fontSize: 10, color: '#5C8AE6', textTransform: 'uppercase', letterSpacing: 0.8 },
  challengeTitle:     { fontFamily: fonts.bodyBold, fontSize: 17, color: colors.ink },
  challengeSub:       { fontFamily: fonts.bodyMedium, fontSize: 12.5, color: '#6B6470', lineHeight: 18 },
  challengeReward:    { backgroundColor: '#EBF5FB', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, marginTop: 4 },
  challengeRewardTxt: { fontFamily: fonts.bodyBold, fontSize: 11.5, color: '#1B4F72' },

  mentorInfo: { flex: 1 },
  mentorName: { fontFamily: fonts.bodyBold, fontSize: fontSizes.base, color: colors.ink },
  mentorSub: { fontFamily: fonts.bodyMedium, fontSize: fontSizes.xs, color: colors.inkFaint, marginTop: 2 },
  chatBtn: {
    backgroundColor: colors.sage,
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    borderRadius: radii.pill,
  },
  chatBtnTxt: { fontFamily: fonts.bodyBold, fontSize: fontSizes.sm, color: '#FFFFFF' },
});
