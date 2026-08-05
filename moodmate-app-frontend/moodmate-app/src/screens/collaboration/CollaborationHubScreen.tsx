/**
 * CollaborationHubScreen — Counsellor ↔ Peer Mentor collaboration hub.
 *
 * Counsellors see all escalated cases (GET /api/support/escalations) and can:
 *   - Start reviewing  → POST /api/support/escalations/{id}/review
 *   - Send feedback    → POST /api/support/escalations/{id}/feedback
 *
 * Mentors see only their own cases (GET /api/support/escalations/mine).
 *
 * The screen detects the role from useAuthStore and calls the appropriate endpoint.
 */
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator, Alert, Pressable, ScrollView,
  StyleSheet, Text, TextInput, View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { useAuthStore } from '@/state/useAuthStore';
import {
  listAllEscalations,
  listMyEscalations,
  markEscalationInReview,
  sendEscalationFeedback,
  type EscalationCaseView,
} from '@/api/support';
import { getErrorMessage } from '@/api/client';
import { calm, colors, fonts, fontSizes, radii, spacing } from '@/theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'CollaborationHub'>;

type CaseStatus = EscalationCaseView['status'];

const STATUS_LABEL: Record<CaseStatus, string> = {
  SUBMITTED: 'Submitted',
  IN_REVIEW: 'Under review',
  FEEDBACK_READY: 'Feedback ready',
};

const STATUS_COLORS: Record<CaseStatus, { bg: string; text: string }> = {
  SUBMITTED:       { bg: calm.warningSoft, text: calm.forest },
  IN_REVIEW:       { bg: calm.mintBg,      text: calm.forest },
  FEEDBACK_READY:  { bg: '#E7F8EE',        text: calm.primaryDeep },
};

const URGENCY_COLOR: Record<EscalationCaseView['urgency'], string> = {
  ROUTINE:  calm.muted,
  PRIORITY: calm.amber,
  URGENT:   calm.rust,
};

function FlowStep({ icon, label }: { icon: keyof typeof Ionicons.glyphMap; label: string }) {
  return (
    <View style={s.flowStep}>
      <Ionicons name={icon} size={17} color={calm.primary} />
      <Text style={s.flowLabel}>{label}</Text>
    </View>
  );
}

export function CollaborationHubScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const token  = useAuthStore((s) => s.token) ?? '';
  const role   = useAuthStore((s) => s.user?.role);
  const isCounsellor = role === 'COUNSELLOR';

  const [cases, setCases]           = useState<EscalationCaseView[]>([]);
  const [loading, setLoading]       = useState(true);
  const [actionId, setActionId]     = useState<number | null>(null);
  const [feedbackId, setFeedbackId] = useState<number | null>(null);
  const [feedbackText, setFeedbackText] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = isCounsellor
        ? await listAllEscalations(token)
        : await listMyEscalations(token);
      setCases(data);
    } catch (err) {
      Alert.alert('Error', getErrorMessage(err, 'Could not load cases.'));
    } finally {
      setLoading(false);
    }
  }, [token, isCounsellor]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handleStartReview = async (id: number) => {
    setActionId(id);
    try {
      const updated = await markEscalationInReview(token, id);
      setCases((prev) => prev.map((c) => c.id === id ? updated : c));
    } catch (err) {
      Alert.alert('Error', getErrorMessage(err, 'Could not update case status.'));
    } finally {
      setActionId(null);
    }
  };

  const handleSendFeedback = async () => {
    if (!feedbackId || !feedbackText.trim()) return;
    setActionId(feedbackId);
    try {
      const updated = await sendEscalationFeedback(token, feedbackId, feedbackText.trim());
      setCases((prev) => prev.map((c) => c.id === feedbackId ? updated : c));
      setFeedbackId(null);
      setFeedbackText('');
    } catch (err) {
      Alert.alert('Error', getErrorMessage(err, 'Could not send feedback.'));
    } finally {
      setActionId(null);
    }
  };

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10}>
          <Ionicons name="chevron-back" size={23} color={calm.forest} />
        </Pressable>
        <View style={s.headerCopy}>
          <Text style={s.kicker}>SAFE COLLABORATION</Text>
          <Text style={s.title}>{isCounsellor ? 'Counsellor hub' : 'My escalated cases'}</Text>
        </View>
        <Ionicons name="shield-checkmark-outline" size={25} color={calm.primary} />
      </View>

      <ScrollView
        contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={s.hero}>
          <View style={s.heroIcon}>
            <Ionicons name="people-circle-outline" size={27} color={calm.primary} />
          </View>
          <Text style={s.heroTitle}>
            {isCounsellor
              ? 'No mentor carries a difficult case alone.'
              : 'Request counsellor guidance when you need it.'}
          </Text>
          <Text style={s.heroBody}>
            {isCounsellor
              ? 'Review mentor concerns, mark cases under investigation, and send clear guidance for the next safe step.'
              : 'Cases you escalate appear here. A counsellor will review and send you guidance.'}
          </Text>
        </View>

        {/* Flow indicator */}
        <View style={s.flow}>
          <FlowStep icon="create-outline" label="Report" />
          <Ionicons name="arrow-forward" size={16} color={calm.faint} />
          <FlowStep icon="search-outline" label="Review" />
          <Ionicons name="arrow-forward" size={16} color={calm.faint} />
          <FlowStep icon="chatbubble-ellipses-outline" label="Feedback" />
        </View>

        {/* Mentor CTA to file a new case */}
        {!isCounsellor && (
          <Pressable style={s.newCaseBtn} onPress={() => navigation.navigate('EscalateCase')}>
            <Ionicons name="add-circle-outline" size={19} color="#FFFFFF" />
            <Text style={s.newCaseTxt}>Escalate a new case</Text>
          </Pressable>
        )}

        <Text style={s.section}>
          {isCounsellor ? 'Open cases' : 'Your cases'}
        </Text>

        {/* Cases list */}
        {loading ? (
          <ActivityIndicator color={calm.primary} style={{ marginVertical: 40 }} />
        ) : cases.length === 0 ? (
          <View style={s.empty}>
            <Ionicons name="checkmark-circle-outline" size={36} color={calm.primary} />
            <Text style={s.emptyTitle}>No cases yet</Text>
            <Text style={s.emptyBody}>
              {isCounsellor
                ? 'Mentor escalations will appear here.'
                : 'Tap "Escalate a new case" to request counsellor guidance.'}
            </Text>
          </View>
        ) : (
          cases.map((item) => {
            const statusStyle = STATUS_COLORS[item.status];
            return (
              <View key={item.id} style={s.caseCard}>
                {/* Card header */}
                <View style={s.caseTop}>
                  <View style={s.avatar}>
                    <Text style={s.avatarText}>{item.studentName.charAt(0).toUpperCase()}</Text>
                  </View>
                  <View style={s.caseCopy}>
                    <Text style={s.caseName}>{item.studentName}</Text>
                    <Text style={s.caseDate}>
                      {new Date(item.createdAt).toLocaleDateString('en-GB', {
                        day: 'numeric', month: 'short', year: 'numeric',
                      })}
                      {isCounsellor && item.mentorName ? `  ·  ${item.mentorName}` : ''}
                    </Text>
                  </View>
                  <View style={[s.statusBadge, { backgroundColor: statusStyle.bg }]}>
                    <Text style={[s.statusText, { color: statusStyle.text }]}>
                      {STATUS_LABEL[item.status]}
                    </Text>
                  </View>
                </View>

                {/* Urgency + concern */}
                <Text style={[s.urgencyLabel, { color: URGENCY_COLOR[item.urgency] }]}>
                  {item.urgency} PRIORITY
                </Text>
                <Text style={s.concern}>{item.concern}</Text>

                {/* Reviewer attribution */}
                {item.reviewerName && (
                  <Text style={s.reviewer}>Reviewed by {item.reviewerName}</Text>
                )}

                {/* Counsellor actions */}
                {isCounsellor && item.status === 'SUBMITTED' && (
                  <Pressable
                    style={[s.actionBtn, actionId === item.id && s.actionBtnDisabled]}
                    onPress={() => handleStartReview(item.id)}
                    disabled={actionId === item.id}
                  >
                    {actionId === item.id
                      ? <ActivityIndicator size="small" color="#FFFFFF" />
                      : <Text style={s.actionBtnText}>Start review</Text>}
                  </Pressable>
                )}

                {isCounsellor && item.status === 'IN_REVIEW' && feedbackId !== item.id && (
                  <Pressable
                    style={s.actionBtn}
                    onPress={() => { setFeedbackId(item.id); setFeedbackText(''); }}
                  >
                    <Text style={s.actionBtnText}>Send feedback</Text>
                  </Pressable>
                )}

                {/* Inline feedback composer */}
                {isCounsellor && feedbackId === item.id && (
                  <View style={s.feedbackComposer}>
                    <Text style={s.composerTitle}>Counsellor guidance</Text>
                    <TextInput
                      value={feedbackText}
                      onChangeText={setFeedbackText}
                      placeholder="Recommend the next safe step for the mentor to take…"
                      placeholderTextColor={calm.faint}
                      multiline
                      style={s.composerInput}
                    />
                    <View style={s.composerRow}>
                      <Pressable onPress={() => setFeedbackId(null)}>
                        <Text style={s.composerCancel}>Cancel</Text>
                      </Pressable>
                      <Pressable
                        style={[s.composerSend, (!feedbackText.trim() || actionId === item.id) && s.actionBtnDisabled]}
                        disabled={!feedbackText.trim() || actionId === item.id}
                        onPress={handleSendFeedback}
                      >
                        {actionId === item.id
                          ? <ActivityIndicator size="small" color="#FFFFFF" />
                          : <Text style={s.composerSendText}>Send feedback</Text>}
                      </Pressable>
                    </View>
                  </View>
                )}

                {/* Feedback display (both roles) */}
                {item.feedback && (
                  <View style={s.feedbackBox}>
                    <Ionicons name="chatbubble-ellipses-outline" size={17} color={calm.primary} />
                    <Text style={s.feedbackText}>{item.feedback}</Text>
                  </View>
                )}
              </View>
            );
          })
        )}
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
  headerCopy: { flex: 1 },
  kicker: { fontFamily: fonts.bodyBold, fontSize: 10, letterSpacing: 1.2, color: calm.primary },
  title: { fontFamily: fonts.display, fontSize: 21, color: calm.forest, marginTop: 2 },

  content: { padding: spacing.lg, gap: spacing.md },

  hero: { backgroundColor: calm.forest, borderRadius: radii.lg, padding: spacing.lg },
  heroIcon: {
    width: 50, height: 50, borderRadius: 25,
    backgroundColor: calm.mintBg, alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.md,
  },
  heroTitle: { fontFamily: fonts.display, fontSize: 23, lineHeight: 29, color: '#FFFFFF' },
  heroBody: {
    fontFamily: fonts.body, fontSize: 14, lineHeight: 21,
    color: calm.mutedOnDark, marginTop: spacing.sm,
  },

  flow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#FFFFFF', borderRadius: radii.md, padding: spacing.md,
    borderWidth: 1, borderColor: calm.border,
  },
  flowStep: { alignItems: 'center', gap: 4 },
  flowLabel: { fontFamily: fonts.bodyBold, fontSize: 9, color: calm.muted },

  newCaseBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm, backgroundColor: calm.primary,
    borderRadius: radii.md, minHeight: 48, paddingHorizontal: spacing.lg,
  },
  newCaseTxt: { fontFamily: fonts.bodyBold, fontSize: fontSizes.sm, color: '#FFFFFF' },

  section: { fontFamily: fonts.display, fontSize: 19, color: calm.forest, marginTop: spacing.sm },

  empty: {
    alignItems: 'center', backgroundColor: '#FFFFFF',
    borderRadius: radii.md, padding: spacing.xl, gap: spacing.sm,
  },
  emptyTitle: { fontFamily: fonts.bodyBold, fontSize: fontSizes.md, color: calm.forest },
  emptyBody: {
    fontFamily: fonts.body, fontSize: 13, lineHeight: 19,
    color: calm.muted, textAlign: 'center',
  },

  caseCard: {
    backgroundColor: '#FFFFFF', borderRadius: radii.md,
    padding: spacing.md, borderWidth: 1, borderColor: calm.border, gap: spacing.sm,
  },
  caseTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  avatar: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: calm.mintBg, alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontFamily: fonts.bodyBold, fontSize: 17, color: calm.primary },
  caseCopy: { flex: 1 },
  caseName: { fontFamily: fonts.bodyBold, fontSize: 14, color: calm.forest },
  caseDate: { fontFamily: fonts.body, fontSize: 11, color: calm.faint, marginTop: 2 },
  statusBadge: { borderRadius: radii.pill, paddingHorizontal: 8, paddingVertical: 4 },
  statusText: { fontFamily: fonts.bodyBold, fontSize: 9, letterSpacing: 0.3 },

  urgencyLabel: { fontFamily: fonts.bodyBold, fontSize: 10, letterSpacing: 1 },
  concern: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20, color: calm.ink },
  reviewer: { fontFamily: fonts.bodyMedium, fontSize: 11, color: calm.faint, fontStyle: 'italic' },

  actionBtn: {
    alignSelf: 'flex-start', backgroundColor: calm.primary,
    borderRadius: radii.sm, paddingHorizontal: spacing.md, paddingVertical: 9,
    minWidth: 110, alignItems: 'center',
  },
  actionBtnDisabled: { opacity: 0.45 },
  actionBtnText: { fontFamily: fonts.bodyBold, fontSize: 12, color: '#FFFFFF' },

  feedbackComposer: {
    borderWidth: 1, borderColor: calm.primary,
    borderRadius: radii.md, padding: spacing.md, gap: spacing.sm,
  },
  composerTitle: { fontFamily: fonts.display, fontSize: 16, color: calm.forest },
  composerInput: {
    minHeight: 90, borderWidth: 1, borderColor: calm.border,
    borderRadius: radii.sm, padding: spacing.sm,
    fontFamily: fonts.body, color: calm.ink, textAlignVertical: 'top',
  },
  composerRow: {
    flexDirection: 'row', justifyContent: 'flex-end',
    alignItems: 'center', gap: spacing.md,
  },
  composerCancel: { fontFamily: fonts.bodyBold, color: calm.muted },
  composerSend: {
    backgroundColor: calm.primary, borderRadius: radii.sm,
    paddingHorizontal: spacing.md, paddingVertical: 10, minWidth: 120, alignItems: 'center',
  },
  composerSendText: { fontFamily: fonts.bodyBold, color: '#FFFFFF', fontSize: 12 },

  feedbackBox: {
    flexDirection: 'row', gap: spacing.sm,
    backgroundColor: calm.mintBg, padding: spacing.sm, borderRadius: radii.sm,
  },
  feedbackText: { flex: 1, fontFamily: fonts.body, fontSize: 13, lineHeight: 18, color: calm.forest },
});
