import React, { useCallback, useRef, useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
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
  const insets = useSafeAreaInsets();
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
      toast('Note dropped in the jar');
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
              toast('Note removed');
            } catch (err) {
              toast(err instanceof ApiRequestError ? err.message : 'Could not remove that note.');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={['#24412A', '#579E65']}
        style={[styles.header, { paddingTop: insets.top + spacing.md }]}
      >
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={12}>
          <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
        </Pressable>
        <View style={styles.headerCenter}>
          <View style={styles.headerIconWrap}>
            <Ionicons name="flask-outline" size={22} color="#FFFFFF" />
          </View>
          <View>
            <Text style={styles.headerTitle}>Gratitude Jar</Text>
            <Text style={styles.headerSub}>A jar of the good moments · {notes.length} notes</Text>
          </View>
        </View>
        <View style={styles.backBtn} />
      </LinearGradient>

      <ScrollView
        style={styles.flex}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xxxl }]}
        showsVerticalScrollIndicator={false}
      >
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
                <Ionicons name="trash-outline" size={16} color={colors.inkFaint} />
              </Pressable>
            </View>
          </Card>
        ))}
      </ScrollView>
      <ConfettiBurst ref={confettiRef} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.sm,
  },
  backBtn: { padding: 4, width: 30 },
  headerCenter: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  headerIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontFamily: fonts.display, fontSize: fontSizes.xl, color: '#FFFFFF' },
  headerSub: { fontFamily: fonts.bodyMedium, fontSize: fontSizes.xs, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
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
  sectionTitle: { fontFamily: fonts.bodyBold, fontSize: fontSizes.md, color: colors.ink },
  emptyText: { fontFamily: fonts.bodyMedium, fontSize: fontSizes.sm, color: colors.inkSoft },
  noteCard: { paddingVertical: spacing.sm + 2 },
  noteRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  noteFlex: { flex: 1 },
  noteText: { fontFamily: fonts.bodyMedium, fontSize: fontSizes.sm, color: colors.ink },
  noteDate: { fontFamily: fonts.bodyBold, fontSize: 10.5, color: colors.inkFaint, marginTop: 5 },
  trashBtn: { padding: 4 },
});
