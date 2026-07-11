import React, { useRef, useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { ConfettiBurst, ConfettiHandle } from '@/components/Confetti';
import { useJournalStore } from '@/state/useJournalStore';
import { useAuthStore } from '@/state/useAuthStore';
import { useGuestStore } from '@/state/useGuestStore';
import { XP_VALUES } from '@/state/useGamificationStore';
import { useToast } from '@/state/useToast';
import { ApiRequestError } from '@/api/client';
import { hapticSuccess } from '@/utils/haptics';
import { colors, fonts, fontSizes, radii, spacing } from '@/theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'JournalEntry'>;

const PROMPTS: Record<string, string> = {
  'Daily reflection': 'What stood out about today?',
  'Exam stress': "What's weighing on you about exams right now?",
  'Goals & wins': 'What did you set out to do — and what actually happened?',
  'Free write': "What's on your mind?",
};

export function JournalEntryScreen({ route, navigation }: Props) {
  const { template, icon } = route.params;
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);
  const addEntry = useJournalStore((s) => s.addEntry);
  const token = useAuthStore((s) => s.token);
  const isGuest = useAuthStore((s) => s.user?.guest ?? false);
  const showProgressModal = useGuestStore((s) => s.showProgressModal);
  const toast = useToast();
  const confettiRef = useRef<ConfettiHandle>(null);
  const canSave = text.trim().length > 0 && !saving;

  const handleSave = async () => {
    if (!canSave) return;

    // Guest path — no API call
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
      await addEntry(token, template, text.trim(), icon);
      hapticSuccess();
      confettiRef.current?.fire();
      toast('Entry saved ✍️');
      navigation.goBack();
    } catch (err) {
      toast(err instanceof ApiRequestError ? err.message : 'Could not save entry.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.flex}>
      <Screen backgroundColor={colors.bg} contentContainerStyle={styles.content}>
        <ScreenHeader title={`${icon} ${template}`} onClose={() => navigation.goBack()} />

        <Card tint="lavender" style={styles.promptCard}>
          <Text style={styles.promptText}>{PROMPTS[template] ?? 'Write what comes to mind.'}</Text>
        </Card>

        <TextInput
          style={styles.input}
          placeholder="Start writing…"
          placeholderTextColor={colors.inkFaint}
          value={text}
          onChangeText={setText}
          multiline
          autoFocus
          textAlignVertical="top"
        />

        <Button
          label={saving ? 'Saving…' : 'Save entry'}
          variant="primary"
          fullWidth
          disabled={!canSave}
          onPress={handleSave}
        />
      </Screen>
      <ConfettiBurst ref={confettiRef} />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingHorizontal: spacing.lg },
  promptCard: { paddingVertical: spacing.md },
  promptText: { fontFamily: fonts.bodyMedium, fontSize: fontSizes.sm, color: colors.ink, lineHeight: 19 },
  input: {
    minHeight: 220,
    fontFamily: fonts.body,
    fontSize: fontSizes.base,
    color: colors.ink,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.line,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
});
