/**
 * AIChatScreen — MoodMate AI Chat
 * Dark canvas · floating orbs · glow bubbles · voice + image support
 *
 * Fixes vs v1:
 *  - SafeAreaView replaced with useSafeAreaInsets (deprecated warning gone)
 *  - Keyboard handling fixed for Android (behavior="height", offset=0)
 *  - Bubble layout rewritten: user right, AI left, proper max-width
 *  - Input bar sticks to keyboard edge on both platforms
 *  - Better error surfacing so the user knows why a request failed
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, FlatList, TouchableOpacity,
  StyleSheet, Animated, Easing, KeyboardAvoidingView,
  Platform, Alert, ActivityIndicator, Dimensions, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '@/state/useAuthStore';
import {
  sendChatMessage, getChatHistory, clearChatHistory,
  type AiChatMessageDto,
} from '@/api/aiChat';
import { colors, fonts, fontSizes, radii, spacing } from '@/theme/tokens';

const { width: W } = Dimensions.get('window');
const BUBBLE_MAX = W * 0.74;

// ── Palette ────────────────────────────────────────────────────────────────
const BG           = '#0C0920';
const ORB1         = 'rgba(100,55,190,0.30)';
const ORB2         = 'rgba(190,65,140,0.22)';
const ORB3         = 'rgba(80,120,220,0.18)';
const USER_BG      = 'rgba(255,100,70,0.16)';
const USER_BORDER  = 'rgba(255,100,70,0.50)';
const USER_SHADOW  = 'rgba(255,100,70,0.35)';
const AI_BG        = 'rgba(130,100,200,0.14)';
const AI_BORDER    = 'rgba(130,100,200,0.45)';
const AI_SHADOW    = 'rgba(130,100,200,0.30)';

// ── FloatingOrb ────────────────────────────────────────────────────────────
function Orb({ color, size, top, left, right, bottom }:
  { color: string; size: number; top?: number; left?: number; right?: number; bottom?: number }) {
  const y = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(y, { toValue: -20, duration: 3800 + Math.random() * 2000,
        easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(y, { toValue: 0, duration: 3800 + Math.random() * 2000,
        easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ])).start();
  }, []);
  return (
    <Animated.View style={{
      position: 'absolute', width: size, height: size, borderRadius: size / 2,
      backgroundColor: color, top, left, right, bottom,
      transform: [{ translateY: y }], opacity: 0.9,
    }} />
  );
}

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
        <Ionicons name="sparkles" size={11} color="#C878F8" />
      </View>
      <View style={[s.bubble, { backgroundColor: AI_BG, borderColor: AI_BORDER,
                                shadowColor: AI_SHADOW, paddingVertical: 12 }]}>
        <View style={{ flexDirection: 'row', gap: 5, alignItems: 'center' }}>
          {dots.map((d, i) => (
            <Animated.View key={i} style={{
              width: 6, height: 6, borderRadius: 3,
              backgroundColor: colors.lavender, opacity: d,
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

  return (
    <Animated.View style={[s.msgRow,
      isUser ? s.msgRowUser : s.msgRowAi,
      { opacity: fade, transform: [{ translateX: slide }] }]}>
      {!isUser && (
        <View style={s.aiAvatarSm}>
          <Ionicons name="sparkles" size={11} color="#C878F8" />
        </View>
      )}
      <View style={[s.bubble,
        isUser
          ? { backgroundColor: USER_BG, borderColor: USER_BORDER, shadowColor: USER_SHADOW }
          : { backgroundColor: AI_BG,   borderColor: AI_BORDER,   shadowColor: AI_SHADOW  }]}>
        {(isVoice || isImg) && (
          <View style={s.mediaChip}>
            <Ionicons name={isVoice ? 'mic' : 'image'} size={10}
              color={isUser ? colors.coral : colors.lavender} />
            <Text style={[s.mediaLabel, { color: isUser ? colors.coral : colors.lavender }]}>
              {isVoice ? 'Voice' : 'Image'}
            </Text>
          </View>
        )}
        <Text style={[s.bubbleTxt, isUser ? s.userTxt : s.aiTxt]}>
          {item.content}
        </Text>
        <Text style={[s.timeStamp, isUser ? { textAlign: 'right' } : { textAlign: 'left' }]}>
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
        <Ionicons name="sparkles" size={32} color="#C878F8" />
      </View>
      <Text style={s.emptyHi}>Hi {name} 👋</Text>
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
  const voiceRef = useRef<any>(null);
  const listRef  = useRef<FlatList>(null);

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
    setInput('');
    setSending(true);
    const opt: AiChatMessageDto = {
      id: Date.now(), role: 'user', content: txt,
      messageType: 'text', createdAt: new Date().toISOString(),
    };
    setMessages(p => [...p, opt]);
    try {
      const res = await sendChatMessage(token!, { message: txt });
      setMessages(p => [...p, {
        id: res.assistantMessageId, role: 'assistant',
        content: res.reply, messageType: 'text', createdAt: res.createdAt,
      }]);
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
  }, [input, sending, limitHit, token, isGuest]);

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
  const toggleVoice = useCallback(async () => {
    if (isGuest || sending || limitHit) return;
    try {
      // @ts-expect-error expo-av — run: npx expo install expo-av expo-file-system
      const { Audio } = await import('expo-av');
      if (!recording) {
        await Audio.requestPermissionsAsync();
        await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
        const { recording: rec } = await Audio.Recording.createAsync(
          Audio.RecordingOptionsPresets.HIGH_QUALITY);
        voiceRef.current = rec;
        setRecording(true);
      } else {
        setRecording(false);
        const rec = voiceRef.current;
        await rec.stopAndUnloadAsync();
        const uri = rec.getURI();
        if (!uri) return;
        // @ts-expect-error expo-file-system not yet installed
        const { FileSystem } = await import('expo-file-system');
        const b64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
        const filename = uri.split('/').pop() ?? 'voice.m4a';
        const optMsg: AiChatMessageDto = {
          id: Date.now(), role: 'user', content: '🎙️ Voice note',
          messageType: 'audio', createdAt: new Date().toISOString(),
        };
        setSending(true);
        setMessages(p => [...p, optMsg]);
        try {
          const r = await sendChatMessage(token!, { audioBase64: b64, audioFilename: filename });
          setMessages(p => p.map(m => m.id === optMsg.id
            ? { ...m, content: r.transcribedText ? `🎙️ "${r.transcribedText}"` : '🎙️ Voice note' }
            : m));
          setMessages(p => [...p, {
            id: r.assistantMessageId, role: 'assistant',
            content: r.reply, messageType: 'text', createdAt: r.createdAt,
          }]);
        } catch (err: any) {
          if (err?.status === 429) setLimitHit(true);
        } finally { setSending(false); }
      }
    } catch {
      setRecording(false);
      Alert.alert('Voice notes unavailable',
        'Run:\nnpx expo install expo-av expo-file-system\nthen restart the app.');
    }
  }, [isGuest, sending, limitHit, recording, token]);

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
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Background */}
      <LinearGradient colors={[BG, '#130B2E', '#0A0E26']} style={StyleSheet.absoluteFill} />
      <Orb color={ORB1} size={280} top={-60}  left={-80} />
      <Orb color={ORB2} size={220} top={'35%' as any} right={-60} />
      <Orb color={ORB3} size={200} bottom={100} left={10} />

      {/* Header */}
      <View style={[s.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => nav.goBack()} style={s.headerBtn} hitSlop={12}>
          <Ionicons name="chevron-back" size={26} color="#fff" />
        </TouchableOpacity>

        <View style={s.headerCenter}>
          <LinearGradient colors={['#7B3CC9','#C84895']}
            style={s.headerAvatarGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <Ionicons name="sparkles" size={16} color="#fff" />
          </LinearGradient>
          <View>
            <Text style={s.headerTitle}>MoodMate AI</Text>
            <Text style={s.headerSub}>powered by Groq · online</Text>
          </View>
        </View>

        <TouchableOpacity onPress={confirmClear} style={s.headerBtn} hitSlop={12}
          disabled={isGuest || messages.length === 0}>
          <Ionicons name="trash-outline" size={20}
            color={isGuest || messages.length === 0 ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.65)'} />
        </TouchableOpacity>
      </View>

      {/* Guest wall */}
      {isGuest ? (
        <View style={s.centerFill}>
          <View style={s.guestCard}>
            <Ionicons name="lock-closed" size={36} color={colors.lavender} style={{ marginBottom: 14 }} />
            <Text style={s.guestTitle}>Sign in to chat</Text>
            <Text style={s.guestSub}>Create a free account to talk with MoodMate AI.</Text>
          </View>
        </View>
      ) : loading ? (
        <View style={s.centerFill}>
          <ActivityIndicator color={colors.lavender} size="large" />
        </View>
      ) : (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
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
              <Ionicons name="information-circle" size={15} color={colors.sun} />
              <Text style={s.limitTxt}>
                Daily limit reached (20 messages). Upgrade for unlimited access.
              </Text>
            </View>
          )}

          {/* Input bar */}
          <View style={[s.inputBar, { paddingBottom: insets.bottom + 8 }]}>
            {/* Image */}
            <TouchableOpacity onPress={pickImage} style={s.iconBtn}
              disabled={sending || limitHit}>
              <Ionicons name="image-outline" size={22}
                color={sending || limitHit ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.70)'} />
            </TouchableOpacity>

            {/* Text field */}
            <View style={s.inputWrap}>
              <TextInput
                style={s.inputField}
                placeholder="Message MoodMate AI…"
                placeholderTextColor="rgba(255,255,255,0.30)"
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
                <LinearGradient colors={['#FF6F4D','#C84895']}
                  style={s.sendGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                  <Ionicons name="send" size={15} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>
            ) : (
              <Animated.View style={{ transform: [{ scale: recPulse }] }}>
                <TouchableOpacity onPress={toggleVoice}
                  disabled={sending || limitHit} style={s.sendBtn}>
                  <LinearGradient
                    colors={recording ? ['#FF2244','#C80030'] : ['rgba(255,255,255,0.12)','rgba(255,255,255,0.06)']}
                    style={s.sendGrad}>
                    <Ionicons name={recording ? 'stop' : 'mic'} size={18} color="#fff" />
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>
            )}
          </View>

          {/* Offline notice */}
          <View style={[s.offlineNote, { paddingBottom: Math.max(insets.bottom, 4) }]}>
            <Ionicons name="wifi" size={9} color="rgba(255,255,255,0.22)" />
            <Text style={s.offlineTxt}>  Requires internet connection</Text>
          </View>
        </KeyboardAvoidingView>
      )}
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.lg, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.07)',
  },
  headerBtn: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  headerCenter: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 10,
  },
  headerAvatarGrad: {
    width: 34, height: 34, borderRadius: 17,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontFamily: fonts.displaySemibold, fontSize: fontSizes.md, color: '#fff' },
  headerSub:   { fontFamily: fonts.body, fontSize: 10, color: 'rgba(255,255,255,0.45)', marginTop: 1 },

  // Messages list
  list: { paddingHorizontal: spacing.md, paddingTop: spacing.md },

  // Message rows
  msgRow:     { marginBottom: 14, maxWidth: BUBBLE_MAX },
  msgRowUser: { alignSelf: 'flex-end', alignItems: 'flex-end' },
  msgRowAi:   { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'flex-end', gap: 8 },

  aiAvatarSm: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: 'rgba(200,120,248,0.18)',
    borderWidth: 1, borderColor: 'rgba(200,120,248,0.40)',
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },

  bubble: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: radii.lg, borderWidth: 1,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1, shadowRadius: 14, elevation: 6,
    maxWidth: BUBBLE_MAX - 42,
  },
  bubbleTxt: { fontFamily: fonts.body, fontSize: fontSizes.base, lineHeight: 21 },
  userTxt:   { color: '#FFE8DE' },
  aiTxt:     { color: '#EDE6FF' },
  timeStamp: {
    fontFamily: fonts.body, fontSize: 9.5,
    color: 'rgba(255,255,255,0.28)', marginTop: 5,
  },
  mediaChip: { flexDirection: 'row', alignItems: 'center', gap: 3, marginBottom: 4 },
  mediaLabel:{ fontFamily: fonts.bodyMedium, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.4 },

  // Typing
  typingRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginBottom: 14, paddingHorizontal: spacing.md },

  // Empty state
  emptyWrap: { paddingTop: 60, paddingHorizontal: 28, alignItems: 'center' },
  emptyOrb: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: 'rgba(200,120,248,0.15)',
    borderWidth: 1, borderColor: 'rgba(200,120,248,0.30)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 18,
  },
  emptyHi:  { fontFamily: fonts.displaySemibold, fontSize: fontSizes.xxl, color: '#fff', marginBottom: 10 },
  emptySub: { fontFamily: fonts.body, fontSize: fontSizes.base, color: 'rgba(255,255,255,0.5)',
              textAlign: 'center', lineHeight: 22, marginBottom: 28 },
  suggestionRow: { gap: 8, alignItems: 'center' },
  suggestionChip: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: radii.pill, paddingHorizontal: 14, paddingVertical: 8,
  },
  suggestionTxt: { fontFamily: fonts.body, fontSize: fontSizes.sm, color: 'rgba(255,255,255,0.6)' },

  // Guest / loading
  centerFill: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  guestCard: {
    backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: radii.xl,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
    padding: 28, alignItems: 'center',
  },
  guestTitle: { fontFamily: fonts.displaySemibold, fontSize: fontSizes.xl, color: '#fff', marginBottom: 8 },
  guestSub:   { fontFamily: fonts.body, fontSize: fontSizes.base, color: 'rgba(255,255,255,0.5)',
                textAlign: 'center', lineHeight: 22 },

  // Limit
  limitBar: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: 'rgba(255,200,87,0.10)',
    borderTopWidth: 1, borderTopColor: 'rgba(255,200,87,0.20)',
    paddingHorizontal: spacing.lg, paddingVertical: 10,
  },
  limitTxt: { fontFamily: fonts.body, fontSize: fontSizes.sm, color: '#FFD060', flex: 1, lineHeight: 18 },

  // Input
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end',
    paddingHorizontal: spacing.md, paddingTop: 10,
    backgroundColor: 'rgba(12,9,32,0.92)',
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.07)',
    gap: 8,
  },
  iconBtn: { width: 40, height: 44, alignItems: 'center', justifyContent: 'center' },
  inputWrap: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: radii.md,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)',
    paddingHorizontal: 14,
    paddingTop: Platform.OS === 'ios' ? 11 : 8,
    paddingBottom: Platform.OS === 'ios' ? 11 : 8,
    minHeight: 44, maxHeight: 130,
  },
  inputField: {
    fontFamily: fonts.body, fontSize: fontSizes.base,
    color: '#fff', padding: 0, margin: 0,
  },
  sendBtn:  { width: 44, height: 44, borderRadius: 22, overflow: 'hidden' },
  sendGrad: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },

  // Offline
  offlineNote: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    paddingTop: 4,
    backgroundColor: 'rgba(12,9,32,0.92)',
  },
  offlineTxt: { fontFamily: fonts.body, fontSize: 9.5, color: 'rgba(255,255,255,0.22)' },
});
