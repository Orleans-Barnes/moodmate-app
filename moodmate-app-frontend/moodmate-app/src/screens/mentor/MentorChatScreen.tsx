import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, TextInput, ScrollView, Pressable, StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { useToast } from '@/state/useToast';
import { useAuthStore } from '@/state/useAuthStore';
import { useKeyboardOffset } from '@/hooks/useKeyboardOffset';
import { listMentorMessages, markMentorRead, sendMentorMessage } from '@/api/support';
import { ApiRequestError } from '@/api/client';
import type { MessageResponse } from '@/api/types';
import { hapticLight } from '@/utils/haptics';
import { colors, fonts, fontSizes, spacing, shadow } from '@/theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'MentorChat'>;

function formatBubbleTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function groupByDate(messages: MessageResponse[]): Array<{ date: string; items: MessageResponse[] }> {
  const groups: Record<string, MessageResponse[]> = {};
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();
  for (const m of messages) {
    const d = new Date(m.createdAt).toDateString();
    const label = d === today ? 'Today' : d === yesterday ? 'Yesterday'
      : new Date(m.createdAt).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
    if (!groups[label]) groups[label] = [];
    groups[label].push(m);
  }
  return Object.entries(groups).map(([date, items]) => ({ date, items }));
}

/** Phase 1G - mirrors CounsellorChatScreen.tsx exactly (including the "· Read" indicator and
 * polling fallback), adapted to mentor API calls and SenderType.PEER_MENTOR for "isMine". No
 * Supabase real-time subscription here (deliberately trimmed - polling every 3s is the same
 * fallback CounsellorChatScreen uses when real-time isn't connected, and adding a second
 * `conv-mentor-*` channel wasn't necessary to close this phase's core request/accept/chat loop). */
export function MentorChatScreen({ route, navigation }: Props) {
  const { conversationId, studentName } = route.params;
  const insets   = useSafeAreaInsets();
  const toast    = useToast();
  const token    = useAuthStore((s) => s.token);
  const user     = useAuthStore((s) => s.user);

  const [messages, setMessages] = useState<MessageResponse[]>([]);
  const [loading, setLoading]   = useState(true);
  const [draft, setDraft]       = useState('');
  const [sending, setSending]   = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const keyboardHeight = useKeyboardOffset();

  const load = useCallback(async (silent = false) => {
    if (!token) return;
    if (!silent) setLoading(true);
    try {
      const page = await listMentorMessages(token, conversationId);
      setMessages(page.content);
      await markMentorRead(token, conversationId);
    } catch (err) {
      if (!silent) toast(err instanceof ApiRequestError ? err.message : 'Could not load messages.');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [token, conversationId, toast]);

  useFocusEffect(useCallback(() => {
    load();
    const id = setInterval(() => load(true), 3000);
    return () => clearInterval(id);
  }, [load]));

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length]);

  async function send() {
    const body = draft.trim();
    if (!body || sending || !token) return;
    setSending(true);
    setDraft('');
    hapticLight();
    try {
      const msg = await sendMentorMessage(token, conversationId, body);
      setMessages(prev => [...prev, msg]);
    } catch (err) {
      toast(err instanceof ApiRequestError ? err.message : 'Send failed.');
      setDraft(body);
    } finally {
      setSending(false);
    }
  }

  const initials = studentName.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);
  const myInitials = (user?.fullName ?? 'M').split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);
  const groups = groupByDate(messages);

  return (
    <View style={[s.root, { paddingBottom: keyboardHeight }]}>
      <LinearGradient
        colors={['#468752', '#579E65']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[s.header, { paddingTop: insets.top + 4 }]}
      >
        <Pressable style={s.backBtn} onPress={() => navigation.goBack()}>
          <Text style={s.backTxt}>‹</Text>
        </Pressable>
        <View style={s.headerAvatar}>
          <Text style={s.headerAvatarTxt}>{initials}</Text>
        </View>
        <View style={s.headerMeta}>
          <Text style={s.headerName}>{studentName}</Text>
          <Text style={s.headerSub}>Student · {messages.length} messages</Text>
        </View>
      </LinearGradient>

      {loading ? (
        <View style={s.loadingWrap}>
          <ActivityIndicator color={colors.sageDeep} size="large" />
        </View>
      ) : (
        <ScrollView
          ref={scrollRef}
          style={s.scroll}
          contentContainerStyle={[s.scrollContent, { paddingBottom: 16 }]}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
        >
          {messages.length === 0 ? (
            <View style={s.emptyBox}>
              <Ionicons name="chatbubbles-outline" size={36} color={colors.inkFaint} />
              <Text style={s.emptyTitle}>Start the conversation</Text>
              <Text style={s.emptySub}>This is the beginning of your conversation with {studentName}</Text>
            </View>
          ) : (
            groups.map(({ date, items }) => (
              <View key={date}>
                <View style={s.dateSep}>
                  <View style={s.dateLine} />
                  <Text style={s.dateTxt}>{date}</Text>
                  <View style={s.dateLine} />
                </View>
                {items.map((msg) => {
                  const isMine = msg.senderType === 'PEER_MENTOR';
                  return (
                    <View key={msg.id} style={[s.bubbleRow, isMine ? s.bubbleRowMine : s.bubbleRowTheirs]}>
                      {!isMine && (
                        <View style={s.theirAvatar}>
                          <Text style={s.theirAvatarTxt}>{initials}</Text>
                        </View>
                      )}
                      <View style={[s.bubble, isMine ? s.bubbleMine : s.bubbleTheirs]}>
                        <Text style={[s.bubbleTxt, isMine ? s.bubbleTxtMine : s.bubbleTxtTheirs]}>
                          {msg.body}
                        </Text>
                        <Text style={[s.bubbleTime, isMine ? s.bubbleTimeMine : s.bubbleTimeTheirs]}>
                          {formatBubbleTime(msg.createdAt)}
                          {isMine && msg.readAt ? ' · Read' : ''}
                        </Text>
                      </View>
                      {isMine && (
                        <View style={s.myAvatar}>
                          <Text style={s.myAvatarTxt}>{myInitials}</Text>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            ))
          )}
        </ScrollView>
      )}

      <View style={[s.inputBar, { paddingBottom: keyboardHeight > 0 ? 0 : insets.bottom + 8 }]}>
        <TextInput
          style={s.input}
          placeholder={`Message ${studentName}…`}
          placeholderTextColor={colors.inkFaint}
          value={draft}
          onChangeText={setDraft}
          multiline
          maxLength={1000}
          returnKeyType="default"
        />
        <Pressable
          style={[s.sendBtn, (!draft.trim() || sending) && s.sendBtnDisabled]}
          onPress={send}
          disabled={!draft.trim() || sending}
        >
          {sending
            ? <ActivityIndicator color="#FFFFFF" size="small" />
            : <Text style={s.sendIcon}>↑</Text>
          }
        </Pressable>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8F8F8' },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: spacing.md, paddingBottom: 14,
  },
  backBtn: { padding: 4 },
  backTxt: { fontSize: 28, color: '#FFFFFF', lineHeight: 32 },
  headerAvatar: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerAvatarTxt: { fontFamily: fonts.bodyBold, fontSize: fontSizes.sm, color: '#FFFFFF' },
  headerMeta: { flex: 1 },
  headerName: { fontFamily: fonts.bodyBold, fontSize: fontSizes.base, color: '#FFFFFF' },
  headerSub: { fontFamily: fonts.bodyMedium, fontSize: 10, color: 'rgba(255,255,255,0.7)' },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.md, paddingTop: spacing.md },
  dateSep: { flexDirection: 'row', alignItems: 'center', marginVertical: 12, gap: 8 },
  dateLine: { flex: 1, height: 1, backgroundColor: '#DFE6E1' },
  dateTxt: { fontFamily: fonts.bodyMedium, fontSize: 10, color: colors.inkFaint },
  bubbleRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 8, gap: 6 },
  bubbleRowMine: { justifyContent: 'flex-end' },
  bubbleRowTheirs: { justifyContent: 'flex-start' },
  theirAvatar: {
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: colors.sageDeep, alignItems: 'center', justifyContent: 'center',
  },
  theirAvatarTxt: { fontFamily: fonts.bodyBold, fontSize: 9, color: '#FFFFFF' },
  myAvatar: {
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: '#24412A', alignItems: 'center', justifyContent: 'center',
  },
  myAvatarTxt: { fontFamily: fonts.bodyBold, fontSize: 9, color: '#FFFFFF' },
  bubble: { maxWidth: '72%', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10 },
  bubbleMine: {
    backgroundColor: '#24412A',
    borderBottomRightRadius: 4,
  },
  bubbleTheirs: {
    backgroundColor: colors.surface,
    borderBottomLeftRadius: 4,
    ...shadow.sm,
  },
  bubbleTxt: { fontFamily: fonts.bodyMedium, fontSize: fontSizes.sm, lineHeight: 20 },
  bubbleTxtMine: { color: '#FFFFFF' },
  bubbleTxtTheirs: { color: colors.ink },
  bubbleTime: { fontFamily: fonts.bodyMedium, fontSize: 9, marginTop: 4 },
  bubbleTimeMine: { color: 'rgba(255,255,255,0.55)', textAlign: 'right' },
  bubbleTimeTheirs: { color: colors.inkFaint },
  emptyBox: { alignItems: 'center', paddingVertical: 60, gap: 8 },
  emptyEmoji: { fontSize: 40 },
  emptyTitle: { fontFamily: fonts.bodyBold, fontSize: fontSizes.md, color: colors.ink },
  emptySub: { fontFamily: fonts.bodyMedium, fontSize: fontSizes.xs, color: colors.inkFaint, textAlign: 'center' },
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 10,
    backgroundColor: colors.surface, paddingHorizontal: spacing.md,
    paddingTop: 10, borderTopWidth: 1, borderTopColor: '#DFE6E1',
  },
  input: {
    flex: 1, fontFamily: fonts.bodyMedium, fontSize: fontSizes.sm,
    color: colors.ink, maxHeight: 120,
    backgroundColor: '#F8F8F8', borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 10,
  },
  sendBtn: {
    width: 42, height: 42, borderRadius: 13,
    backgroundColor: '#24412A', alignItems: 'center', justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: '#BDC3C7' },
  sendIcon: { fontSize: 20, color: '#FFFFFF', fontWeight: '700' },
});
