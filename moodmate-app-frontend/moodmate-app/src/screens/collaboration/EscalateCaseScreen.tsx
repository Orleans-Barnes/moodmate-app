/**
 * EscalateCaseScreen — Peer Mentor → Counsellor case escalation.
 *
 * Submits to POST /api/support/escalations (MENTOR-role endpoint) and navigates
 * to CollaborationHubScreen on success so the mentor sees the new case immediately.
 */
import React, { useState } from 'react';
import {
  ActivityIndicator, Alert, Pressable, ScrollView,
  StyleSheet, Text, TextInput, View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { useAuthStore } from '@/state/useAuthStore';
import { submitEscalation } from '@/api/support';
import { getErrorMessage } from '@/api/client';
import { calm, fonts, fontSizes, radii, spacing } from '@/theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'EscalateCase'>;

const URGENCY = ['ROUTINE', 'PRIORITY', 'URGENT'] as const;
type Urgency = typeof URGENCY[number];

export function EscalateCaseScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const token = useAuthStore((s) => s.token) ?? '';

  const [studentName, setStudentName] = useState('');
  const [concern, setConcern] = useState('');
  const [urgency, setUrgency] = useState<Urgency>('PRIORITY');
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = studentName.trim().length > 0 && concern.trim().length >= 15 && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) {
      Alert.alert('Add more detail', 'Include the student name and at least a few sentences about the concern.');
      return;
    }
    setSubmitting(true);
    try {
      await submitEscalation(token, {
        studentName: studentName.trim(),
        concern: concern.trim(),
        urgency,
      });
      Alert.alert(
        'Case escalated ✓',
        'The counsellor hub has received this concern. You\'ll be notified when there\'s feedback.',
        [{ text: 'View hub', onPress: () => navigation.replace('CollaborationHub') }],
      );
    } catch (err) {
      Alert.alert('Error', getErrorMessage(err, 'Could not submit the escalation. Please try again.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10}>
          <Ionicons name="chevron-back" size={23} color={calm.forest} />
        </Pressable>
        <View style={s.copy}>
          <Text style={s.kicker}>MENTOR SUPPORT</Text>
          <Text style={s.title}>Escalate a case</Text>
        </View>
        <Ionicons name="shield-outline" size={24} color={calm.primary} />
      </View>

      <ScrollView
        contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 40 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={s.notice}>
          <Ionicons name="lock-closed-outline" size={18} color={calm.primary} />
          <Text style={s.noticeText}>
            Share only the information a counsellor needs to support the student safely. This goes
            directly to the counsellor hub — not to the student.
          </Text>
        </View>

        <Text style={s.label}>STUDENT NAME</Text>
        <TextInput
          value={studentName}
          onChangeText={setStudentName}
          placeholder="e.g. Ama K."
          placeholderTextColor={calm.faint}
          style={s.input}
        />

        <Text style={s.label}>URGENCY LEVEL</Text>
        <View style={s.urgencyRow}>
          {URGENCY.map((u) => (
            <Pressable
              key={u}
              onPress={() => setUrgency(u)}
              style={[s.urgencyBtn, urgency === u && s.urgencyBtnActive]}
            >
              <Text style={[s.urgencyText, urgency === u && s.urgencyTextActive]}>{u}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={s.label}>REPORT CONCERN</Text>
        <TextInput
          value={concern}
          onChangeText={setConcern}
          placeholder="What have you noticed? What support has already been offered? Be specific about behaviours, not diagnoses."
          placeholderTextColor={calm.faint}
          style={[s.input, s.textarea]}
          multiline
          textAlignVertical="top"
        />
        <Text style={s.charHint}>{concern.trim().length} / 15 min characters</Text>

        <Pressable
          style={[s.button, !canSubmit && s.buttonDisabled]}
          disabled={!canSubmit}
          onPress={handleSubmit}
        >
          {submitting ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <>
              <Ionicons name="paper-plane-outline" size={18} color="#FFFFFF" />
              <Text style={s.buttonText}>Send to counsellor</Text>
            </>
          )}
        </Pressable>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: calm.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    padding: spacing.lg, backgroundColor: '#FFFFFF',
    borderBottomWidth: 1, borderBottomColor: calm.border,
  },
  copy: { flex: 1 },
  kicker: { fontFamily: fonts.bodyBold, fontSize: 10, letterSpacing: 1.1, color: calm.primary },
  title: { fontFamily: fonts.display, fontSize: 21, color: calm.forest, marginTop: 2 },
  content: { padding: spacing.lg, gap: spacing.sm },
  notice: {
    flexDirection: 'row', gap: spacing.sm, padding: spacing.md,
    backgroundColor: calm.mintBg, borderRadius: radii.md, marginBottom: spacing.md,
  },
  noticeText: { flex: 1, fontFamily: fonts.body, fontSize: 13, lineHeight: 19, color: calm.forest },
  label: { fontFamily: fonts.bodyBold, fontSize: 10, letterSpacing: 1, color: calm.muted, marginTop: spacing.md },
  input: {
    backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: calm.border,
    borderRadius: radii.md, minHeight: 52,
    paddingHorizontal: spacing.md, paddingVertical: 14,
    fontFamily: fonts.body, fontSize: fontSizes.base, color: calm.ink,
    marginTop: 6,
  },
  textarea: { minHeight: 150, paddingTop: spacing.md },
  charHint: { fontFamily: fonts.body, fontSize: 11, color: calm.faint, textAlign: 'right', marginTop: 4 },
  urgencyRow: { flexDirection: 'row', gap: spacing.sm, marginTop: 6 },
  urgencyBtn: {
    flex: 1, minHeight: 42, borderRadius: radii.sm,
    borderWidth: 1, borderColor: calm.border,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  urgencyBtnActive: { backgroundColor: calm.forest, borderColor: calm.forest },
  urgencyText: { fontFamily: fonts.bodyBold, fontSize: 10, color: calm.muted },
  urgencyTextActive: { color: '#FFFFFF' },
  button: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm, minHeight: 54, borderRadius: radii.md,
    backgroundColor: calm.primary, marginTop: spacing.lg,
  },
  buttonDisabled: { opacity: 0.45 },
  buttonText: { fontFamily: fonts.bodyBold, color: '#FFFFFF', fontSize: 14 },
});
