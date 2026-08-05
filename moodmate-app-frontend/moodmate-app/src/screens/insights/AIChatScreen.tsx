/**
 * AIChatScreen — MoodMate AI Chat, Calm Forest theme
 * Flat off-white canvas · bordered message bubbles · voice + image support
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, FlatList, TouchableOpacity,
  StyleSheet, Animated, Easing,
  Platform, Alert, ActivityIndicator, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '@/state/useAuthStore';
import { useKeyboardOffset } from '@/hooks/useKeyboardOffset';
import {
  sendChatMessage, getChatHistory, clearChatHistory,
  type AiChatMessageDto,
} from '@/api/aiChat';
import { fonts, fontSizes, radii, spacing, calm } from '@/theme/tokens';

const BUBBLE_MAX_PCT = 0.74;

// ── TypingDots ─────────────────────────────────────────────────────────────
function TypingDots() {
  const dots = [useRef(new Animated.Value(0)).current,
                useRef(new Animated.Value(0)).current,
                useRef(new Animated.Value(0)).current];
  useEffect(() => {
    const anims = dots.map((d, i) => Animated.loop(Animated.sequence([
      Animated.delay(i * 150),
      Animated.timing(d, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.timing(d, { toValue: 0, duration: 300, useNativeDriver: true }),
      Animated.delay(400),
    ])));
    Animated.parallel(anims).start();
    return () => anims.forEach(a => a.stop());
  }, []);
  return (
    <View style={s.typingRow}>
      <View style={s.aiAvatarSm}>
        <Ionicons name="sparkles" size={11} color={calm.primary} />
      </View>
      <View style={[s.bubble, s.bubbleAi, { paddingVertical: 12 }]}>
        <View style={{ flexDirection: 'row', gap: 5, alignItems: 'center' }}>
          {dots.map((d, i) => (
            <Animated.View key={i} style={{
              width: 6, height: 6, borderRadius: 3,
              backgroundColor: calm.primary, opacity: d,
              transform: [{ translateY: d.interpolate({ inputRange: [0,1], outputRange: [0,-5] }) }],
            }} />
          ))}
        </View>
      </View>
    </View>
  );
}

// ── MessageRow ─────────────────────────────────────────────────────────────
function MessageRow({ item }: { item: AiChatMessageDto }) {
  const isUser = item.role === 'user';
  const fade  = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(isUser ? 20 : -20)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade,  { toValue: 1, duration: 280, useNativeDriver: true }),
      Animated.spring(slide, { toValue: 0, friction: 8, tension: 120, useNativeDriver: true }),
    ]).start();
  }, []);

  const isVoice = item.content.startsWith('🎙️');
  const isImg   = item.content.startsWith('🖼️');

  const hasVoiceChip = item.messageType === 'audio' || isVoice;
  const hasImageChip = item.messageType === 'image' || isImg;

  return (
    <Animated.View style={[s.msgRow,
      isUser ? s.msgRowUser : s.msgRowAi,
      { opacity: fade, transform: [{ translateX: slide }] }]}>
      {!isUser && (
        <View style={s.aiAvatarSm}>
          <Ionicons name="sparkles" size={11} color={calm.primary} />
        </View>
      )}
      <View style={[s.bubble, isUser ? s.bubbleUser : s.bubbleAi]}>
        {(hasVoiceChip || hasImageChip) && (
          <View style={s.mediaChip}>
            <Ionicons name={hasVoiceChip ? 'mic' : 'image'} size={10} color={isUser ? '#FFFFFF' : calm.primary} />
            <Text style={[s.mediaLabel, { color: isUser ? '#FFFFFF' : calm.primary }]}>
              {hasVoiceChip ? 'Voice' : 'Image'}
            </Text>
          </View>
        )}
        <Text style={[s.bubbleTxt, isUser ? s.userTxt : s.aiTxt]}>
          {(isVoice || isImg) ? item.content.replace(/^(🎙️|🖼️)\s*/, '') : item.content}
        </Text>
        <Text style={[s.timeStamp, isUser ? { color: 'rgba(255,255,255,0.7)', textAlign: 'right' } : { textAlign: 'left' }]}>
          {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    </Animated.View>
  );
}

// ── EmptyState ─────────────────────────────────────────────────────────────
function EmptyState({ name }: { name: string }) {
  return (
    <View style={s.emptyWrap}>
      <View style={s.emptyOrb}>
        <Ionicons name="sparkles" size={32} color={calm.primary} />
      </View>
      <Text style={s.emptyHi}>Hi {name}</Text>
      <Text style={s.emptySub}>
        I'm MoodMate AI, your personal wellness companion.{'\n'}
        Share how you're feeling, ask me anything, or send{'\n'}
        a voice note — I'm here for you.
      </Text>
      <View style={s.suggestionRow}>
        {["How do I manage exam stress?", "I'm feeling anxious", "Help me relax"].map(q => (
          <View key={q} style={s.suggestionChip}>
            <Text style={s.suggestionTxt}>{q}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ── Main Screen ────────────────────────────────────────────────────────────
export function AIChatScreen() {
  const nav    = useNavigation();
  const insets = useSafeAreaInsets();
  const { token, user } = useAuthStore();
  const isGuest = !token || token === 'guest';

  const [messages, setMessages] = useState<AiChatMessageDto[]>([]);
  const [input,    setInput]    = useState('');
  const [sending,  setSending]  = useState(false);
  const [loading,  setLoading]  = useState(true);
  const [limitHit, setLimitHit] = useState(false);
  const [recording, setRecording] = useState(false);
  const recPulse = useRef(new Animated.Value(1)).current;
  const listRef  = useRef<FlatList>(null);
  const keyboardHeight = useKeyboardOffset();

  // Load history
  useEffect(() => {
    if (isGuest) { setLoading(false); return; }
    getChatHistory(token!, 50).then(setMessages).catch(() => {}).finally(() => setLoading(false));
  }, []);

  // Scroll to bottom
  const scrollEnd = useCallback(() =>
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 120), []);
  useEffect(() => { if (messages.length) scrollEnd(); }, [messages]);

  // Pulse recording button
  useEffect(() => {
    if (recording) {
      Animated.loop(Animated.sequence([
        Animated.timing(recPulse, { toValue: 1.3, duration: 500, useNativeDriver: true }),
        Animated.timing(recPulse, { toValue: 1,   duration: 500, useNativeDriver: true }),
      ])).start();
    } else {
      recPulse.stopAnimation();
      Animated.timing(recPulse, { toValue: 1, duration: 100, useNativeDriver: true }).start();
    }
  }, [recording]);

  // ── Send text ────────────────────────────────────────────────────────────
  const sendText = useCallback(async () => {
    const txt = input.trim();
    if (!txt || sending || limitHit || isGuest) return;

    // Emergency keywords check
    const emergencyKeywords = ['suicide', 'kill myself', 'end my life', 'self-harm', 'harm myself', 'hurt myself', 'cut myself', 'overdose'];
    const hasEmergency = emergencyKeywords.some(kw => txt.toLowerCase().includes(kw));

    if (hasEmergency) {
      Alert.alert(
        'Crisis Support',
        'It looks like you might be going through a very difficult time. We want to support you. Please contact our emergency/SOS services immediately.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Go to SOS Support', style: 'destructive', onPress: () => nav.navigate('SOS' as any) }
        ]
      );
    }

    setInput('');
    setSending(true);
    const opt: AiChatMessageDto = {
      id: Date.now(), role: 'user', content: txt,
      messageType: 'text', createdAt: new Date().toISOString(),
    };
    setMessages(p => [...p, opt]);
    try {
      const res = await sendChatMessage(token!, { message: txt });
      
      // Check if AI indicates inability or suggests human help
      const humanKeywords = ['counsellor', 'peer mentor', 'cannot help', 'unable to answer', 'just an ai', 'don\'t know'];
      const needsHuman = humanKeywords.some(kw => res.reply.toLowerCase().includes(kw));

      setMessages(p => [...p, {
        id: res.assistantMessageId, role: 'assistant',
        content: res.reply, messageType: 'text', createdAt: res.createdAt,
      }]);

      if (needsHuman || hasEmergency) {
        setMessages(p => [...p, {
          id: Date.now() + 2, role: 'assistant',
          content: '👋 If you need qualified guidance or a friendly student ear, please connect with our campus Counsellors or Peer Mentors.',
          messageType: 'text', createdAt: new Date().toISOString(),
        }]);
        // Delay alert for human redirection
        setTimeout(() => {
          Alert.alert(
            'Connect with Support',
            'Would you like to speak to a qualified counsellor or a peer mentor for further guidance?',
            [
              { text: 'Not now', style: 'cancel' },
              { text: 'Connect Now', onPress: () => nav.navigate('Main' as any, { screen: 'Support' }) }
            ]
          );
        }, 1500);
      }
    } catch (err: any) {
      const status = err?.status ?? 0;
      if (status === 429) { setLimitHit(true); return; }
      const errMsg = status === 0
        ? "Can't reach the server. Make sure your backend is running."
        : (err?.message ?? "Something went wrong. Please try again.");
      setMessages(p => [...p, {
        id: Date.now() + 1, role: 'assistant', content: errMsg,
        messageType: 'text', createdAt: new Date().toISOString(),
      }]);
    } finally { setSending(false); }
  }, [input, sending, limitHit, token, isGuest, nav]);

  // ── Send image ───────────────────────────────────────────────────────────
  const pickImage = useCallback(async () => {
    if (isGuest || sending || limitHit) return;
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow photo access to share images.'); return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.65, base64: true,
    });
    if (res.canceled || !res.assets[0]?.base64) return;
    const caption = input.trim();
    setInput('');
    setSending(true);
    setMessages(p => [...p, {
      id: Date.now(), role: 'user',
      content: '🖼️ ' + (caption || 'Image shared'),
      messageType: 'image', createdAt: new Date().toISOString(),
    }]);
    try {
      const r = await sendChatMessage(token!, { imageBase64: res.assets[0].base64!, message: caption || undefined });
      setMessages(p => [...p, {
        id: r.assistantMessageId, role: 'assistant',
        content: r.reply, messageType: 'text', createdAt: r.createdAt,
      }]);
    } catch (err: any) {
      if (err?.status === 429) setLimitHit(true);
    } finally { setSending(false); }
  }, [isGuest, sending, limitHit, token, input]);

  // ── Voice ────────────────────────────────────────────────────────────────
  const toggleVoice = useCallback(() => {
    if (isGuest || sending || limitHit) return;
    Alert.alert(
      'Voice notes are coming soon',
      'Text chat is ready for today. Voice transcription is being polished and will be switched on after the demo.',
    );
  }, [isGuest, limitHit, sending]);

  // ── Clear ────────────────────────────────────────────────────────────────
  const confirmClear = () => Alert.alert('Clear history?', 'This cannot be undone.', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Clear', style: 'destructive', onPress: async () => {
      await clearChatHistory(token!).catch(() => {});
      setMessages([]); setLimitHit(false);
    }},
  ]);

  const firstName = user?.fullName?.split(' ')[0] ?? 'there';

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <View style={s.root}>
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />

      {/* Header */}
      <View style={[s.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => nav.goBack()} style={s.headerBtn} hitSlop={12}>
          <Ionicons name="chevron-back" size={26} color={calm.forest} />
        </TouchableOpacity>

        <View style={s.headerCenter}>
          <View style={s.headerAvatar}>
            <Ionicons name="sparkles" size={16} color="#FFFFFF" />
          </View>
          <View>
            <Text style={s.headerTitle}>MoodMate AI</Text>
            <Text style={s.headerSub}>powered by Groq · online</Text>
          </View>
        </View>

        <TouchableOpacity onPress={confirmClear} style={s.headerBtn} hitSlop={12}
          disabled={isGuest || messages.length === 0}>
          <Ionicons name="trash-outline" size={20}
            color={isGuest || messages.length === 0 ? calm.faint : calm.muted} />
        </TouchableOpacity>
      </View>

      {/* Guest wall */}
      {isGuest ? (
        <View style={s.centerFill}>
          <View style={s.guestCard}>
            <Ionicons name="lock-closed" size={36} color={calm.primary} style={{ marginBottom: 14 }} />
            <Text style={s.guestTitle}>Sign in to chat</Text>
            <Text style={s.guestSub}>Create a free account to talk with MoodMate AI.</Text>
          </View>
        </View>
      ) : loading ? (
        <View style={s.centerFill}>
          <ActivityIndicator color={calm.primary} size="large" />
        </View>
      ) : (
        <View style={{ flex: 1, paddingBottom: keyboardHeight }}>
          {/* Messages */}
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={m => String(m.id)}
            renderItem={({ item }) => <MessageRow item={item} />}
            contentContainerStyle={[s.list, { paddingBottom: 16 }]}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={<EmptyState name={firstName} />}
            ListFooterComponent={sending ? <TypingDots /> : null}
            keyboardDismissMode="interactive"
            keyboardShouldPersistTaps="handled"
          />

          {/* Limit banner */}
          {limitHit && (
            <View style={s.limitBar}>
              <Ionicons name="information-circle" size={15} color={calm.amber} />
              <Text style={s.limitTxt}>
                Daily limit reached (20 messages). Upgrade for unlimited access.
              </Text>
            </View>
          )}

          {/* Input bar */}
          <View style={[s.inputBar, { paddingBottom: keyboardHeight > 0 ? 0 : insets.bottom + 8 }]}>
            {/* Image */}
            <TouchableOpacity onPress={pickImage} style={s.iconBtn}
              disabled={sending || limitHit}>
              <Ionicons name="image-outline" size={22}
                color={sending || limitHit ? calm.faint : calm.muted} />
            </TouchableOpacity>

            {/* Text field */}
            <View style={s.inputWrap}>
              <TextInput
                style={s.inputField}
                placeholder="Message MoodMate AI…"
                placeholderTextColor={calm.faint}
                value={input}
                onChangeText={setInput}
                multiline maxLength={1000}
                editable={!sending && !limitHit}
                returnKeyType="default"
                blurOnSubmit={false}
              />
            </View>

            {/* Send / mic */}
            {input.trim().length > 0 ? (
              <TouchableOpacity onPress={sendText} disabled={sending || limitHit}
                style={[s.sendBtn, (sending || limitHit) && { opacity: 0.4 }]}>
                <Ionicons name="send" size={15} color="#fff" />
              </TouchableOpacity>
            ) : (
              <Animated.View style={{ transform: [{ scale: recPulse }] }}>
                <TouchableOpacity onPress={toggleVoice}
                  disabled={sending || limitHit} style={[s.sendBtn, recording && s.sendBtnRecording]}>
                  <Ionicons name={recording ? 'stop' : 'mic'} size={18} color="#fff" />
                </TouchableOpacity>
              </Animated.View>
            )}
          </View>

          {/* Offline notice */}
          <View style={[s.offlineNote, { paddingBottom: keyboardHeight > 0 ? 0 : Math.max(insets.bottom, 4) }]}>
            <Ionicons name="wifi" size={9} color={calm.faint} />
            <Text style={s.offlineTxt}>  Requires internet connection</Text>
          </View>
        </View>
      )}
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: calm.bg },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.lg, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: calm.border,
    backgroundColor: '#FFFFFF',
  },
  headerBtn: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  headerCenter: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 10,
  },
  headerAvatar: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: calm.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontFamily: fonts.bodyBold, fontSize: fontSizes.md, color: calm.forest },
  headerSub:   { fontFamily: fonts.body, fontSize: 10, color: calm.muted, marginTop: 1 },

  // Messages list
  list: { paddingHorizontal: spacing.md, paddingTop: spacing.md },

  // Message rows
  msgRow:     { marginBottom: 14, maxWidth: `${BUBBLE_MAX_PCT * 100}%` },
  msgRowUser: { alignSelf: 'flex-end', alignItems: 'flex-end' },
  msgRowAi:   { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'flex-end', gap: 8 },

  aiAvatarSm: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: calm.mintBg,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },

  bubble: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: radii.lg,
    maxWidth: '100%',
  },
  bubbleUser: { backgroundColor: calm.primary },
  bubbleAi: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: calm.border },
  bubbleTxt: { fontFamily: fonts.body, fontSize: fontSizes.base, lineHeight: 21 },
  userTxt:   { color: '#FFFFFF' },
  aiTxt:     { color: calm.ink },
  timeStamp: {
    fontFamily: fonts.body, fontSize: 9.5,
    color: calm.faint, marginTop: 5,
  },
  mediaChip: { flexDirection: 'row', alignItems: 'center', gap: 3, marginBottom: 4 },
  mediaLabel:{ fontFamily: fonts.bodyMedium, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.4 },

  // Typing
  typingRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginBottom: 14, paddingHorizontal: spacing.md },

  // Empty state
  emptyWrap: { paddingTop: 60, paddingHorizontal: 28, alignItems: 'center' },
  emptyOrb: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: calm.mintBg,
    alignItems: 'center', justifyContent: 'center', marginBottom: 18,
  },
  emptyHi:  { fontFamily: fonts.displayExtraBold, fontSize: fontSizes.xxl, color: calm.forest, marginBottom: 10 },
  emptySub: { fontFamily: fonts.body, fontSize: fontSizes.base, color: calm.muted,
              textAlign: 'center', lineHeight: 22, marginBottom: 28 },
  suggestionRow: { gap: 8, alignItems: 'center' },
  suggestionChip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1, borderColor: calm.border,
    borderRadius: radii.pill, paddingHorizontal: 14, paddingVertical: 8,
  },
  suggestionTxt: { fontFamily: fonts.body, fontSize: fontSizes.sm, color: calm.muted },

  // Guest / loading
  centerFill: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  guestCard: {
    backgroundColor: '#FFFFFF', borderRadius: radii.card,
    borderWidth: 1, borderColor: calm.border,
    padding: 28, alignItems: 'center',
  },
  guestTitle: { fontFamily: fonts.displayExtraBold, fontSize: fontSizes.xl, color: calm.forest, marginBottom: 8 },
  guestSub:   { fontFamily: fonts.body, fontSize: fontSizes.base, color: calm.muted,
                textAlign: 'center', lineHeight: 22 },

  // Limit
  limitBar: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: calm.mintBg,
    borderTopWidth: 1, borderTopColor: calm.border,
    paddingHorizontal: spacing.lg, paddingVertical: 10,
  },
  limitTxt: { fontFamily: fonts.body, fontSize: fontSizes.sm, color: calm.forest, flex: 1, lineHeight: 18 },

  // Input
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end',
    paddingHorizontal: spacing.md, paddingTop: 10,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1, borderTopColor: calm.border,
    gap: 8,
  },
  iconBtn: { width: 40, height: 44, alignItems: 'center', justifyContent: 'center' },
  inputWrap: {
    flex: 1,
    backgroundColor: calm.bg,
    borderRadius: radii.lg,
    borderWidth: 1.5, borderColor: calm.border,
    paddingHorizontal: 14,
    paddingTop: Platform.OS === 'ios' ? 11 : 8,
    paddingBottom: Platform.OS === 'ios' ? 11 : 8,
    minHeight: 44, maxHeight: 130,
  },
  inputField: {
    fontFamily: fonts.body, fontSize: fontSizes.base,
    color: calm.ink, padding: 0, margin: 0,
  },
  sendBtn:  { width: 44, height: 44, borderRadius: 22, backgroundColor: calm.primary, alignItems: 'center', justifyContent: 'center' },
  sendBtnRecording: { backgroundColor: calm.rust },

  // Offline
  offlineNote: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    paddingTop: 4,
    backgroundColor: '#FFFFFF',
  },
  offlineTxt: { fontFamily: fonts.body, fontSize: 9.5, color: calm.faint },
});
