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

const MODES = [
  { key: 'voices', icon: '🗣️', label: 'Campus Voices', sub: 'anonymous sharing' },
  { key: 'peer',   icon: '🤝', label: 'PeerConnect',   sub: '1:1 peer mentors'  },
];

// ── PeerConnect static data ──────────────────────────────────────────────────
const PEER_CATEGORIES = ['All', 'Anxiety', 'Academic', 'Social', 'Grief', 'Identity'];

const PEER_MENTORS = [
  {
    id: 1, emoji: '🧑🏽', name: 'Kwame A.', year: '3rd Year · Psychology',
    tags: ['Anxiety', 'Academic'], rating: 4.9, sessions: 42, online: true,
    bio: 'I struggled through my first two years and found strategies that really work. Happy to talk exams, burnout, or just life.',
  },
  {
    id: 2, emoji: '👩🏾', name: 'Amara D.', year: '4th Year · Social Work',
    tags: ['Social', 'Grief'], rating: 4.8, sessions: 67, online: true,
    bio: "Lost my dad in my sophomore year. Grief is hard — you don't have to face it alone.",
  },
  {
    id: 3, emoji: '🧑🏻', name: 'Liam T.', year: '2nd Year · Computer Science',
    tags: ['Academic', 'Anxiety'], rating: 4.7, sessions: 28, online: false,
    bio: "Imposter syndrome is real. I've been there and came out stronger. Let's talk code & confidence.",
  },
  {
    id: 4, emoji: '👩🏽', name: 'Zainab K.', year: '3rd Year · Medicine',
    tags: ['Identity', 'Social'], rating: 5.0, sessions: 53, online: true,
    bio: 'Navigating culture, faith, and university life. I get the unique pressures that come with that.',
  },
  {
    id: 5, emoji: '🧑🏿', name: 'Emeka O.', year: '4th Year · Business',
    tags: ['Academic', 'Social'], rating: 4.6, sessions: 35, online: false,
    bio: 'First-gen student here. Built my network from zero — happy to help you do the same.',
  },
];

function PeerConnectView({ toast }: { toast: (msg: string) => void }) {
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = PEER_MENTORS.filter((m) => {
    const matchCat = activeCategory === 'All' || m.tags.includes(activeCategory);
    const matchSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.bio.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <>
      {/* Intro banner */}
      <View style={p.introBanner}>
        <Text style={p.introEmoji}>🤝</Text>
        <View style={{ flex: 1 }}>
          <Text style={p.introTitle}>Peer Mentors</Text>
          <Text style={p.introSub}>Connect 1:1 with a trained student who gets it</Text>
        </View>
        <View style={p.onlinePill}>
          <View style={p.onlineDot} />
          <Text style={p.onlineTxt}>{PEER_MENTORS.filter(m => m.online).length} online</Text>
        </View>
      </View>

      {/* Search bar */}
      <View style={p.searchWrap}>
        <Text style={p.searchIcon}>🔍</Text>
        <TextInput
          style={p.searchInput}
          placeholder="Search by name or topic…"
          placeholderTextColor={colors.inkFaint}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <Pressable onPress={() => setSearchQuery('')}>
            <Text style={p.searchClear}>✕</Text>
          </Pressable>
        )}
      </View>

      {/* Category chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={p.catRow}
      >
        {PEER_CATEGORIES.map((cat) => (
          <Pressable
            key={cat}
            style={[p.catChip, activeCategory === cat && p.catChipActive]}
            onPress={() => { hapticLight(); setActiveCategory(cat); }}
          >
            <Text style={[p.catLabel, activeCategory === cat && p.catLabelActive]}>{cat}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Stats row */}
      <View style={p.statsRow}>
        <View style={p.statPill}>
          <Text style={p.statNum}>{PEER_MENTORS.length}</Text>
          <Text style={p.statLbl}>Mentors</Text>
        </View>
        <View style={p.statPill}>
          <Text style={p.statNum}>4.8★</Text>
          <Text style={p.statLbl}>Avg rating</Text>
        </View>
        <View style={p.statPill}>
          <Text style={p.statNum}>225+</Text>
          <Text style={p.statLbl}>Sessions</Text>
        </View>
        <View style={p.statPill}>
          <Text style={p.statNum}>Free</Text>
          <Text style={p.statLbl}>Always</Text>
        </View>
      </View>

      {/* Mentor cards */}
      {filtered.length === 0 ? (
        <View style={p.emptyWrap}>
          <Text style={p.emptyEmoji}>🔎</Text>
          <Text style={p.emptyTitle}>No mentors found</Text>
          <Text style={p.emptySub}>Try a different topic or clear your search</Text>
        </View>
      ) : (
        filtered.map((mentor) => (
          <View key={mentor.id} style={p.mentorCard}>
            {/* Top row */}
            <View style={p.mentorTop}>
              <View style={p.avatarWrap}>
                <Text style={p.avatarEmoji}>{mentor.emoji}</Text>
                {mentor.online && <View style={p.onlineBadge} />}
              </View>
              <View style={{ flex: 1 }}>
                <View style={p.nameRow}>
                  <Text style={p.mentorName}>{mentor.name}</Text>
                  <Text style={p.ratingBadge}>★ {mentor.rating}</Text>
                </View>
                <Text style={p.mentorYear}>{mentor.year}</Text>
                <Text style={p.sessionCount}>💬 {mentor.sessions} sessions</Text>
              </View>
            </View>

            {/* Bio */}
            <Text style={p.mentorBio}>{mentor.bio}</Text>

            {/* Tags */}
            <View style={p.tagRow}>
              {mentor.tags.map((tag) => (
                <View key={tag} style={p.tagChip}>
                  <Text style={p.tagLabel}>{tag}</Text>
                </View>
              ))}
            </View>

            {/* Actions */}
            <View style={p.actionRow}>
              <Pressable
                style={p.msgBtn}
                onPress={() => { hapticLight(); toast(`Opening chat with ${mentor.name} 💬`); }}
              >
                <Text style={p.msgBtnTxt}>💬 Message</Text>
              </Pressable>
              <Pressable
                style={p.connectBtn}
                onPress={() => { hapticSuccess(); toast(`Request sent to ${mentor.name} 🤝`); }}
              >
                <Text style={p.connectBtnTxt}>Connect →</Text>
              </Pressable>
            </View>
          </View>
        ))
      )}

      {/* Footer note */}
      <View style={p.footerNote}>
        <Text style={p.footerText}>
          🔒 All peer mentors are trained & verified by your campus wellbeing team. Sessions are confidential.
        </Text>
      </View>
    </>
  );
}

// ── Main screen ──────────────────────────────────────────────────────────────

export function CommunityScreen(_props: Props) {
  const [mode, setMode]               = useState('voices');
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
    if (!token || mode !== 'voices') return;
    load(token, stripHash(activeTopic)).catch((err) =>
      toast(err instanceof ApiRequestError ? err.message : 'Could not load the feed.')
    );
  }, [token, activeTopic, load, toast, mode]);

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
        colors={['#1E3D2F', '#2A5C45', '#3D7A5C']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[s.header, { paddingTop: insets.top + spacing.md }]}
      >
        <Text style={s.headerTitle}>Community</Text>
        <Text style={s.headerSub}>You're not alone here 💚</Text>

        {/* Mode toggle */}
        <View style={s.modeRow}>
          {MODES.map((m) => (
            <Pressable
              key={m.key}
              style={[s.modeChip, mode === m.key && s.modeChipActive]}
              onPress={() => { hapticLight(); setMode(m.key); }}
            >
              <Text style={s.modeIcon}>{m.icon}</Text>
              <View>
                <Text style={[s.modeLabel, mode === m.key && s.modeLabelActive]}>{m.label}</Text>
                <Text style={s.modeSub}>{m.sub}</Text>
              </View>
            </Pressable>
          ))}
        </View>
      </LinearGradient>

      <Screen
        backgroundColor={colors.bg}
        contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 100 }]}
        edges={{ top: false, bottom: false }}
        refreshing={mode === 'voices' && loading && posts.length > 0}
        onRefresh={refresh}
        refreshTintColor={colors.coral}
      >
        {mode === 'peer' ? (
          /* ── PeerConnect view ── */
          <PeerConnectView toast={toast} />
        ) : (
          /* ── Campus Voices view ── */
          <>
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

            {/* Mentor spotlight */}
            <View style={s.sectionRow}>
              <Text style={s.sectionTitle}>Mentor spotlight</Text>
              <View style={s.onlineRow}>
                <View style={s.onlineDot} />
                <Text style={s.onlineTxt}>online now</Text>
              </View>
            </View>
            <View style={s.mentorCard}>
              <View style={s.mentorAvatar}>
                <Text style={s.mentorEmoji}>🧑🏽</Text>
              </View>
              <View style={s.mentorInfo}>
                <Text style={s.mentorName}>Kwame · Peer Mentor</Text>
                <Text style={s.mentorSub}>Stress · Time management</Text>
              </View>
              <Pressable style={s.chatBtn} onPress={() => toast('Opening chat with Kwame 💬')}>
                <Text style={s.chatBtnTxt}>Chat</Text>
              </Pressable>
            </View>
          </>
        )}
      </Screen>

      <EmojiBurst ref={burstRef} />
    </View>
  );
}

// ── PeerConnect styles ────────────────────────────────────────────────────────
const p = StyleSheet.create({
  introBanner: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    ...shadow.sm,
  },
  introEmoji: { fontSize: 32 },
  introTitle: { fontFamily: fonts.bodyBold, fontSize: fontSizes.base, color: colors.ink },
  introSub:   { fontFamily: fonts.bodyMedium, fontSize: fontSizes.xs, color: colors.inkFaint, marginTop: 2 },
  onlinePill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#E8F5EE', borderRadius: radii.pill,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  onlineDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#4CAF7D' },
  onlineTxt: { fontFamily: fonts.bodyBold, fontSize: 10, color: '#4CAF7D' },

  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: '#FFFFFF', borderRadius: 14,
    paddingHorizontal: spacing.md, paddingVertical: 10,
    borderWidth: 1.5, borderColor: colors.line,
    ...shadow.sm,
  },
  searchIcon: { fontSize: 14 },
  searchInput: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.ink,
  },
  searchClear: { fontSize: 12, color: colors.inkFaint, paddingHorizontal: 4 },

  catRow: { gap: spacing.sm, paddingBottom: 2 },
  catChip: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: radii.pill, backgroundColor: '#FFFFFF',
    borderWidth: 1.5, borderColor: colors.line,
    ...shadow.sm,
  },
  catChipActive: { backgroundColor: colors.sageSoft, borderColor: colors.sage },
  catLabel:  { fontFamily: fonts.bodyBold, fontSize: fontSizes.xs, color: colors.inkSoft },
  catLabelActive: { color: colors.sage },

  statsRow: {
    flexDirection: 'row', gap: spacing.sm,
  },
  statPill: {
    flex: 1, backgroundColor: '#FFFFFF', borderRadius: 14,
    paddingVertical: spacing.md, alignItems: 'center',
    borderWidth: 1.5, borderColor: colors.line,
  },
  statNum: { fontFamily: fonts.bodyBold, fontSize: fontSizes.base, color: colors.ink },
  statLbl: { fontFamily: fonts.bodyMedium, fontSize: 9, color: colors.inkFaint, marginTop: 2 },

  mentorCard: {
    backgroundColor: '#FFFFFF', borderRadius: 18,
    padding: spacing.lg, gap: spacing.md,
    ...shadow.sm,
  },
  mentorTop: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  avatarWrap: { position: 'relative' },
  avatarEmoji: { fontSize: 34 },
  onlineBadge: {
    position: 'absolute', bottom: 0, right: -2,
    width: 11, height: 11, borderRadius: 6,
    backgroundColor: '#4CAF7D',
    borderWidth: 2, borderColor: '#FFFFFF',
  },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  mentorName: { fontFamily: fonts.bodyBold, fontSize: fontSizes.base, color: colors.ink, flex: 1 },
  ratingBadge: {
    fontFamily: fonts.bodyBold, fontSize: 10,
    color: '#C68B00', backgroundColor: '#FFF8E1',
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: radii.pill,
  },
  mentorYear: { fontFamily: fonts.bodyMedium, fontSize: fontSizes.xs, color: colors.inkFaint, marginTop: 1 },
  sessionCount: { fontFamily: fonts.bodyMedium, fontSize: 10, color: colors.sage, marginTop: 2 },
  mentorBio: {
    fontFamily: fonts.bodyMedium, fontSize: fontSizes.sm,
    color: colors.inkSoft, lineHeight: 20,
  },
  tagRow: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  tagChip: {
    paddingHorizontal: 10, paddingVertical: 4,
    backgroundColor: colors.sageSoft, borderRadius: radii.pill,
  },
  tagLabel: { fontFamily: fonts.bodyBold, fontSize: 10, color: colors.sage },
  actionRow: { flexDirection: 'row', gap: spacing.sm },
  msgBtn: {
    flex: 1, alignItems: 'center',
    paddingVertical: 10, borderRadius: radii.pill,
    backgroundColor: colors.bg,
    borderWidth: 1.5, borderColor: colors.line,
  },
  msgBtnTxt: { fontFamily: fonts.bodyBold, fontSize: fontSizes.sm, color: colors.inkSoft },
  connectBtn: {
    flex: 1, alignItems: 'center',
    paddingVertical: 10, borderRadius: radii.pill,
    backgroundColor: colors.sage,
  },
  connectBtnTxt: { fontFamily: fonts.bodyBold, fontSize: fontSizes.sm, color: '#FFFFFF' },

  emptyWrap: { alignItems: 'center', paddingVertical: spacing.xxl, gap: spacing.sm },
  emptyEmoji: { fontSize: 40 },
  emptyTitle: { fontFamily: fonts.bodyBold, fontSize: fontSizes.md, color: colors.ink },
  emptySub:   { fontFamily: fonts.bodyMedium, fontSize: fontSizes.sm, color: colors.inkFaint, textAlign: 'center' },

  footerNote: {
    backgroundColor: colors.lavenderSoft, borderRadius: 14,
    padding: spacing.md,
  },
  footerText: {
    fontFamily: fonts.bodyMedium, fontSize: fontSizes.xs,
    color: colors.lavender, lineHeight: 18, textAlign: 'center',
  },
});

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
  modeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  modeChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: CARD_R,
    padding: spacing.md,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  modeChipActive: {
    backgroundColor: 'rgba(255,255,255,0.28)',
    borderColor: 'rgba(255,255,255,0.55)',
  },
  modeIcon: { fontSize: 20 },
  modeLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.xs,
    color: 'rgba(255,255,255,0.75)',
  },
  modeLabelActive: { color: '#FFFFFF' },
  modeSub: {
    fontFamily: fonts.bodyMedium,
    fontSize: 9,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 1,
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

  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  sectionTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.md,
    color: colors.ink,
  },
  onlineRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  onlineDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#4CAF7D' },
  onlineTxt: { fontFamily: fonts.bodyBold, fontSize: fontSizes.xs, color: '#4CAF7D' },

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
