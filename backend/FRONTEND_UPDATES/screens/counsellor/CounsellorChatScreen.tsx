import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, KeyboardAvoidingView, Platform, StatusBar, Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { fonts, fontSizes } from '@/theme/tokens';
import { useAuthStore } from '@/state/useAuthStore';
import { useToast } from '@/state/useToast';

// ─── Design system ─────────────────────────────────────────────────────────
const BG     = '#F0EBFF';
const PURPLE = '#7C3AED';
const PL     = '#EDE9FE';
const PM     = '#C4B5FD';
const DARK   = '#1A0D40';
const MUTED  = '#8B6FC8';
const WHITE  = '#FFFFFF';
const GRAD_H = ['#1A0A3C', '#3B1275', '#7C3AED'] as const;

interface Msg { id: string; role: 'user' | 'counsellor'; text: string; ts: Date; reaction?: string; }

export function CounsellorChatScreen() {
  const nav    = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const route  = useRoute<any>();
  const toast  = useToast();
  const token  = useAuthStore(s => s.token);

  const { conversationId, studentName = 'Counsellor' } = route.params ?? {};

  const [msgs, setMsgs]   = useState<Msg[]>([
    { id: '1', role: 'counsellor', text: `Hello! I'm ready to support you today. What's on your mind?`, ts: new Date() },
  ]);
  const [input, setInput]   = useState('');
  const [loading, setLoading] = useState(false);
  const [longPressMsg, setLongPressMsg] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  const scrollDown = () => setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);

  const send = useCallback(async () => {
    if (!input.trim()) return;
    const msg: Msg = { id: Date.now().toString(), role: 'user', text: input.trim(), ts: new Date() };
    setMsgs(m => [...m, msg]);
    setInput('');
    scrollDown();
    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL ?? 'http://10.0.2.2:8080'}/api/conversations/${conversationId}/messages`,
        { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ content: msg.text }) }
      );
      const data = await res.json();
      if (data.reply) setMsgs(m => [...m, { id: Date.now() + 'c', role: 'counsellor', text: data.reply, ts: new Date() }]);
    } catch { /* silently fail */ }
    finally { setLoading(false); scrollDown(); }
  }, [input, conversationId, token]);

  const addReaction = (msgId: string, icon: string) => {
    setMsgs(m => m.map(msg => msg.id === msgId ? { ...msg, reaction: icon } : msg));
    setLongPressMsg(null);
  };

  const fmt = (d: Date) => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const initials = studentName.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle="light-content" />
      <View style={[s.root, { backgroundColor: BG }]}>

        {/* Header */}
        <LinearGradient colors={GRAD_H} style={[s.header, { paddingTop: insets.top + 14 }]}>
          <TouchableOpacity onPress={() => nav.goBack()} style={s.backBtn}>
            <Ionicons name="chevron-back" size={24} color={WHITE} />
          </TouchableOpacity>
          <View style={s.counsellorInfo}>
            <View style={s.avatarWrap}>
              <View style={s.avatar}>
                <Text style={s.avatarTxt}>{initials}</Text>
              </View>
              <View style={s.onlineDot} />
            </View>
            <View>
              <Text style={s.counsellorName}>{studentName}</Text>
              <Text style={s.statusTxt}>Session active</Text>
            </View>
          </View>
          <View style={s.headerActions}>
            <TouchableOpacity style={s.hBtn}>
              <Ionicons name="call-outline" size={20} color={WHITE} />
            </TouchableOpacity>
            <TouchableOpacity style={s.hBtn}>
              <Ionicons name="ellipsis-vertical" size={20} color={WHITE} />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Messages */}
        <ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          contentContainerStyle={s.msgs}
          showsVerticalScrollIndicator={false}
          onTouchStart={() => setLongPressMsg(null)}
        >
          {/* Date separator */}
          <View style={s.dateSep}>
            <View style={s.dateLine} />
            <Text style={s.dateTxt}>Today</Text>
            <View style={s.dateLine} />
          </View>

          {msgs.map(msg => {
            const isUser = msg.role === 'user';
            return (
              <TouchableOpacity
                key={msg.id}
                activeOpacity={0.85}
                style={[s.row, isUser && s.rowUser]}
                onLongPress={() => setLongPressMsg(msg.id)}
              >
                {!isUser && (
                  <View style={s.avatar2}>
                    <Text style={s.avatarTxt2}>{initials}</Text>
                  </View>
                )}
                <View style={[s.bubble, isUser ? s.bubbleUser : s.bubbleCounsellor]}>
                  <Text style={[s.bubbleTxt, isUser && { color: WHITE }]}>{msg.text}</Text>
                  <View style={s.bubbleMeta}>
                    <Text style={[s.timeTxt, isUser && { color: 'rgba(255,255,255,0.6)' }]}>{fmt(msg.ts)}</Text>
                    {isUser && <Ionicons name="checkmark-done" size={13} color="rgba(255,255,255,0.7)" />}
                  </View>
                  {msg.reaction && (
                    <View style={s.reactionBadge}>
                      <Ionicons name={msg.reaction as any} size={14} color={PURPLE} />
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}

          {loading && (
            <View style={s.row}>
              <View style={s.avatar2}><Text style={s.avatarTxt2}>{initials}</Text></View>
              <View style={s.bubbleCounsellor}>
                <Text style={{ fontFamily: fonts.body, color: MUTED }}>Typing...</Text>
              </View>
            </View>
          )}

          {/* Reaction picker */}
          {longPressMsg && (
            <View style={s.reactionPicker}>
              {(['thumbs-up', 'heart', 'happy-outline', 'sad-outline'] as const).map(icon => (
                <TouchableOpacity key={icon} style={s.reactionOption} onPress={() => addReaction(longPressMsg, icon)}>
                  <Ionicons name={icon} size={22} color={PURPLE} />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>

        {/* Input */}
        <View style={[s.inputBar, { paddingBottom: insets.bottom + 12 }]}>
          <TextInput
            style={s.inputField}
            placeholder="Type a message..."
            placeholderTextColor={PM}
            value={input}
            onChangeText={setInput}
            multiline
            maxLength={500}
          />
          <TouchableOpacity onPress={send} disabled={!input.trim() || loading}>
            <LinearGradient colors={['#7C3AED', '#9333EA']} style={[s.sendBtn, (!input.trim() || loading) && { opacity: 0.45 }]}>
              <Ionicons name="send" size={18} color={WHITE} />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root:   { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 16, gap: 10 },
  backBtn:        { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  counsellorInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatarWrap: { position: 'relative' },
  avatar:     { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.4)' },
  avatarTxt:  { fontFamily: fonts.displaySemibold, fontSize: 14, color: WHITE },
  onlineDot:  { position: 'absolute', bottom: 1, right: 1, width: 10, height: 10, borderRadius: 5, backgroundColor: '#52B788', borderWidth: 1.5, borderColor: WHITE },
  counsellorName: { fontFamily: fonts.displaySemibold, fontSize: fontSizes.base, color: WHITE },
  statusTxt:      { fontFamily: fonts.body, fontSize: fontSizes.xs, color: 'rgba(255,255,255,0.65)' },
  headerActions:  { flexDirection: 'row', gap: 4 },
  hBtn:           { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },

  msgs:    { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16 },
  dateSep: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 12 },
  dateLine:{ flex: 1, height: 1, backgroundColor: PM + '60' },
  dateTxt: { fontFamily: fonts.body, fontSize: fontSizes.xs, color: MUTED },

  row:     { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginBottom: 10 },
  rowUser: { justifyContent: 'flex-end' },

  avatar2:    { width: 30, height: 30, borderRadius: 15, backgroundColor: PL, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  avatarTxt2: { fontFamily: fonts.bodyBold, fontSize: 11, color: PURPLE },

  bubble:          { maxWidth: '76%', borderRadius: 18, padding: 12 },
  bubbleCounsellor:{ backgroundColor: WHITE, borderBottomLeftRadius: 4, shadowColor: PURPLE, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 6, elevation: 2 },
  bubbleUser:      { backgroundColor: PURPLE, borderBottomRightRadius: 4 },
  bubbleTxt:       { fontFamily: fonts.body, fontSize: fontSizes.base, color: DARK, lineHeight: 21 },
  bubbleMeta:      { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4, justifyContent: 'flex-end' },
  timeTxt:         { fontFamily: fonts.body, fontSize: 10, color: MUTED },
  reactionBadge:   { position: 'absolute', bottom: -8, right: 8, backgroundColor: WHITE, borderRadius: 10, padding: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },

  reactionPicker: { flexDirection: 'row', backgroundColor: WHITE, borderRadius: 28, padding: 8, gap: 4, alignSelf: 'center', shadowColor: PURPLE, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 6, marginBottom: 8 },
  reactionOption: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 22 },

  inputBar:   { flexDirection: 'row', alignItems: 'flex-end', gap: 10, paddingHorizontal: 16, paddingTop: 10, borderTopWidth: 1, borderTopColor: PL, backgroundColor: WHITE },
  inputField: { flex: 1, backgroundColor: BG, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10, fontFamily: fonts.body, fontSize: fontSizes.base, color: DARK, maxHeight: 120, borderWidth: 1, borderColor: PL },
  sendBtn:    { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
});
