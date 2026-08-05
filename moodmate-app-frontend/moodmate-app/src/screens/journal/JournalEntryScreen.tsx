import React, { useRef, useState } from 'react';
import { Alert, Image, Keyboard, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as LocalAuthentication from 'expo-local-authentication';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { BackButton } from '@/components/BackButton';
import { ConfettiBurst, ConfettiHandle } from '@/components/Confetti';
import { ApiRequestError } from '@/api/client';
import { useAuthStore } from '@/state/useAuthStore';
import { useGuestStore } from '@/state/useGuestStore';
import { useJournalStore } from '@/state/useJournalStore';
import { XP_VALUES } from '@/state/useGamificationStore';
import { useToast } from '@/state/useToast';
import { useKeyboardOffset } from '@/hooks/useKeyboardOffset';
import { hapticSuccess } from '@/utils/haptics';
import { calm, fonts, fontSizes, radii, spacing } from '@/theme/tokens';
import { appendJournalText, JOURNAL_TOOLBAR_ACTIONS, nextPrompt, type JournalToolbarActionId } from './journalToolbar';

type Props = NativeStackScreenProps<RootStackParamList, 'JournalEntry'>;

const PROMPTS: Record<string, string> = {
  'Daily reflection': 'What stood out about today?',
  Reflection: 'What stood out about today?',
  'Exam stress': "What's weighing on you about exams right now?",
  'Goals & wins': 'What did you set out to do, and what actually happened?',
  'Free write': "What's on your mind?",
  "Today's prompt": "What is one thing you're carrying that isn't actually yours?",
};

const PROMPT_POOL = [
  "What is one thing you're carrying that isn't actually yours?",
  'What did your body try to tell you today?',
  'Where did you feel even a small moment of relief?',
  'What would feel lighter if you named it honestly?',
  'What do you want tomorrow-you to remember?',
];

const PHOTO_MARKER = '[[moodmate-photo:';
const NOW_LABEL = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
  + ' · ' + new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

export function JournalEntryScreen({ route, navigation }: Props) {
  const { template, emoji } = route.params;
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);
  const [promptText, setPromptText] = useState(PROMPTS[template] ?? 'Write what comes to mind.');
  const [photoDataUri, setPhotoDataUri] = useState<string | null>(null);
  const [privacyOn, setPrivacyOn] = useState(false);

  const addEntry = useJournalStore((state) => state.addEntry);
  const token = useAuthStore((state) => state.token);
  const isGuest = useAuthStore((state) => state.user?.guest ?? false);
  const showProgressModal = useGuestStore((state) => state.showProgressModal);
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const keyboardHeight = useKeyboardOffset();
  const inputRef = useRef<TextInput>(null);
  const confettiRef = useRef<ConfettiHandle>(null);

  const canSave = (text.trim().length > 0 || photoDataUri != null) && !saving;
  const wordCount = text.trim().length === 0 ? 0 : text.trim().split(/\s+/).length;
  const toolbarBottom = keyboardHeight > 0 ? keyboardHeight + spacing.sm : insets.bottom + spacing.md;

  const buildBody = () => {
    const body = text.trim();
    if (!photoDataUri) return body;
    const marker = `${PHOTO_MARKER}${photoDataUri}]]`;
    return body ? `${body}\n\n${marker}` : marker;
  };

  const handleSave = async () => {
    if (!canSave) return;

    if (isGuest) {
      hapticSuccess();
      confettiRef.current?.fire();
      showProgressModal('Journal entry written', XP_VALUES.journal);
      navigation.goBack();
      return;
    }

    if (!token) return;
    setSaving(true);
    try {
      await addEntry(token, template, buildBody(), emoji);
      hapticSuccess();
      confettiRef.current?.fire();
      toast('Entry saved');
      navigation.goBack();
    } catch (err) {
      toast(err instanceof ApiRequestError ? err.message : 'Could not save entry.');
    } finally {
      setSaving(false);
    }
  };

  const insertPrompt = () => {
    setPrivacyOn(false);
    setText((current) => appendJournalText(current, promptText));
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const rotatePrompt = () => {
    const next = nextPrompt(promptText, PROMPT_POOL);
    setPromptText(next);
    toast('New prompt ready');
  };

  const attachPhoto = async (source: 'camera' | 'library') => {
    try {
      const permission = source === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert(
          'Permission needed',
          source === 'camera'
            ? 'Please allow camera access to add a journal photo.'
            : 'Please allow photo access to add a journal photo.',
        );
        return;
      }

      const result = source === 'camera'
        ? await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.45, base64: true })
        : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.45, base64: true });
      const asset = !result.canceled ? result.assets[0] : undefined;
      if (!asset?.base64) return;
      setPhotoDataUri(`data:${asset.mimeType ?? 'image/jpeg'};base64,${asset.base64}`);
      toast('Photo attached');
    } catch {
      toast('Could not attach that photo.');
    }
  };

  const openCameraMenu = () => {
    Alert.alert('Add a photo', 'Choose how you want to add an image to this entry.', [
      { text: 'Take photo', onPress: () => attachPhoto('camera') },
      { text: 'Choose from library', onPress: () => attachPhoto('library') },
      { text: 'Cancel', style: 'cancel' },
    ], { cancelable: true });
  };

  const togglePrivacy = async () => {
    if (!privacyOn) {
      Keyboard.dismiss();
      setPrivacyOn(true);
      toast('Journal hidden on this screen');
      return;
    }

    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = compatible ? await LocalAuthentication.isEnrolledAsync() : false;
      if (compatible && enrolled) {
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: 'Unlock journal entry',
          cancelLabel: 'Cancel',
        });
        if (!result.success) return;
      }
      setPrivacyOn(false);
      requestAnimationFrame(() => inputRef.current?.focus());
    } catch {
      setPrivacyOn(false);
    }
  };

  const openMoreMenu = () => {
    Alert.alert('Journal options', undefined, [
      { text: "Insert today's prompt", onPress: insertPrompt },
      { text: 'Insert timestamp', onPress: () => setText((current) => appendJournalText(current, new Date().toLocaleString())) },
      { text: 'Clear entry', style: 'destructive', onPress: () => { setText(''); setPhotoDataUri(null); } },
      { text: 'Cancel', style: 'cancel' },
    ], { cancelable: true });
  };

  const handleToolbarAction = (action: JournalToolbarActionId) => {
    if (action === 'voice') {
      Alert.alert(
        'Voice transcription coming soon',
        'Text journaling is ready for today. Voice transcription is being polished and will be switched on after the demo.',
      );
      return;
    }
    if (action === 'photo') {
      openCameraMenu();
      return;
    }
    if (action === 'prompt') {
      rotatePrompt();
      return;
    }
    if (action === 'privacy') {
      void togglePrivacy();
      return;
    }
    openMoreMenu();
  };

  return (
    <View style={[s.root, { paddingTop: insets.top + spacing.lg, paddingBottom: toolbarBottom + 70 }]}>
      <View style={s.header}>
        <BackButton onPress={() => navigation.goBack()} />
        <Pressable
          style={[s.saveBtn, !canSave && s.saveBtnDisabled]}
          disabled={!canSave}
          onPress={handleSave}
          accessibilityRole="button"
          accessibilityLabel="Save journal entry"
          accessibilityState={{ disabled: !canSave, busy: saving }}
        >
          <Text style={s.saveBtnText}>{saving ? 'Saving...' : 'Save'}</Text>
        </Pressable>
      </View>

      <Text style={s.title}>{template}{template.toLowerCase().includes('journal') ? '' : ' journal'}</Text>
      <Text style={s.dateLine}>{NOW_LABEL}</Text>

      <View style={s.promptRow}>
        <Ionicons name="bulb-outline" size={16} color={calm.primary} />
        <Text style={s.promptText}>{promptText}</Text>
      </View>

      {photoDataUri && (
        <View style={s.photoCard}>
          <Image source={{ uri: photoDataUri }} style={s.photoPreview} />
          <Pressable style={s.removePhotoBtn} onPress={() => setPhotoDataUri(null)} accessibilityRole="button" accessibilityLabel="Remove attached photo">
            <Ionicons name="close" size={16} color="#FFFFFF" />
          </Pressable>
        </View>
      )}

      {privacyOn ? (
        <View style={s.privacyPanel}>
          <Ionicons name="lock-closed" size={26} color={calm.forest} />
          <Text style={s.privacyTitle}>Journal hidden</Text>
          <Text style={s.privacyText}>Unlock to keep writing on this screen.</Text>
          <Pressable style={s.unlockBtn} onPress={togglePrivacy}>
            <Text style={s.unlockText}>Unlock</Text>
          </Pressable>
        </View>
      ) : (
        <TextInput
          ref={inputRef}
          style={s.input}
          placeholder="Start writing..."
          placeholderTextColor={calm.faint}
          value={text}
          onChangeText={setText}
          multiline
          autoFocus
          textAlignVertical="top"
        />
      )}

      <View style={s.metaRow}>
        <Text style={s.wordCount}>{wordCount} word{wordCount === 1 ? '' : 's'}</Text>
        <Pressable style={s.moodTag} onPress={insertPrompt} accessibilityRole="button" accessibilityLabel="Insert current prompt">
          <Ionicons name="book-outline" size={12} color="#FFFFFF" style={s.moodTagIcon} />
          <Text style={s.moodTagText}>{template}</Text>
        </Pressable>
      </View>

      <View style={[s.toolbar, { bottom: toolbarBottom }]}>
        {JOURNAL_TOOLBAR_ACTIONS.map((action) => {
          const active = action.id === 'privacy' && privacyOn;
          return (
            <Pressable
              key={action.id}
              style={[s.tool, active && s.toolActive]}
              onPress={() => handleToolbarAction(action.id)}
              accessibilityRole="button"
              accessibilityLabel={active && action.id === 'privacy' ? 'Unlock journal' : action.accessibilityLabel}
              accessibilityState={action.id === 'privacy' ? { selected: privacyOn } : undefined}
            >
              <Ionicons name={active && action.activeIcon ? action.activeIcon : action.icon} size={18} color={calm.forest} />
            </Pressable>
          );
        })}
      </View>

      <ConfettiBurst ref={confettiRef} />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: calm.bg, paddingHorizontal: spacing.xl },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.xl },
  saveBtn: { backgroundColor: calm.primary, borderRadius: radii.pill, paddingHorizontal: 20, paddingVertical: 11 },
  saveBtnDisabled: { opacity: 0.4 },
  saveBtnText: { fontFamily: fonts.bodyBold, fontSize: fontSizes.base - 2, color: '#FFFFFF' },

  title: { fontFamily: fonts.displayExtraBold, fontSize: fontSizes.xxl, color: calm.forest, letterSpacing: 0 },
  dateLine: { fontFamily: fonts.body, fontSize: fontSizes.sm, color: calm.muted, marginTop: 4, marginBottom: spacing.lg },

  promptRow: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'flex-start',
    backgroundColor: calm.mintBg,
    borderRadius: radii.lg + 2,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  promptText: { flex: 1, fontFamily: fonts.body, fontSize: fontSizes.base - 2, color: calm.forest, lineHeight: 20 },

  photoCard: {
    height: 118,
    borderRadius: radii.lg,
    overflow: 'hidden',
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: calm.border,
  },
  photoPreview: { width: '100%', height: '100%' },
  removePhotoBtn: {
    position: 'absolute',
    right: 10,
    top: 10,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(7,94,84,0.78)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  input: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: fontSizes.md - 1,
    lineHeight: 26,
    color: calm.ink,
  },
  privacyPanel: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: calm.border,
    borderRadius: radii.lg,
    backgroundColor: '#EDF1EE',
    padding: spacing.xl,
  },
  privacyTitle: { fontFamily: fonts.bodyBold, fontSize: fontSizes.md, color: calm.forest },
  privacyText: { fontFamily: fonts.body, fontSize: fontSizes.sm, color: calm.muted, textAlign: 'center' },
  unlockBtn: { marginTop: spacing.sm, backgroundColor: calm.forest, borderRadius: radii.pill, paddingHorizontal: 18, paddingVertical: 10 },
  unlockText: { fontFamily: fonts.bodyBold, fontSize: fontSizes.sm, color: '#FFFFFF' },

  metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.md },
  wordCount: { fontFamily: fonts.body, fontSize: fontSizes.xs + 1, color: calm.muted },
  moodTag: { flexDirection: 'row', alignItems: 'center', backgroundColor: calm.terracotta, borderRadius: radii.pill, paddingHorizontal: 16, paddingVertical: 8 },
  moodTagIcon: { marginRight: 5 },
  moodTagText: { fontFamily: fonts.bodyBold, fontSize: fontSizes.base - 3, color: '#FFFFFF' },

  toolbar: {
    position: 'absolute',
    left: spacing.xl,
    right: spacing.xl,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: calm.border,
    backgroundColor: calm.bg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
  },
  tool: { width: 46, height: 44, borderRadius: 14, backgroundColor: calm.bg, alignItems: 'center', justifyContent: 'center' },
  toolActive: { backgroundColor: calm.mintBg },
});
