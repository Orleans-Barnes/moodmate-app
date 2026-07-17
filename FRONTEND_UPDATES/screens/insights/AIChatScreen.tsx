import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, KeyboardAvoidingView, Platform, Animated, StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { fonts, fontSizes } from '@/theme/tokens';
import { useAuthStore } from '@/state/useAuthStore';
import { useToast } from '@/state/useToast';

// ─── Design system ─────────────────────────────────────────────────────────
const BG     = '#0F0A2E';
const PURPLE = '#7C3AED';
const PL     = '#EDE9FE';
const PM     = '#C4B5FD';
const DARK   = '#1A0D40';
const MUTED  = '#8B6FC8';
const WHITE  = '#FFFFFF';
const GRAD_H = ['#1A0A3C', '#3B1275', '#7C3AED'] as const;

const SUGGESTIONS = [
  "I'm feeling anxious today",
  'Help me with breathing',
  "I can't focus on my studies",
  'I need motivation',
];

interface Msg { id: string; role: 'user' | 'ai'; text: string; ts: Date; }

const AI_GREET: Msg = {
  id: '0', role: 'ai', ts: new Date(),
  text: "Hello! I'm your MoodMate AI companion. I'm here to listen and support you. How are you feeling today?",
};

export function AIChatScreen() {
  const nav    = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const user   = useAuthStore(s => s.user);
  const toast  = useToast();
  const token  = useAuthStore(s => s.token);

  const [msgs, setMsgs]   = useState<Msg[]>([AI_GREET]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const inputRef  = useRef<TextInput>(null);

  const scrollDown = () => setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);

  const send = useCallback(async (text: string) => {
    if (!text.trim()) return;
    const userMsg: Msg = { id: Date.now().toString(), role: 'user', text: text.trim(), ts: new Date() };
    setMsgs(m => [...m, userMsg]);
    setInput('');
    setLoading(true);
    scrollDown();

    try {
      const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL ?? 'http://10.0.2.2:8080'}/api/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message: text.trim() }),
      });
      const data = await res.json();
      const reply = data.reply ?? data.response ?? "I'm here for you. Can you tell me more?";
      setMsgs(m => [...m, { id: Date.now().toString() + 'ai', role: 'ai', text: reply, ts: new Date() }]);
    } catch {
      setMsgs(m => [...m, { id: Date.now().toString() + 'ai', role: 'ai', text: "I'm here for you. Can you tell me more about how you're feeling?", ts: new Date() }]);
    } finally {
      setLoading(false);
      scrollDown();
    }
  }, [token]);

  const fmt = (d: Date) => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle="light-content" />
      <View style={[s.root, { backgroundColor: BG }]}>

        {/* Header */}
        <LinearGradient colors={GRAD_H} style={[s.header, { paddingTop: insets.top + 14 }]}>
          <TouchableOpacity onPress={() => nav.goBack()} style={s.backBtn}>
            <Ionicons name="chevron-back" size={24} color={WHITE} />
          </TouchableOpacity>
          <View style={s.aiInfo}>
            <View style={s.aiAvatar}>
              <Ionicons name="hardware-chip-outline" size={20} color={WHITE} />
            </View>
            <View>
              <Text style={s.aiName}>MoodMate AI</Text>
              <View style={s.onlineRow}>
                <View style={s.onlineDot} />
                <Text style={s.onlineTxt}>Always here for you</Text>
              </View>
            </View>
          </View>
          <TouchableOpacity style={s.headerBtn}>
            <Ionicons name="ellipsis-horizontal" size={20} color={WHITE} />
          </TouchableOpacity>
        </LinearGradient>

        {/* Disclaimer */}
        <View style={s.disclaimer}>
          <Ionicons name="information-circle-outline" size={14} color={PM} />
          <Text style={s.disclaimerTxt}>AI support only — not a substitute for professional care</Text>
        </View>

        {/* Messages */}
        <ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          contentContainerStyle={[s.msgs, { paddingBottom: 16 }]}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={scrollDown}
        >
          {msgs.map(msg => (
            <View key={msg.id} style={[s.msgRow, msg.role === 'user' && s.msgRowUser]}>
              {msg.role === 'ai' && (
                <View style={s.aiBubbleAvatar}>
                  <Ionicons name="hardware-chip-outline" size={14} color={WHITE} />
                </View>
              )}
              <View style={[s.bubble, msg.role === 'user' ? s.bubbleUser : s.bubbleAi]}>
                <Text style={[s.bubbleTxt, msg.role === 'user' && { color: WHITE }]}>{msg.text}</Text>
                <Text style={[s.bubbleTime, msg.role === 'user' && { color: 'rgba(255,255,255,0.6)' }]}>{fmt(msg.ts)}</Text>
              </View>
            </View>
          ))}

          {loading && (
            <View style={s.msgRow}>
              <View style={s.aiBubbleAvatar}>
                <Ionicons name="hardware-chip-outline" size={14} color={WHITE} />
              </View>
              <View style={s.bubbleAi}>
                <Text style={{ color: MUTED, fontFamily: fonts.body }}>Typing...</Text>
              </View>
            </View>
          )}

          {/* Suggestions (only at start) */}
          {msgs.length === 1 && (
            <View style={s.suggestionsWrap}>
              <Text style={s.suggestionsHdr}>Quick starts</Text>
              <View style={s.suggestionsRow}>
                {SUGGESTIONS.map(sg => (
                  <TouchableOpacity key={sg} style={s.suggPill} onPress={() => send(sg)}>
                    <Text style={s.suggTxt}>{sg}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </ScrollView>

        {/* Input */}
        <View style={[s.inputBar, { paddingBottom: insets.bottom + 12 }]}>
          <TextInput
            ref={inputRef}
            style={s.inputField}
            placeholder="How are you feeling?"
            placeholderTextColor="rgba(196,181,253,0.5)"
            value={input}
            onChangeText={setInput}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[s.sendBtn, !input.trim() && s.sendBtnDisabled]}
            onPress={() => send(input)}
            disabled={!input.trim() || loading}
          >
            <LinearGradient colors={['#7C3AED', '#9333EA']} style={s.sendGrad}>
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
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 16, gap: 12 },
  backBtn:    { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  aiInfo:     { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  aiAvatar:   { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)' },
  aiName:     { fontFamily: fonts.displaySemibold, fontSize: fontSizes.base, color: WHITE },
  onlineRow:  { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  onlineDot:  { width: 6, height: 6, borderRadius: 3, backgroundColor: '#52B788' },
  onlineTxt:  { fontFamily: fonts.body, fontSize: fontSizes.xs, color: 'rgba(255,255,255,0.65)' },
  headerBtn:  { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },

  disclaimer:    { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(124,58,237,0.15)', paddingHorizontal: 16, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(124,58,237,0.2)' },
  disclaimerTxt: { fontFamily: fonts.body, fontSize: fontSizes.xs, color: PM, flex: 1 },

  msgs:    { paddingHorizontal: 16, paddingTop: 16 },
  msgRow:  { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginBottom: 12 },
  msgRowUser: { justifyContent: 'flex-end' },

  aiBubbleAvatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: PURPLE, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  bubble:     { maxWidth: '78%', borderRadius: 18, padding: 12 },
  bubbleAi:   { backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(196,181,253,0.2)', borderBottomLeftRadius: 4 },
  bubbleUser: { backgroundColor: PURPLE, borderBottomRightRadius: 4 },
  bubbleTxt:  { fontFamily: fonts.body, fontSize: fontSizes.base, color: 'rgba(255,255,255,0.9)', lineHeight: 22 },
  bubbleTime: { fontFamily: fonts.body, fontSize: 10, color: MUTED, marginTop: 4, textAlign: 'right' },

  suggestionsWrap: { marginTop: 8 },
  suggestionsHdr:  { fontFamily: fonts.bodyMedium, fontSize: fontSizes.sm, color: MUTED, marginBottom: 8 },
  suggestionsRow:  { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  suggPill:        { backgroundColor: 'rgba(124,58,237,0.25)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(196,181,253,0.3)' },
  suggTxt:         { fontFamily: fonts.body, fontSize: fontSizes.sm, color: PM },

  inputBar:   { flexDirection: 'row', alignItems: 'flex-end', gap: 10, paddingHorizontal: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(124,58,237,0.2)', backgroundColor: '#0F0A2E' },
  inputField: { flex: 1, backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 12, fontFamily: fonts.body, fontSize: fontSizes.base, color: WHITE, maxHeight: 120, borderWidth: 1, borderColor: 'rgba(196,181,253,0.2)' },
  sendBtn:        { },
  sendBtnDisabled:{ opacity: 0.4 },
  sendGrad:       { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
});
