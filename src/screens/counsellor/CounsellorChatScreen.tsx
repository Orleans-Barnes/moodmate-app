import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, TextInput, ScrollView, Pressable, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { useToast } from '@/state/useToast';
import { useAuthStore } from '@/state/useAuthStore';
import { listCounsellorMessages, markCounsellorRead, sendCounsellorMessage } from '@/api/support';
import { ApiRequestError } from '@/api/client';
import type { MessageResponse } from '@/api/types';
import { hapticLight } from '@/utils/haptics';
import { supabase } from '@/lib/supabase';
import { colors, fonts, fontSizes, radii, spacing, shadow } from '@/theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'CounsellorChat'>;

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

export function CounsellorChatScreen({ route, navigation }: Props) {
  const { conversationId, studentName } = route.params;
  const insets   = useSafeAreaInsets();
  const toast    = useToast();
  const token    = useAuthStore((s) => s.token);
  const user     = useAuthStore((s) => s.user);

  const [messages, setMessages] = useState<MessageResponse[]>([]);
  const [loading, setLoading]   = useState(true);
  const [draft, setDraft]       = useState('');
  const [sending, setSending]   = useState(false);
  const [realtime, setRealtime] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const load = useCallback(async (silent = false) => {
    if (!token) return;
    if (!silent) setLoading(true);
    try {
      const page = await listCounsellorMessages(token, conversationId);
      setMessages(page.content);
      await markCounsellorRead(token, conversationId);
    } catch (err) {
      if (!silent) toast(err instanceof ApiRequestError ? err.message : 'Could not load messages.');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [token, conversationId, toast]);

  // ── Supabase real-time subscription ──────────────────────────────────────
  useEffect(() => {
    const url = (supabase as any).supabaseUrl as string;
    if (!url || url.includes('YOUR_PROJECT_ID')) return;

    const channel = supabase
      .channel(`conv-counsellor-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event:  'INSERT',
          schema: 'public',
          table:  'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        () => { load(true); },
      )
      .subscribe((status) => {
        setRealtime(status === 'SUBSCRIBED');
      });

    return () => { supabase.removeChannel(channel); };
  }, [conversationId, load]);

  useFocusEffect(useCallback(() => {
    load();
    const id = setInterval(() => { if (!realtime) load(true); }, 3000);
    return () => clearInterval(id);
  }, [load, realtime]));

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
      const msg = await sendCounsellorMessage(token, conversationId, body);
      setMessages(prev => [...prev, msg]);
    } catch (err) {
      toast(err instanceof ApiRequestError ? err.message : 'Send failed.');
      setDraft(body);
    } finally {
      setSending(false);
    }
  }

  const initials = studentName.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);
  const myInitials = (user?.fullName ?? 'C').split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);
  const groups = groupByDate(messages);

  return (
    <KeyboardAvoidingView
      style={s.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      {/* Header */}
      <LinearGradient
        colors={['#1B4F72', '#2980B9']}
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
        {realtime && (
          <View style={s.rtBadge}>
            <View style={s.rtDot} />
            <Text style={s.rtTxt}>Live</Text>
          </View>
        )}
      </LinearGradient>

      {/* Messages */}
      {loading ? (
        <View style={s.loadingWrap}>
          <ActivityIndicator color="#2980B9" size="large" />
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
              <Text style={s.emptyEmoji}>💬</Text>
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
                  const isMine = msg.senderType === 'COUNSELLOR';
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

      {/* Input bar */}
      <View style={[s.inputBar, { paddingBottom: insets.bottom + 8 }]}>
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
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F0F6FF' },

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
  dateLine: { flex: 1, height: 1, backgroundColor: '#D6E4F0' },
  dateTxt: { fontFamily: fonts.bodyMedium, fontSize: 10, color: colors.inkFaint },

  bubbleRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 8, gap: 6 },
  bubbleRowMine: { justifyContent: 'flex-end' },
  bubbleRowTheirs: { justifyContent: 'flex-start' },

  theirAvatar: {
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: '#2980B9', alignItems: 'center', justifyContent: 'center',
  },
  theirAvatarTxt: { fontFamily: fonts.bodyBold, fontSize: 9, color: '#FFFFFF' },
  myAvatar: {
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: '#1B4F72', alignItems: 'center', justifyContent: 'center',
  },
  myAvatarTxt: { fontFamily: fonts.bodyBold, fontSize: 9, color: '#FFFFFF' },

  bubble: { maxWidth: '72%', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10 },
  bubbleMine: {
    backgroundColor: '#1B4F72',
    borderBottomRightRadius: 4,
  },
  bubbleTheirs: {
    backgroundColor: '#FFFFFF',
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
    backgroundColor: '#FFFFFF', paddingHorizontal: spacing.md,
    paddingTop: 10, borderTopWidth: 1, borderTopColor: '#D6E4F0',
  },
  input: {
    flex: 1, fontFamily: fonts.bodyMedium, fontSize: fontSizes.sm,
    color: colors.ink, maxHeight: 120,
    backgroundColor: '#F0F6FF', borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 10,
  },
  sendBtn: {
    width: 42, height: 42, borderRadius: 13,
    backgroundColor: '#1B4F72', alignItems: 'center', justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: '#BDC3C7' },
  sendIcon: { fontSize: 20, color: '#FFFFFF', fontWeight: '700' },

  rtBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3,
  },
  rtDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#4ADE80' },
  rtTxt: { fontFamily: fonts.bodyBold, fontSize: 10, color: '#FFFFFF' },
});
