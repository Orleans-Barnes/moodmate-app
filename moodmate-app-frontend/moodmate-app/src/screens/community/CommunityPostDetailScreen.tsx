/**
 * CommunityPostDetailScreen — Community frontend completion (Community domain gap fix).
 *
 * The backend has had fully-built nested/threaded comments (CommunityService#addComment/
 * listComments/updateComment/deleteComment, CommentResponse's recursive `replies`) since Feature 6,
 * but no screen ever called any of it. This screen is the first frontend surface for comments:
 * view a post's thread, add a top-level comment or a reply to any comment (arbitrary depth,
 * rendered via simple recursion since thread sizes here are small), edit/delete your own comments,
 * and report someone else's. The post itself is passed in via navigation params (author/time/text/
 * isOwn) rather than re-fetched - CommunityController has no GET /posts/{id}, and the caller
 * (CommunityScreen) already has the full post in its store, so there's nothing to gain from an
 * extra round trip.
 */
import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet, ScrollView, ActivityIndicator, Alert,
  ActionSheetIOS, Platform, KeyboardAvoidingView, RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { useAuthStore } from '@/state/useAuthStore';
import {
  listComments, addComment, updateComment, deleteComment, reportComment,
} from '@/api/community';
import { ApiRequestError } from '@/api/client';
import type { CommunityCommentView } from '@/api/types';
import { useToast } from '@/state/useToast';
import { colors, fonts, fontSizes, radii, spacing, shadow } from '@/theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'CommunityPostDetail'>;

function relativeTime(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.max(1, Math.round(ms / 60000));
  if (mins < 60) return `${mins}m`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.round(hours / 24)}d`;
}

import { useKeyboardOffset } from '@/hooks/useKeyboardOffset';

export function CommunityPostDetailScreen({ route, navigation }: Props) {
  const { postId, author, time, text, isOwn: isOwnPost } = route.params;
  const insets = useSafeAreaInsets();
  const token = useAuthStore((s) => s.token) ?? '';
  const toast = useToast();

  const [comments, setComments] = useState<CommunityCommentView[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [draft, setDraft] = useState('');
  const [posting, setPosting] = useState(false);
  const [replyTo, setReplyTo] = useState<{ id: number; author: string } | null>(null);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editDraft, setEditDraft] = useState('');
  const keyboardHeight = useKeyboardOffset();

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError(null);
    try {
      const page = await listComments(token, postId);
      setComments(page.content);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Could not load comments.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, postId]);

  useEffect(() => { load(); }, [load]);

  const canPost = draft.trim().length > 0 && !posting;

  const handlePost = async () => {
    if (!canPost) return;
    setPosting(true);
    try {
      await addComment(token, postId, {
        content: draft.trim(),
        parentCommentId: replyTo?.id ?? null,
      });
      setDraft('');
      setReplyTo(null);
      await load();
    } catch (err) {
      toast(err instanceof ApiRequestError ? err.message : 'Could not post comment.');
    } finally {
      setPosting(false);
    }
  };

  const startEdit = (comment: CommunityCommentView) => {
    setEditingId(comment.id);
    setEditDraft(comment.content);
  };

  const saveEdit = async (commentId: number) => {
    if (!editDraft.trim()) return;
    try {
      await updateComment(token, commentId, editDraft.trim());
      setEditingId(null);
      await load();
    } catch (err) {
      toast(err instanceof ApiRequestError ? err.message : 'Could not save changes.');
    }
  };

  const doDeleteComment = async (commentId: number) => {
    try {
      await deleteComment(token, commentId);
      await load();
    } catch (err) {
      toast(err instanceof ApiRequestError ? err.message : 'Could not delete comment.');
    }
  };

  const doReportComment = async (commentId: number) => {
    try {
      await reportComment(token, commentId, 'Inappropriate content');
      toast('Reported. Our team will review it.');
    } catch (err) {
      toast(err instanceof ApiRequestError ? err.message : 'Could not report comment.');
    }
  };

  const handleCommentMenu = (comment: CommunityCommentView) => {
    if (comment.mine) {
      const options = ['Cancel', 'Edit', 'Delete'];
      if (Platform.OS === 'ios') {
        ActionSheetIOS.showActionSheetWithOptions(
          { options, destructiveButtonIndex: 2, cancelButtonIndex: 0 },
          (idx) => {
            if (idx === 1) startEdit(comment);
            if (idx === 2) {
              Alert.alert('Delete comment?', 'This cannot be undone.', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: () => doDeleteComment(comment.id) },
              ]);
            }
          },
        );
      } else {
        Alert.alert('Comment', undefined, [
          { text: 'Edit', onPress: () => startEdit(comment) },
          {
            text: 'Delete', style: 'destructive',
            onPress: () => Alert.alert('Delete comment?', 'This cannot be undone.', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Delete', style: 'destructive', onPress: () => doDeleteComment(comment.id) },
            ]),
          },
          { text: 'Cancel', style: 'cancel' },
        ]);
      }
    } else {
      if (Platform.OS === 'ios') {
        ActionSheetIOS.showActionSheetWithOptions(
          { options: ['Cancel', 'Report'], destructiveButtonIndex: 1, cancelButtonIndex: 0 },
          (idx) => { if (idx === 1) doReportComment(comment.id); },
        );
      } else {
        Alert.alert('Report this comment?', 'Our moderation team will review it.', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Report', style: 'destructive', onPress: () => doReportComment(comment.id) },
        ]);
      }
    }
  };

  const renderComment = (comment: CommunityCommentView, depth = 0) => {
    const isEditing = editingId === comment.id;
    return (
      <View key={comment.id} style={[s.commentWrap, { marginLeft: Math.min(depth, 4) * 18 }]}>
        <View style={s.commentCard}>
          <View style={s.commentTop}>
            <Text style={s.commentAuthor}>{comment.authorHandle}</Text>
            <Text style={s.commentTime}>
              {relativeTime(comment.createdAt)}{comment.edited ? ' · edited' : ''}
            </Text>
            <Pressable hitSlop={10} onPress={() => handleCommentMenu(comment)}>
              <Text style={s.commentMenuIcon}>⋯</Text>
            </Pressable>
          </View>

          {isEditing ? (
            <View style={s.editRow}>
              <TextInput
                style={s.editInput}
                value={editDraft}
                onChangeText={setEditDraft}
                multiline
                autoFocus
              />
              <View style={s.editActions}>
                <Pressable onPress={() => setEditingId(null)}>
                  <Text style={s.editCancel}>Cancel</Text>
                </Pressable>
                <Pressable onPress={() => saveEdit(comment.id)}>
                  <Text style={s.editSave}>Save</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <Text style={s.commentText}>{comment.content}</Text>
          )}

          <Pressable onPress={() => setReplyTo({ id: comment.id, author: comment.authorHandle })}>
            <Text style={s.replyLink}>Reply</Text>
          </Pressable>
        </View>

        {comment.replies.map((reply) => renderComment(reply, depth + 1))}
      </View>
    );
  };

  return (
    <View style={[s.root, { paddingBottom: keyboardHeight }]}>
      <LinearGradient colors={['#24412A', '#579E65']} style={[s.header, { paddingTop: insets.top + spacing.sm }]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <Pressable style={s.backBtn} onPress={() => navigation.goBack()} hitSlop={10}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </Pressable>
        <Text style={s.headerTitle}>Post</Text>
        <View style={s.backBtn} />
      </LinearGradient>

      <ScrollView
        style={s.body}
        contentContainerStyle={{ paddingBottom: spacing.xl }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.coral} />}
      >
        <View style={s.postCard}>
          <View style={s.postTop}>
            <View style={s.postAnonDot}>
              <Ionicons name="person" size={16} color={colors.coral} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.postAuthor}>{author}{isOwnPost ? ' (you)' : ''}</Text>
              <Text style={s.postTime}>{time}</Text>
            </View>
          </View>
          <Text style={s.postText}>{text}</Text>
        </View>

        <Text style={s.sectionTitle}>Comments</Text>

        {error ? (
          <View style={s.alertBanner}>
            <Ionicons name="warning-outline" size={18} color={colors.error} />
            <Text style={s.alertText}>{error}</Text>
            <Pressable onPress={() => load()}>
              <Text style={s.retryText}>Retry</Text>
            </Pressable>
          </View>
        ) : loading ? (
          <ActivityIndicator color={colors.coral} style={{ marginVertical: 30 }} />
        ) : comments.length === 0 ? (
          <View style={s.emptyWrap}>
            <Text style={s.emptyTitle}>No comments yet</Text>
            <Text style={s.emptySub}>Be the first to reply.</Text>
          </View>
        ) : (
          comments.map((c) => renderComment(c))
        )}
      </ScrollView>

      <View style={[s.composer, { paddingBottom: keyboardHeight > 0 ? spacing.sm : Math.max(insets.bottom, spacing.sm) }]}>
        {replyTo && (
          <View style={s.replyBanner}>
            <Text style={s.replyBannerText} numberOfLines={1}>Replying to {replyTo.author}</Text>
            <Pressable onPress={() => setReplyTo(null)} hitSlop={10}>
              <Ionicons name="close" size={16} color={colors.inkFaint} />
            </Pressable>
          </View>
        )}
        <View style={s.composerRow}>
          <TextInput
            style={s.composerInput}
            placeholder={replyTo ? 'Write a reply…' : 'Add a comment…'}
            placeholderTextColor={colors.inkFaint}
            value={draft}
            onChangeText={setDraft}
            multiline
          />
          <Pressable style={[s.sendBtn, !canPost && s.sendBtnDisabled]} disabled={!canPost} onPress={handlePost}>
            <Ionicons name="arrow-up" size={18} color="#fff" />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingBottom: spacing.md,
  },
  backBtn: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: fonts.displaySemibold, fontSize: fontSizes.lg, color: '#fff' },

  body: { flex: 1, padding: spacing.lg },

  postCard: {
    backgroundColor: colors.surface, borderRadius: radii.xl, padding: spacing.lg, gap: spacing.sm, ...shadow.sm,
  },
  postTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  postAnonDot: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: colors.coralSoft,
    alignItems: 'center', justifyContent: 'center',
  },
  postAnonEmoji: { fontSize: 16 },
  postAuthor: { fontFamily: fonts.bodyBold, fontSize: fontSizes.xs, color: colors.inkSoft },
  postTime: { fontFamily: fonts.bodyMedium, fontSize: 10, color: colors.inkFaint, marginTop: 1 },
  postText: { fontFamily: fonts.bodyMedium, fontSize: fontSizes.sm, color: colors.ink, lineHeight: 20 },

  sectionTitle: {
    fontFamily: fonts.bodyBold, fontSize: fontSizes.sm, color: colors.inkSoft,
    marginTop: spacing.lg, marginBottom: spacing.sm,
  },

  alertBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.errorSoft, borderRadius: radii.md, padding: spacing.md,
  },
  alertText: { fontFamily: fonts.bodyMedium, fontSize: fontSizes.sm, color: colors.errorDeep, flex: 1 },
  retryText: { fontFamily: fonts.bodyBold, fontSize: fontSizes.sm, color: colors.error },

  emptyWrap: { alignItems: 'center', paddingVertical: spacing.xxl, gap: 4 },
  emptyTitle: { fontFamily: fonts.bodyBold, fontSize: fontSizes.md, color: colors.ink },
  emptySub: { fontFamily: fonts.bodyMedium, fontSize: fontSizes.sm, color: colors.inkFaint },

  commentWrap: { marginTop: spacing.sm },
  commentCard: {
    backgroundColor: colors.surface, borderRadius: radii.md, padding: spacing.md, gap: 6, ...shadow.sm,
  },
  commentTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  commentAuthor: { fontFamily: fonts.bodyBold, fontSize: fontSizes.xs, color: colors.inkSoft },
  commentTime: { fontFamily: fonts.bodyMedium, fontSize: 10, color: colors.inkFaint, flex: 1 },
  commentMenuIcon: { fontSize: 16, color: colors.inkFaint, paddingHorizontal: 4 },
  commentText: { fontFamily: fonts.bodyMedium, fontSize: fontSizes.sm, color: colors.ink, lineHeight: 19 },
  replyLink: { fontFamily: fonts.bodyBold, fontSize: 11, color: colors.sage, marginTop: 2 },

  editRow: { gap: 6 },
  editInput: {
    borderWidth: 1, borderColor: colors.line, borderRadius: 10, padding: 8,
    fontFamily: fonts.body, fontSize: fontSizes.sm, color: colors.ink, minHeight: 44,
  },
  editActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.md },
  editCancel: { fontFamily: fonts.bodyBold, fontSize: fontSizes.xs, color: colors.inkFaint },
  editSave: { fontFamily: fonts.bodyBold, fontSize: fontSizes.xs, color: colors.sage },

  composer: {
    borderTopWidth: 1, borderTopColor: colors.line, backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg, paddingTop: spacing.sm,
  },
  replyBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.bg, borderRadius: radii.sm, paddingHorizontal: 10, paddingVertical: 6, marginBottom: 6,
  },
  replyBannerText: { fontFamily: fonts.bodyMedium, fontSize: fontSizes.xs, color: colors.inkSoft, flex: 1 },
  composerRow: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm },
  composerInput: {
    flex: 1, maxHeight: 100, minHeight: 40, borderWidth: 1.5, borderColor: colors.line,
    borderRadius: radii.pill, paddingHorizontal: spacing.md, paddingVertical: 8,
    fontFamily: fonts.body, fontSize: fontSizes.sm, color: colors.ink,
  },
  sendBtn: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: colors.sage,
    alignItems: 'center', justifyContent: 'center', marginBottom: 2,
  },
  sendBtnDisabled: { opacity: 0.4 },
});
