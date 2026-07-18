import React, { useCallback, useRef, useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Card } from '@/components/Card';
import { Skeleton } from '@/components/Skeleton';
import { ConfettiBurst, ConfettiHandle } from '@/components/Confetti';
import { useGratitudeStore } from '@/state/useGratitudeStore';
import { useAuthStore } from '@/state/useAuthStore';
import { useGuestStore } from '@/state/useGuestStore';
import { XP_VALUES } from '@/state/useGamificationStore';
import { useToast } from '@/state/useToast';
import { ApiRequestError } from '@/api/client';
import { hapticLight, hapticSuccess } from '@/utils/haptics';
import { colors, fonts, fontSizes, radii, spacing } from '@/theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'GratitudeJar'>;

export function GratitudeJarScreen({ navigation }: Props) {
  const notes = useGratitudeStore((s) => s.notes);
  const loading = useGratitudeStore((s) => s.loading);
  const load = useGratitudeStore((s) => s.load);
  const addNote = useGratitudeStore((s) => s.addNote);
  const deleteNote = useGratitudeStore((s) => s.deleteNote);
  const token = useAuthStore((s) => s.token);
  const isGuest = useAuthStore((s) => s.user?.guest ?? false);
  const showProgressModal = useGuestStore((s) => s.showProgressModal);
  const toast = useToast();
  const confettiRef = useRef<ConfettiHandle>(null);

  const [draft, setDraft] = useState('');
  const [dropping, setDropping] = useState(false);

  const canDrop = draft.trim().length > 0 && !dropping;

  const refresh = useCallback(() => {
    if (!token) return;
    load(token).catch((err) => {
      toast(err instanceof ApiRequestError ? err.message : 'Could not load your gratitude jar.');
    });
  }, [token, load, toast]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const handleAddNote = async () => {
    if (!canDrop) return;

    // Guest path — no API call
    if (isGuest) {
      hapticSuccess();
      confettiRef.current?.fire();
      showProgressModal('Gratitude note added', XP_VALUES.gratitude);
      setDraft('');
      return;
    }

    if (!token) return;
    const content = draft.trim();
    setDropping(true);
    try {
      await addNote(token, content);
      hapticSuccess();
      confettiRef.current?.fire();
      toast('Note dropped in the jar 🌟');
      setDraft('');
    } catch (err) {
      toast(err instanceof ApiRequestError ? err.message : 'Could not save that note.');
    } finally {
      setDropping(false);
    }
  };

  const handleDelete = (id: number, preview: string) => {
    Alert.alert(
      'Remove note?',
      `"${preview.slice(0, 60)}${preview.length > 60 ? '…' : ''}"`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            if (!token) return;
            hapticLight();
            try {
              await deleteNote(token, id);
              toast('Note removed 🗑');
            } catch (err) {
              toast(err instanceof ApiRequestError ? err.message : 'Could not remove that note.');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.flex}>
      <Screen backgroundColor={colors.bg} contentContainerStyle={styles.content}>
        <ScreenHeader title="Gratitude Jar" onClose={() => navigation.goBack()} />

        <Card tint="sun" style={styles.heroCard}>
          <Text style={styles.heroEmoji}>🫙</Text>
          <Text style={styles.heroSub}>A jar of the good moments · {notes.length} notes</Text>
        </Card>

        <Card style={styles.composerCard}>
          <TextInput
            style={styles.composerInput}
            placeholder="What are you grateful for today?"
            placeholderTextColor={colors.inkFaint}
            value={draft}
            onChangeText={setDraft}
            multiline
            editable={!dropping}
          />
          <Pressable
            style={[styles.dropBtn, !canDrop && styles.dropBtnDisabled]}
            disabled={!canDrop}
            onPress={handleAddNote}
          >
            <Text style={styles.dropBtnText}>{dropping ? 'Dropping…' : '＋ Drop in jar'}</Text>
          </Pressable>
        </Card>

        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>Recent notes</Text>
        </View>

        {loading && notes.length === 0 && (
          <>
            {[0, 1, 2].map((i) => (
              <Card key={`skeleton-${i}`}>
                <Skeleton width="85%" height={13} />
                <Skeleton width={48} height={10.5} style={{ marginTop: 7 }} />
              </Card>
            ))}
          </>
        )}

        {!loading && notes.length === 0 && (
          <Text style={styles.emptyText}>No notes yet — drop your first one above.</Text>
        )}

        {notes.map((note) => (
          <Card key={note.id} style={styles.noteCard}>
            <View style={styles.noteRow}>
              <View style={styles.noteFlex}>
                <Text style={styles.noteText}>&quot;{note.text}&quot;</Text>
                <Text style={styles.noteDate}>{note.date}</Text>
              </View>
              <Pressable
                style={styles.trashBtn}
                hitSlop={8}
                onPress={() => handleDelete(note.id, note.text)}
              >
                <Text style={styles.trashIcon}>🗑</Text>
              </Pressable>
            </View>
          </Card>
        ))}
      </Screen>
      <ConfettiBurst ref={confettiRef} />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingHorizontal: spacing.lg },
  heroCard: { alignItems: 'center' },
  heroEmoji: { fontSize: 46, marginBottom: 6 },
  heroSub: { fontFamily: fonts.bodyMedium, fontSize: fontSizes.xs, color: colors.inkSoft },
  composerCard: { gap: spacing.sm },
  composerInput: {
    minHeight: 70,
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.ink,
    textAlignVertical: 'top',
  },
  dropBtn: {
    alignSelf: 'flex-end',
    backgroundColor: colors.coral,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: radii.pill,
  },
  dropBtnDisabled: { opacity: 0.4 },
  dropBtnText: { fontFamily: fonts.bodyBold, fontSize: fontSizes.sm, color: '#FFFFFF' },
  sectionHead: { marginTop: spacing.md, marginBottom: spacing.sm },
  sectionTitle: { fontFamily: fonts.bodyBold, fontSize: fontSizes.base + 2, color: colors.ink },
  emptyText: { fontFamily: fonts.bodyMedium, fontSize: fontSizes.sm, color: colors.inkSoft },
  noteCard: { paddingVertical: spacing.sm + 2 },
  noteRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  noteFlex: { flex: 1 },
  noteText: { fontFamily: fonts.bodyMedium, fontSize: fontSizes.sm, color: colors.ink },
  noteDate: { fontFamily: fonts.bodyBold, fontSize: 10.5, color: colors.inkFaint, marginTop: 5 },
  trashBtn: { padding: 4 },
  trashIcon: { fontSize: 16 },
});
