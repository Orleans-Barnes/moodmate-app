import React, { useRef, useState } from 'react';
import { Alert, Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Button } from '@/components/Button';
import { ConfettiBurst, ConfettiHandle } from '@/components/Confetti';
import { ApiRequestError } from '@/api/client';
import { useAuthStore } from '@/state/useAuthStore';
import { useJournalStore } from '@/state/useJournalStore';
import { useToast } from '@/state/useToast';
import { hapticLight, hapticSuccess } from '@/utils/haptics';
import { colors, fonts, fontSizes, radii, spacing } from '@/theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'JournalView'>;
const PHOTO_MARKER = '[[moodmate-photo:';

function splitPhotoMarker(value: string): { text: string; photoUri: string | null } {
  const start = value.indexOf(PHOTO_MARKER);
  if (start < 0) return { text: value, photoUri: null };
  const end = value.indexOf(']]', start);
  if (end < 0) return { text: value, photoUri: null };
  return {
    text: value.slice(0, start).trim(),
    photoUri: value.slice(start + PHOTO_MARKER.length, end),
  };
}

export function JournalViewScreen({ route, navigation }: Props) {
  const { id, title, body: initialBody, date } = route.params;

  const [body, setBody] = useState(initialBody);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const updateEntry = useJournalStore((state) => state.updateEntry);
  const deleteEntry = useJournalStore((state) => state.deleteEntry);
  const token = useAuthStore((state) => state.token);
  const toast = useToast();
  const confettiRef = useRef<ConfettiHandle>(null);
  const display = splitPhotoMarker(body);

  const hasChanges = body.trim() !== initialBody.trim();
  const canSave = hasChanges && body.trim().length > 0 && !saving;

  const handleSave = async () => {
    if (!canSave || !token) return;
    setSaving(true);
    try {
      await updateEntry(token, id, title, body.trim());
      hapticSuccess();
      confettiRef.current?.fire();
      toast('Entry updated');
      setEditing(false);
    } catch (err) {
      toast(err instanceof ApiRequestError ? err.message : 'Could not save changes.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert('Delete entry?', 'This cannot be undone.', [
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
    ]);
  };

  return (
    <View style={styles.flex}>
      <Screen backgroundColor={colors.bg} contentContainerStyle={styles.content}>
        <ScreenHeader title={title} onClose={() => navigation.goBack()} />

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
            {display.photoUri && <Image source={{ uri: display.photoUri }} style={styles.photoPreview} />}
            <Text style={styles.bodyText}>{display.text || 'Tap to edit...'}</Text>
          </Pressable>
        )}

        <View style={styles.actions}>
          {editing ? (
            <Button
              label={saving ? 'Saving...' : 'Save changes'}
              variant="primary"
              fullWidth
              disabled={!canSave}
              onPress={handleSave}
            />
          ) : (
            <Button label="Edit" variant="primary" fullWidth onPress={() => setEditing(true)} />
          )}

          <Pressable
            style={[styles.deleteBtn, deleting && styles.deleteBtnDisabled]}
            disabled={deleting}
            onPress={handleDelete}
          >
            {!deleting && <Ionicons name="trash-outline" size={15} color={colors.coral} />}
            <Text style={styles.deleteBtnText}>{deleting ? 'Deleting...' : 'Delete entry'}</Text>
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
  photoPreview: {
    width: '100%',
    height: 180,
    borderRadius: radii.md,
    marginBottom: spacing.md,
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
    borderColor: colors.coral,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
    textAlignVertical: 'top',
  },
  actions: { gap: spacing.sm },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
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
