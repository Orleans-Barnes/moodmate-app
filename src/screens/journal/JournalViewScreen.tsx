import React, { useRef, useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Alert } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Button } from '@/components/Button';
import { ConfettiBurst, ConfettiHandle } from '@/components/Confetti';
import { useJournalStore } from '@/state/useJournalStore';
import { useAuthStore } from '@/state/useAuthStore';
import { useToast } from '@/state/useToast';
import { ApiRequestError } from '@/api/client';
import { hapticLight, hapticSuccess } from '@/utils/haptics';
import { colors, fonts, fontSizes, radii, spacing } from '@/theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'JournalView'>;

export function JournalViewScreen({ route, navigation }: Props) {
  const { id, title, body: initialBody, moodEmoji, date } = route.params;

  const [body, setBody] = useState(initialBody);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const updateEntry = useJournalStore((s) => s.updateEntry);
  const deleteEntry = useJournalStore((s) => s.deleteEntry);
  const token = useAuthStore((s) => s.token);
  const toast = useToast();
  const confettiRef = useRef<ConfettiHandle>(null);

  const hasChanges = body.trim() !== initialBody.trim();
  const canSave = hasChanges && body.trim().length > 0 && !saving;

  const handleSave = async () => {
    if (!canSave || !token) return;
    setSaving(true);
    try {
      await updateEntry(token, id, title, body.trim());
      hapticSuccess();
      confettiRef.current?.fire();
      toast('Entry updated ✍️');
      setEditing(false);
    } catch (err) {
      toast(err instanceof ApiRequestError ? err.message : 'Could not save changes.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete entry?',
      'This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (!token) return;
            setDeleting(true);
            try {
              await deleteEntry(token, id);
              hapticLight();
              toast('Entry deleted');
              navigation.goBack();
            } catch (err) {
              toast(err instanceof ApiRequestError ? err.message : 'Could not delete entry.');
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.flex}>
      <Screen backgroundColor={colors.bg} contentContainerStyle={styles.content}>
        <ScreenHeader
          title={`${moodEmoji ? moodEmoji + ' ' : ''}${title}`}
          onClose={() => navigation.goBack()}
        />

        <Text style={styles.dateLabel}>{date}</Text>

        {editing ? (
          <TextInput
            style={styles.input}
            value={body}
            onChangeText={setBody}
            multiline
            autoFocus
            textAlignVertical="top"
            placeholderTextColor={colors.inkFaint}
          />
        ) : (
          <Pressable onPress={() => setEditing(true)} style={styles.bodyWrap}>
            <Text style={styles.bodyText}>{body || 'Tap to edit…'}</Text>
          </Pressable>
        )}

        <View style={styles.actions}>
          {editing ? (
            <Button
              label={saving ? 'Saving…' : 'Save changes'}
              variant="primary"
              fullWidth
              disabled={!canSave}
              onPress={handleSave}
            />
          ) : (
            <Button
              label="✏️  Edit"
              variant="primary"
              fullWidth
              onPress={() => setEditing(true)}
            />
          )}

          <Pressable
            style={[styles.deleteBtn, deleting && styles.deleteBtnDisabled]}
            disabled={deleting}
            onPress={handleDelete}
          >
            <Text style={styles.deleteBtnText}>{deleting ? 'Deleting…' : '🗑  Delete entry'}</Text>
          </Pressable>
        </View>
      </Screen>
      <ConfettiBurst ref={confettiRef} />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingHorizontal: spacing.lg },
  dateLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.xs,
    color: colors.inkFaint,
    marginBottom: spacing.md,
  },
  bodyWrap: {
    flex: 1,
    minHeight: 200,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.line,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  bodyText: {
    fontFamily: fonts.body,
    fontSize: fontSizes.base,
    color: colors.ink,
    lineHeight: 22,
  },
  input: {
    flex: 1,
    minHeight: 200,
    fontFamily: fonts.body,
    fontSize: fontSizes.base,
    color: colors.ink,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.blue,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
    textAlignVertical: 'top',
  },
  actions: { gap: spacing.sm },
  deleteBtn: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: colors.coral,
  },
  deleteBtnDisabled: { opacity: 0.4 },
  deleteBtnText: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.sm,
    color: colors.coral,
  },
});
