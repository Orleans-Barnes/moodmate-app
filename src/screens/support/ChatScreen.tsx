import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useToast } from '@/state/useToast';
import { useAuthStore } from '@/state/useAuthStore';
import { listMessages, markRead, sendMessage } from '@/api/support';
import { ApiRequestError } from '@/api/client';
import type { MessageResponse } from '@/api/types';
import { supabase } from '@/lib/supabase';
import { colors, fonts, fontSizes, radii, spacing } from '@/theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'Chat'>;

export function ChatScreen({ route, navigation }: Props) {
  const { conversationId, otherPartyName } = route.params;
  const insets   = useSafeAreaInsets();
  const [messages, setMessages] = useState<MessageResponse[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [draft,    setDraft]    = useState('');
  const [sending,  setSending]  = useState(false);
  const [realtime, setRealtime] = useState(false); // connected to Supabase RT
  const scrollRef  = useRef<ScrollView>(null);
  const toast      = useToast();
  const token      = useAuthStore((s) => s.token);

  const load = useCallback(async (silent = false) => {
    if (!token) return;
    if (!silent) setLoading(true);
    try {
      const page = await listMessages(token, conversationId);
      setMessages(page.content);
      await markRead(token, conversationId);
    } catch (err) {
      if (!silent) toast(err instanceof ApiRequestError ? err.message : 'Could not load this conversation.');
    } finally {
      setLoading(false);
    }
  }, [token, conversationId, toast]);

  // ── Supabase real-time subscription ──────────────────────────────────────
  useEffect(() => {
    // Gracefully skip if Supabase hasn't been configured yet (placeholder URL)
    const url = (supabase as any).supabaseUrl as string;
    if (!url || url.includes('YOUR_PROJECT_ID')) return;

    const channel = supabase
      .channel(`conv-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event:  'INSERT',
          schema: 'public',
          table:  'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        () => {
          // A new message arrived — refresh from the MoodMate REST API
          load(true);
        },
      )
      .subscribe((status) => {
        setRealtime(status === 'SUBSCRIBED');
      });

    return () => { supabase.removeChannel(channel); };
  }, [conversationId, load]);

  // ── Fallback polling (5s) while real-time is not connected ───────────────
  useFocusEffect(
    useCallback(() => {
      load();
      const id = setInterval(() => { if (!realtime) load(true); }, 3000);
      return () => clearInterval(id);
    }, [load, realtime])
  );

  const handleSend = async () => {
    const body = draft.trim();
    if (!body || !token) return;
    setSending(true);
    try {
      const sent = await sendMessage(token, conversationId, body);
      setMessages((cur) => [...cur, sent]);
      setDraft('');
      requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
    } catch (err) {
      toast(err instanceof ApiRequestError ? err.message : 'Message did not send.');
    } finally {
      setSending(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ScreenHeader
          title={otherPartyName}
          onClose={() => navigation.goBack()}
        />

        {/* Real-time indicator */}
        {realtime && (
          <View style={styles.rtBadge}>
            <View style={styles.rtDot} />
            <Text style={styles.rtText}>Live</Text>
          </View>
        )}

        {loading && messages.length === 0 ? (
          <ActivityIndicator color={colors.coral} style={styles.spinner} />
        ) : (
          <ScrollView
            ref={scrollRef}
            style={styles.flex}
            contentContainerStyle={styles.messagesContent}
            onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
          >
            {messages.length === 0 && (
              <Text style={styles.emptyText}>
                No messages yet. Say hello to {otherPartyName}!
              </Text>
            )}
            {messages.map((m) => {
              const fromMe = m.senderType === 'USER';
              return (
                <View
                  key={m.id}
                  style={[styles.bubbleRow, fromMe ? styles.bubbleRowRight : styles.bubbleRowLeft]}
                >
                  <View style={[styles.bubble, fromMe ? styles.bubbleRight : styles.bubbleLeft]}>
                    <Text style={fromMe ? styles.bubbleTextRight : styles.bubbleTextLeft}>
                      {m.body}
                    </Text>
                  </View>
                </View>
              );
            })}
          </ScrollView>
        )}

        <View style={[styles.composer, { paddingBottom: Math.max(insets.bottom, spacing.sm) }]}>
          <TextInput
            style={styles.input}
            placeholder="Type a message…"
            placeholderTextColor={colors.inkFaint}
            value={draft}
            onChangeText={setDraft}
            multiline
            returnKeyType="send"
            onSubmitEditing={handleSend}
            blurOnSubmit={false}
          />
          <Pressable
            style={[styles.sendBtn, (!draft.trim() || sending) && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!draft.trim() || sending}
            accessibilityRole="button"
            accessibilityLabel="Send message"
          >
            <Text style={styles.sendBtnText}>{sending ? '…' : 'Send'}</Text>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex:            { flex: 1 },
  container:       { flex: 1, backgroundColor: colors.bg },
  spinner:         { marginTop: spacing.xxl },
  emptyText: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.sm,
    color: colors.inkFaint,
    textAlign: 'center',
    marginTop: spacing.xxl,
  },
  rtBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'center',
    backgroundColor: '#ECFDF5',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginBottom: 4,
  },
  rtDot: {
    width: 7, height: 7,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  rtText: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.xs,
    color: '#10B981',
  },
  messagesContent: { padding: spacing.lg, gap: spacing.sm },
  bubbleRow:       { flexDirection: 'row' },
  bubbleRowRight:  { justifyContent: 'flex-end' },
  bubbleRowLeft:   { justifyContent: 'flex-start' },
  bubble: {
    maxWidth: '78%',
    borderRadius: radii.lg,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleRight: { backgroundColor: colors.coral },
  bubbleLeft: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.line,
  },
  bubbleTextRight: { fontFamily: fonts.bodyMedium, fontSize: fontSizes.sm, color: '#FFFFFF' },
  bubbleTextLeft:  { fontFamily: fonts.bodyMedium, fontSize: fontSizes.sm, color: colors.ink },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    backgroundColor: colors.surface,
  },
  input: {
    flex: 1,
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.sm,
    color: colors.ink,
    backgroundColor: colors.bg,
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: colors.line,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 9,
    maxHeight: 110,
  },
  sendBtn: {
    backgroundColor: colors.coral,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 11,
  },
  sendBtnDisabled: { opacity: 0.5 },
  sendBtnText: { fontFamily: fonts.bodyBold, fontSize: fontSizes.sm, color: '#FFFFFF' },
});
