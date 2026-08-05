import React, { useState, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, KeyboardAvoidingView, Platform, StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { fonts, fontSizes } from '@/theme/tokens';
import { useAuthStore } from '@/state/useAuthStore';

// ─── Design system ─────────────────────────────────────────────────────────
const BG     = '#F0EBFF';
const PURPLE = '#7C3AED';
const PL     = '#EDE9FE';
const PM     = '#C4B5FD';
const DARK   = '#1A0D40';
const MUTED  = '#8B6FC8';
const WHITE  = '#FFFFFF';
const GRAD_H = ['#1A0A3C', '#3B1275', '#7C3AED'] as const;

interface Message {
  id: string;
  author: string;
  initials: string;
  text: string;
  ts: Date;
  isSelf: boolean;
  color: string;
}

const COLORS = ['#7C3AED', '#2563EB', '#059669', '#D97706', '#DC2626'];

const SEED_MSGS: Message[] = [
  { id: '1', author: 'Kofi A.', initials: 'KA', text: 'Hey everyone, how is everyone doing today?', ts: new Date(Date.now() - 600000), isSelf: false, color: '#2563EB' },
  { id: '2', author: 'Abena D.', initials: 'AD', text: "Feeling a bit anxious about my exams next week but trying to stay calm with the breathing exercises!", ts: new Date(Date.now() - 480000), isSelf: false, color: '#059669' },
  { id: '3', author: 'Yaw M.', initials: 'YM', text: 'The meditation pack helped me so much last night. I finally slept properly.', ts: new Date(Date.now() - 360000), isSelf: false, color: '#D97706' },
  { id: '4', author: 'Abena D.', initials: 'AD', text: 'Which one did you use? The sleep pack?', ts: new Date(Date.now() - 240000), isSelf: false, color: '#059669' },
  { id: '5', author: 'Yaw M.', initials: 'YM', text: "Yes! 'Twilight Body Scan' — 15 mins and I was out. Highly recommend.", ts: new Date(Date.now() - 180000), isSelf: false, color: '#D97706' },
];

export function ChatScreen() {
  const nav    = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const user   = useAuthStore(s => s.user);
  const token  = useAuthStore(s => s.token);

  const [msgs, setMsgs] = useState<Message[]>(SEED_MSGS);
  const [input, setInput] = useState('');
  const scrollRef = useRef<ScrollView>(null);

  const selfName    = user?.firstName ?? 'You';
  const selfInitials = selfName.slice(0, 2).toUpperCase();

  const scrollDown = () => setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);

  const send = useCallback(() => {
    if (!input.trim()) return;
    const msg: Message = {
      id: Date.now().toString(),
      author: selfName,
      initials: selfInitials,
      text: input.trim(),
      ts: new Date(),
      isSelf: true,
      color: PURPLE,
    };
    setMsgs(m => [...m, msg]);
    setInput('');
    scrollDown();
  }, [input, selfName, selfInitials]);

  const fmt = (d: Date) => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const onlineCount = 12;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle="light-content" />
      <View style={[s.root, { backgroundColor: BG }]}>

        {/* Header */}
        <LinearGradient colors={GRAD_H} style={[s.header, { paddingTop: insets.top + 14 }]}>
          <TouchableOpacity onPress={() => nav.goBack()} style={s.backBtn}>
            <Ionicons name="chevron-back" size={24} color={WHITE} />
          </TouchableOpacity>
          <View style={s.headerCenter}>
            <Text style={s.headerTitle}>Community Chat</Text>
            <View style={s.onlineRow}>
              <View style={s.onlineDot} />
              <Text style={s.onlineTxt}>{onlineCount} members online</Text>
            </View>
          </View>
          <TouchableOpacity style={s.headerBtn}>
            <Ionicons name="people-outline" size={22} color={WHITE} />
          </TouchableOpacity>
        </LinearGradient>

        {/* Community notice */}
        <View style={s.notice}>
          <Ionicons name="shield-checkmark-outline" size={14} color={PURPLE} />
          <Text style={s.noticeTxt}>Safe space — be kind, be supportive</Text>
        </View>

        {/* Messages */}
        <ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          contentContainerStyle={s.msgs}
          showsVerticalScrollIndicator={false}
        >
          {/* Date separator */}
          <View style={s.dateSep}>
            <View style={s.dateLine} />
            <Text style={s.dateTxt}>Today</Text>
            <View style={s.dateLine} />
          </View>

          {msgs.map(msg => {
            const isSelf = msg.isSelf;
            return (
              <View key={msg.id} style={[s.row, isSelf && s.rowSelf]}>
                {!isSelf && (
                  <View style={[s.avatar, { backgroundColor: msg.color + '20' }]}>
                    <Text style={[s.avatarTxt, { color: msg.color }]}>{msg.initials}</Text>
                  </View>
                )}
                <View style={{ maxWidth: '76%' }}>
                  {!isSelf && (
                    <Text style={[s.authorName, { color: msg.color }]}>{msg.author}</Text>
                  )}
                  <View style={[s.bubble, isSelf ? s.bubbleSelf : s.bubbleOther]}>
                    <Text style={[s.bubbleTxt, isSelf && { color: WHITE }]}>{msg.text}</Text>
                    <Text style={[s.timeTxt, isSelf && { color: 'rgba(255,255,255,0.55)' }]}>{fmt(msg.ts)}</Text>
                  </View>
                </View>
                {isSelf && (
                  <View style={[s.avatar, { backgroundColor: PURPLE + '20' }]}>
                    <Text style={[s.avatarTxt, { color: PURPLE }]}>{selfInitials}</Text>
                  </View>
                )}
              </View>
            );
          })}
        </ScrollView>

        {/* Input */}
        <View style={[s.inputBar, { paddingBottom: insets.bottom + 12 }]}>
          <TextInput
            style={s.inputField}
            placeholder="Share something with the community..."
            placeholderTextColor={PM}
            value={input}
            onChangeText={setInput}
            multiline
            maxLength={500}
            onSubmitEditing={send}
            returnKeyType="send"
          />
          <TouchableOpacity onPress={send} disabled={!input.trim()}>
            <LinearGradient
              colors={['#7C3AED', '#9333EA']}
              style={[s.sendBtn, !input.trim() && { opacity: 0.4 }]}
            >
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
  backBtn:      { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerCenter: { flex: 1 },
  headerTitle:  { fontFamily: fonts.displaySemibold, fontSize: fontSizes.md, color: WHITE },
  onlineRow:    { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  onlineDot:    { width: 6, height: 6, borderRadius: 3, backgroundColor: '#52B788' },
  onlineTxt:    { fontFamily: fonts.body, fontSize: fontSizes.xs, color: 'rgba(255,255,255,0.65)' },
  headerBtn:    { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },

  notice:    { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: PL, paddingHorizontal: 16, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: PM + '40' },
  noticeTxt: { fontFamily: fonts.bodyMedium, fontSize: fontSizes.xs, color: PURPLE },

  msgs:    { paddingHorizontal: 14, paddingTop: 12, paddingBottom: 16 },
  dateSep: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 14 },
  dateLine:{ flex: 1, height: 1, backgroundColor: PM + '50' },
  dateTxt: { fontFamily: fonts.body, fontSize: fontSizes.xs, color: MUTED },

  row:     { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginBottom: 12 },
  rowSelf: { justifyContent: 'flex-end' },

  avatar:    { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  avatarTxt: { fontFamily: fonts.bodyBold, fontSize: 11 },

  authorName: { fontFamily: fonts.bodyBold, fontSize: fontSizes.xs, marginBottom: 3, marginLeft: 2 },
  bubble:     { borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10 },
  bubbleOther:{ backgroundColor: WHITE, borderBottomLeftRadius: 4, shadowColor: PURPLE, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 6, elevation: 2 },
  bubbleSelf: { backgroundColor: PURPLE, borderBottomRightRadius: 4 },
  bubbleTxt:  { fontFamily: fonts.body, fontSize: fontSizes.base, color: DARK, lineHeight: 21 },
  timeTxt:    { fontFamily: fonts.body, fontSize: 10, color: MUTED, marginTop: 4, textAlign: 'right' },

  inputBar:   { flexDirection: 'row', alignItems: 'flex-end', gap: 10, paddingHorizontal: 16, paddingTop: 10, borderTopWidth: 1, borderTopColor: PL, backgroundColor: WHITE },
  inputField: { flex: 1, backgroundColor: BG, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10, fontFamily: fonts.body, fontSize: fontSizes.base, color: DARK, maxHeight: 120, borderWidth: 1, borderColor: PL },
  sendBtn:    { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
});
