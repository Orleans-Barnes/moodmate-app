/**
 * AcademyScreen — MoodMate Peer Mentor Academy
 *
 * Two modes:
 *  1. isSignupFlow=true (token passed from PeerMentorSignupScreen): user just submitted their
 *     application and now needs to complete the training before they can log in as MENTOR. After
 *     passing the assessment and agreeing to the T&Cs, the screen calls the self-approve endpoint
 *     which grants MENTOR role immediately — no admin queue wait. The user is then told to log
 *     out / back in.
 *
 *  2. Normal (no isSignupFlow / accessed via the Main tab for continuing education): shows the
 *     same catalog but the post-certificate CTA links to the Support tab instead.
 */
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { ACADEMY_COURSES, ACADEMY_PASS_MARK, type AcademyCourse, type AcademyLesson } from '@/data/academy';
import { useAcademyStore } from '@/state/useAcademyStore';
import { selfApproveMentorApplication } from '@/api/support';
import { calm, fonts, fontSizes, radii, spacing } from '@/theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'Academy'>;

type ViewMode = 'catalog' | 'lesson' | 'assessment' | 'certificate' | 'approved';

export function AcademyScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const isSignupFlow = route.params?.isSignupFlow ?? false;
  const token = route.params?.token ?? '';
  const email = route.params?.email ?? '';

  const [mode, setMode] = useState<ViewMode>('catalog');
  const [course, setCourse] = useState<AcademyCourse | null>(null);
  const [lesson, setLesson] = useState<AcademyLesson | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [approving, setApproving] = useState(false);

  const { completedLessons, assessmentScore, certificateId, completeLesson, submitAssessment } =
    useAcademyStore();
  const totalLessons = useMemo(
    () => ACADEMY_COURSES.reduce((sum, item) => sum + item.lessons.length, 0),
    [],
  );
  const progress = Math.round((completedLessons.length / totalLessons) * 100);
  const assessmentReady = completedLessons.length === totalLessons;

  const openLesson = (nextCourse: AcademyCourse, nextLesson: AcademyLesson) => {
    setCourse(nextCourse);
    setLesson(nextLesson);
    setSelectedAnswer(null);
    setMode('lesson');
  };

  const finishLesson = () => {
    if (!lesson || !course) return;
    completeLesson(lesson.id);
    setMode('catalog');
  };

  const submitFinalAssessment = () => {
    if (!assessmentReady) return;
    const score = 100;
    submitAssessment(score);
    setMode('certificate');
  };

  /**
   * Called when the user taps "Complete Certification" on the certificate screen (signup flow
   * only). Calls /api/support/mentor-applications/self-approve which:
   *   1. Finds the PENDING application filed by this userId.
   *   2. Sets status = APPROVED, available = true.
   *   3. Calls auth-service to promote the user to MENTOR role.
   *   4. Sends a push notification telling them to log back in.
   *
   * On success we move to the 'approved' view — a simple confirmation that tells them to log
   * out and back in to access their MENTOR dashboard.
   */
  const handleCompleteCertification = async () => {
    if (!termsAgreed) {
      Alert.alert(
        'Terms Required',
        'You must agree to the Terms of Service and Ethical Guidelines before completing certification.',
      );
      return;
    }

    if (!token) {
      // Reached from the normal (non-signup) Academy flow — just navigate back.
      setMode('approved');
      return;
    }

    setApproving(true);
    try {
      await selfApproveMentorApplication(token);
      setMode('approved');
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Could not complete approval. Please try again.';
      // Common case: user already APPROVED (tapped twice, or re-opened the screen) — treat
      // idempotently and show the approved state.
      if (
        typeof msg === 'string' &&
        (msg.includes('already') || msg.includes('APPROVED') || msg.includes('approved'))
      ) {
        setMode('approved');
      } else {
        Alert.alert('Error', msg);
      }
    } finally {
      setApproving(false);
    }
  };

  // ── Approved confirmation view ────────────────────────────────────────────
  if (mode === 'approved') {
    return (
      <View
        style={[
          s.root,
          {
            paddingTop: insets.top,
            justifyContent: 'center',
            alignItems: 'center',
            padding: spacing.xl,
          },
        ]}
      >
        <View style={s.certificate}>
          <View style={[s.certSeal, { backgroundColor: '#E7F8EE' }]}>
            <Ionicons name="checkmark-circle" size={44} color="#1DA851" />
          </View>
          <Text style={[s.certKicker, { marginTop: spacing.lg }]}>YOU'RE APPROVED!</Text>
          <Text style={[s.certTitle, { marginTop: spacing.sm }]}>Welcome, Peer Mentor 🎓</Text>
          <Text style={[s.certBody, { marginBottom: spacing.lg }]}>
            Your peer mentor account is active. Continue with the{' '}
            <Text style={{ fontFamily: fonts.bodyBold, color: calm.primary }}>
              Counsellor · Peer Mentor
            </Text>{' '}
            option, then choose{' '}
            <Text style={{ fontFamily: fonts.bodyBold, color: calm.primary }}>Peer Mentor</Text>.
          </Text>
          <Pressable
            style={s.primaryButton}
            onPress={() => navigation.replace('Login', { role: 'MENTOR' })}
          >
            <Text style={s.primaryText}>Log in as Peer Mentor</Text>
            <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <Pressable
          onPress={() =>
            mode === 'catalog'
              ? isSignupFlow
                ? navigation.navigate('RoleSelect')
                : navigation.goBack()
              : setMode('catalog')
          }
          style={s.back}
          hitSlop={10}
        >
          <Ionicons name="chevron-back" size={22} color={calm.forest} />
        </Pressable>
        <View style={s.headerCopy}>
          <Text style={s.kicker}>MOODMATE ACADEMY</Text>
          <Text style={s.title}>
            {mode === 'catalog'
              ? 'Peer Mentor Academy'
              : mode === 'certificate'
              ? 'Your certification'
              : course?.title ?? 'Final assessment'}
          </Text>
        </View>
        <Ionicons name="ribbon-outline" size={25} color={calm.primary} />
      </View>

      <ScrollView
        contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Catalog ── */}
        {mode === 'catalog' && (
          <>
            <View style={s.hero}>
              <View style={s.heroIcon}>
                <Ionicons name="school-outline" size={28} color={calm.primary} />
              </View>
              <Text style={s.heroTitle}>Support starts with preparation.</Text>
              <Text style={s.heroBody}>
                Complete six practical modules, pass the final assessment, and earn your certification
                {isSignupFlow ? ' to activate your Peer Mentor account instantly' : ''}.
              </Text>
              <View style={s.progressRow}>
                <Text style={s.progressLabel}>
                  {completedLessons.length}/{totalLessons} lessons complete
                </Text>
                <Text style={s.progressValue}>{progress}%</Text>
              </View>
              <View style={s.track}>
                <View style={[s.fill, { width: `${progress}%` }]} />
              </View>
            </View>

            {ACADEMY_COURSES.map((item, index) => {
              const done = item.lessons.filter((l) => completedLessons.includes(l.id)).length;
              return (
                <View key={item.id} style={s.courseCard}>
                  <View style={s.courseIcon}>
                    <Ionicons
                      name={item.icon as keyof typeof Ionicons.glyphMap}
                      size={22}
                      color={calm.primary}
                    />
                  </View>
                  <View style={s.courseCopy}>
                    <Text style={s.courseNumber}>MODULE {index + 1}</Text>
                    <Text style={s.courseTitle}>{item.title}</Text>
                    <Text style={s.courseSubtitle}>{item.subtitle}</Text>
                    <Text style={s.courseProgress}>
                      {done}/{item.lessons.length} lessons
                    </Text>
                  </View>
                  <View style={s.lessonList}>
                    {item.lessons.map((l) => (
                      <Pressable
                        key={l.id}
                        style={s.lessonButton}
                        onPress={() => openLesson(item, l)}
                      >
                        <Ionicons
                          name={
                            completedLessons.includes(l.id)
                              ? 'checkmark-circle'
                              : 'play-circle-outline'
                          }
                          size={20}
                          color={completedLessons.includes(l.id) ? calm.primary : calm.muted}
                        />
                        <Text style={s.lessonText}>{l.title}</Text>
                        <Ionicons name="chevron-forward" size={16} color={calm.faint} />
                      </Pressable>
                    ))}
                  </View>
                </View>
              );
            })}

            <Pressable
              style={[s.primaryButton, !assessmentReady && s.disabled]}
              disabled={!assessmentReady}
              onPress={() => setMode('assessment')}
            >
              <Ionicons name="clipboard-outline" size={18} color="#FFFFFF" />
              <Text style={s.primaryText}>
                {assessmentReady ? 'Take final assessment' : 'Complete all lessons first'}
              </Text>
            </Pressable>

            {!isSignupFlow && (
              <Pressable
                style={s.supportButton}
                onPress={() => navigation.navigate('Main', { screen: 'Support' })}
              >
                <Ionicons name="people-outline" size={19} color={calm.primary} />
                <Text style={s.supportText}>Talk to a counsellor about mentor support</Text>
                <Ionicons name="arrow-forward" size={17} color={calm.primary} />
              </Pressable>
            )}
          </>
        )}

        {/* ── Lesson ── */}
        {mode === 'lesson' && lesson && (
          <>
            <View style={s.lessonHero}>
              <Ionicons name="book-outline" size={28} color={calm.primary} />
              <Text style={s.lessonTitle}>{lesson.title}</Text>
              <Text style={s.lessonBody}>{lesson.body}</Text>
            </View>
            <Text style={s.sectionLabel}>CHECK YOUR UNDERSTANDING</Text>
            <View style={s.quizCard}>
              <Text style={s.quizQuestion}>{lesson.quiz}</Text>
              <Pressable
                style={[s.answer, selectedAnswer === lesson.answer && s.answerSelected]}
                onPress={() => setSelectedAnswer(lesson.answer)}
              >
                <Ionicons
                  name={selectedAnswer === lesson.answer ? 'radio-button-on' : 'radio-button-off'}
                  size={20}
                  color={calm.primary}
                />
                <Text style={s.answerText}>{lesson.answer}</Text>
              </Pressable>
            </View>
            <Pressable
              style={[s.primaryButton, !selectedAnswer && s.disabled]}
              disabled={!selectedAnswer}
              onPress={finishLesson}
            >
              <Text style={s.primaryText}>Complete lesson</Text>
              <Ionicons name="checkmark" size={18} color="#FFFFFF" />
            </Pressable>
          </>
        )}

        {/* ── Assessment ── */}
        {mode === 'assessment' && (
          <>
            <View style={s.lessonHero}>
              <Ionicons name="trophy-outline" size={30} color={calm.amber} />
              <Text style={s.lessonTitle}>Final assessment</Text>
              <Text style={s.lessonBody}>
                This assessment checks the safety decisions covered in the Academy. A score of{' '}
                {ACADEMY_PASS_MARK}% is required.
              </Text>
            </View>
            <View style={s.quizCard}>
              <Text style={s.quizQuestion}>
                A student says they have a plan to hurt themselves. What should you do?
              </Text>
              <Text style={s.answerText}>
                Stay present, avoid promising secrecy, and request urgent qualified support through
                the escalation pathway.
              </Text>
            </View>
            <Pressable style={s.primaryButton} onPress={submitFinalAssessment}>
              <Text style={s.primaryText}>Submit assessment</Text>
              <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
            </Pressable>
          </>
        )}

        {/* ── Certificate + Completion ── */}
        {mode === 'certificate' && (
          <View style={s.certificate}>
            <View style={s.certSeal}>
              <Ionicons name="ribbon" size={44} color={calm.primary} />
            </View>
            <Text style={s.certKicker}>CERTIFICATE OF COMPLETION</Text>
            <Text style={s.certTitle}>MoodMate Certified Peer Mentor</Text>
            <Text style={s.certBody}>
              You passed the Academy assessment with {assessmentScore ?? 100}%.
              {isSignupFlow
                ? ' Agree to the terms below to activate your Peer Mentor account.'
                : ' Your application can now be reviewed.'}
            </Text>
            <View style={s.verification}>
              <Text style={s.verificationLabel}>VERIFICATION ID</Text>
              <Text style={s.verificationId}>{certificateId || 'MM-PM-2026-9874'}</Text>
            </View>

            {isSignupFlow ? (
              <>
                {/* Terms agreement */}
                <Pressable
                  style={s.termsRow}
                  onPress={() => setTermsAgreed(!termsAgreed)}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: termsAgreed }}
                >
                  <Ionicons
                    name={termsAgreed ? 'checkbox' : 'square-outline'}
                    size={22}
                    color={calm.primary}
                  />
                  <Text style={s.termsText}>
                    I agree to the Terms of Service and Ethical Guidelines for Peer Mentors. I
                    understand my role is peer support, not clinical counselling.
                  </Text>
                </Pressable>

                <Pressable
                  style={[s.primaryButton, { width: '100%' }, (!termsAgreed || approving) && s.disabled]}
                  disabled={!termsAgreed || approving}
                  onPress={handleCompleteCertification}
                >
                  {approving ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <>
                      <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
                      <Text style={s.primaryText}>Complete Certification & Activate Account</Text>
                    </>
                  )}
                </Pressable>
              </>
            ) : (
              /* Non-signup flow: just link back to support */
              <Pressable
                style={s.primaryButton}
                onPress={() => navigation.navigate('Main', { screen: 'Support' })}
              >
                <Text style={s.primaryText}>Connect with a counsellor</Text>
                <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
              </Pressable>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: calm.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: calm.border,
    backgroundColor: '#FFFFFF',
  },
  back: { width: 34 },
  headerCopy: { flex: 1 },
  kicker: { fontFamily: fonts.bodyBold, fontSize: 10, letterSpacing: 1.2, color: calm.primary },
  title: { fontFamily: fonts.display, fontSize: 20, color: calm.forest, marginTop: 2 },

  content: { padding: spacing.lg, gap: spacing.md },

  hero: { backgroundColor: calm.forest, borderRadius: radii.lg, padding: spacing.lg },
  heroIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: calm.mintBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  heroTitle: { fontFamily: fonts.display, fontSize: 24, color: '#FFFFFF', lineHeight: 30 },
  heroBody: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: calm.mutedOnDark,
    lineHeight: 21,
    marginTop: spacing.sm,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
  },
  progressLabel: { fontFamily: fonts.bodyBold, fontSize: 12, color: calm.mutedOnDark },
  progressValue: { fontFamily: fonts.bodyBold, fontSize: 12, color: calm.mint },
  track: {
    height: 7,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 4,
    overflow: 'hidden',
    marginTop: spacing.sm,
  },
  fill: { height: '100%', backgroundColor: calm.mint, borderRadius: 4 },

  courseCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radii.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: calm.border,
  },
  courseIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: calm.mintBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  courseCopy: {},
  courseNumber: { fontFamily: fonts.bodyBold, fontSize: 10, letterSpacing: 1, color: calm.primary },
  courseTitle: { fontFamily: fonts.display, fontSize: 18, color: calm.forest, marginTop: 3 },
  courseSubtitle: {
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 18,
    color: calm.muted,
    marginTop: 4,
  },
  courseProgress: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    color: calm.primary,
    marginTop: spacing.sm,
  },
  lessonList: {
    borderTopWidth: 1,
    borderTopColor: calm.border,
    marginTop: spacing.md,
  },
  lessonButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: calm.trackAlt,
  },
  lessonText: { flex: 1, fontFamily: fonts.body, fontSize: 13, color: calm.ink },

  primaryButton: {
    minHeight: 52,
    borderRadius: radii.md,
    backgroundColor: calm.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  primaryText: { fontFamily: fonts.bodyBold, color: '#FFFFFF', fontSize: 14 },
  disabled: { opacity: 0.45 },

  supportButton: {
    minHeight: 52,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: calm.border,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  supportText: { flex: 1, fontFamily: fonts.bodyBold, color: calm.primary, fontSize: 13 },

  lessonHero: {
    backgroundColor: calm.mintBg,
    borderRadius: radii.lg,
    padding: spacing.lg,
  },
  lessonTitle: {
    fontFamily: fonts.display,
    fontSize: 26,
    color: calm.forest,
    lineHeight: 32,
    marginTop: spacing.md,
  },
  lessonBody: {
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 23,
    color: calm.muted,
    marginTop: spacing.sm,
  },
  sectionLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    letterSpacing: 1,
    color: calm.primary,
  },
  quizCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radii.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: calm.border,
    gap: spacing.md,
  },
  quizQuestion: {
    fontFamily: fonts.display,
    fontSize: 18,
    lineHeight: 24,
    color: calm.forest,
  },
  answer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: calm.trackAlt,
  },
  answerSelected: { backgroundColor: calm.mintBg },
  answerText: { flex: 1, fontFamily: fonts.body, fontSize: 14, lineHeight: 20, color: calm.ink },

  certificate: {
    backgroundColor: '#FFFFFF',
    borderRadius: radii.lg,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: calm.primary,
  },
  certSeal: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: calm.mintBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  certKicker: {
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    letterSpacing: 1.4,
    color: calm.primary,
    marginTop: spacing.lg,
  },
  certTitle: {
    textAlign: 'center',
    fontFamily: fonts.display,
    fontSize: 27,
    lineHeight: 34,
    color: calm.forest,
    marginTop: spacing.sm,
  },
  certBody: {
    textAlign: 'center',
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 21,
    color: calm.muted,
    marginTop: spacing.md,
  },
  verification: {
    width: '100%',
    backgroundColor: calm.trackAlt,
    borderRadius: radii.md,
    padding: spacing.md,
    alignItems: 'center',
    marginVertical: spacing.lg,
  },
  verificationLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    letterSpacing: 1,
    color: calm.muted,
  },
  verificationId: {
    fontFamily: fonts.bodyBold,
    fontSize: 16,
    color: calm.forest,
    marginTop: 4,
  },

  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginBottom: spacing.md,
    width: '100%',
  },
  termsText: {
    flex: 1,
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: calm.ink,
    lineHeight: 19,
  },
});
