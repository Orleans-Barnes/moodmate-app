/**
 * PeerMentorSignupScreen
 *
 * Fix #4 - replaces the earlier "not open yet" placeholder (which told students applications
 * would open after completing a training/certification programme that was never actually built -
 * see git history for the old copy). This is now a real, working application form, mirroring
 * CounsellorSignupScreen's shape exactly:
 *   Step 1 — Account details (name, email, password)
 *   Step 2 — Mentor profile (bio, focus area)
 *
 * On submit it:
 *   1. Signs up a standard account (POST /api/auth/signup)
 *   2. Immediately submits a peer mentor application (POST /api/support/mentor-applications)
 *   3. Shows a "pending approval" confirmation — same honesty level as the counsellor flow: an
 *      admin reviews and approves/rejects, no credential verification is claimed or implied.
 *
 * Student-view polish pass - redesigned alongside CounsellorSignupScreen: emoji icons replaced
 * with Ionicons, added a fade+rise entrance and a per-step cross-fade so switching between
 * Account/Profile doesn't hard-cut.
 */
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated, View, Text, Pressable, StyleSheet, ScrollView,
  TextInput, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { signup } from '@/api/auth';
import { submitMentorApplication } from '@/api/support';
import { ApiRequestError } from '@/api/client';
import { colors, fonts, fontSizes, spacing, radii, shadow } from '@/theme/tokens';
import { useKeyboardOffset } from '@/hooks/useKeyboardOffset';

type Props = NativeStackScreenProps<RootStackParamList, 'PeerMentorSignup'>;

type Step = 'account' | 'profile' | 'done';

const STEP_ICON: Record<Step, keyof typeof Ionicons.glyphMap> = {
  account: 'leaf-outline',
  profile: 'people-outline',
  done: 'checkmark-circle',
};

// Fades the step content in whenever `stepKey` changes, without a full screen remount.
function StepFade({ stepKey, children }: { stepKey: string; children: React.ReactNode }) {
  const fade = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    fade.setValue(0);
    Animated.timing(fade, { toValue: 1, duration: 260, useNativeDriver: true }).start();
  }, [stepKey, fade]);
  return <Animated.View style={{ opacity: fade }}>{children}</Animated.View>;
}

export function PeerMentorSignupScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const keyboardHeight = useKeyboardOffset();

  // Step 1 — account
  const [fullName, setFullName] = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);

  // Step 2 — profile
  const [bio, setBio]           = useState('');
  const [focusArea, setFocusArea] = useState('');

  const [step, setStep]         = useState<Step>('account');
  const [loading, setLoading]   = useState(false);

  // Screen-level entrance
  const entrance = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(entrance, { toValue: 1, duration: 320, useNativeDriver: true }).start();
  }, [entrance]);

  // ── Step 1 validation ────────────────────────────────────────────────────
  const step1Ready =
    fullName.trim().length > 0 &&
    email.trim().includes('@') &&
    password.length >= 8;

  // ── Step 2 validation ────────────────────────────────────────────────────
  const step2Ready = bio.trim().length >= 10;

  // ── Submit ───────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!step2Ready) return;
    setLoading(true);
    try {
      const { token } = await signup({
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        password,
      });

      await submitMentorApplication(token, {
        bio: bio.trim(),
        focusArea: focusArea.trim() || undefined,
      });

      // Navigate to Academy for training. The Academy screen will auto-approve the
      // user once they complete all lessons + assessment + agree to T&Cs, using the
      // token passed here. No admin queue wait needed for the peer mentor path.
      navigation.replace('Academy', { isSignupFlow: true, token, email: email.trim().toLowerCase() });
    } catch (err) {
      const msg = err instanceof ApiRequestError ? err.message : 'Something went wrong. Please try again.';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      style={[s.root, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {step !== 'done' && (
        <Pressable
          style={s.backBtn}
          onPress={() => step === 'profile' ? setStep('account') : navigation.goBack()}
          hitSlop={12}
        >
          <Ionicons name="chevron-back" size={20} color={colors.inkSoft} />
          <Text style={s.backTxt}>{step === 'profile' ? 'Back' : 'Back to login'}</Text>
        </Pressable>
      )}

      <ScrollView
        contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + spacing.xxl + keyboardHeight }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: entrance }}>
          <View style={s.iconCircle}>
            <Ionicons name={step === 'profile' ? 'people-outline' : 'leaf-outline'} size={34} color={colors.sage} />
          </View>

          <Text style={s.heading}>
            {step === 'profile'
              ? 'Your mentor profile'
              : 'Apply as a peer mentor'}
          </Text>
          <Text style={s.sub}>
            {step === 'profile'
              ? "Tell the MoodMate community about yourself. This appears on your Peer Mentor card."
              : 'Create your account first, then complete your profile. You\'ll then take a short training course to get certified.'}
          </Text>

          {step !== 'done' && (
            <View style={s.pillRow}>
              <View style={[s.pill, step === 'account' ? s.pillActive : s.pillDone]}>
                <Text style={[s.pillTxt, step !== 'account' && s.pillTxtDone]}>1 Account</Text>
              </View>
              <View style={s.pillLine} />
              <View style={[s.pill, step === 'profile' ? s.pillActive : s.pillInactive]}>
                <Text style={[s.pillTxt, step !== 'profile' && s.pillTxtInactive]}>2 Profile</Text>
              </View>
            </View>
          )}

          {step === 'account' && (
            <StepFade stepKey="account">
              <Field label="FULL NAME" value={fullName} onChangeText={setFullName}
                placeholder="Ama Serwaa" autoCapitalize="words" />
              <Field label="EMAIL" value={email} onChangeText={setEmail}
                placeholder="you@example.com" autoCapitalize="none" keyboardType="email-address" />
              <PasswordField label="PASSWORD (min 8 characters)" value={password}
                onChangeText={setPassword} showPw={showPw} togglePw={() => setShowPw(v => !v)} />

              <Pressable
                style={[s.btn, !step1Ready && s.btnDisabled]}
                disabled={!step1Ready}
                onPress={() => setStep('profile')}
              >
                <Text style={s.btnTxt}>Next: Your profile</Text>
                <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
              </Pressable>
            </StepFade>
          )}

          {step === 'profile' && (
            <StepFade stepKey="profile">
              <MultilineField label="BIO (min 10 characters)"
                value={bio} onChangeText={setBio}
                placeholder="Share a bit about yourself and why you want to support peers..." />
              <Field label="FOCUS AREA (optional)"
                value={focusArea} onChangeText={setFocusArea}
                placeholder="e.g. First-year adjustment, exam stress" />

              <Pressable
                style={[s.btn, (!step2Ready || loading) && s.btnDisabled]}
                disabled={!step2Ready || loading}
                onPress={handleSubmit}
              >
                <Text style={s.btnTxt}>{loading ? 'Submitting…' : 'Submit application'}</Text>
              </Pressable>
            </StepFade>
          )}

          {step === 'done' && (
            <StepFade stepKey="done">
              <View style={s.infoBox}>
                <Ionicons name="mail-outline" size={16} color={colors.sageDeep} />
                <Text style={s.infoText}>
                  You'll receive confirmation once approved. To log in, choose "Counsellor · Peer Mentor" on the role select screen, then "Peer Mentor."
                </Text>
              </View>
              <Pressable style={s.btn} onPress={() => navigation.replace('Login', { role: 'MENTOR' })}>
                <Text style={s.btnTxt}>Back to Peer Mentor login</Text>
              </Pressable>
            </StepFade>
          )}
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ── Reusable field components ─────────────────────────────────────────────────
function Field({ label, value, onChangeText, placeholder, autoCapitalize = 'sentences', keyboardType = 'default' }: {
  label: string; value: string; onChangeText: (t: string) => void;
  placeholder?: string; autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  keyboardType?: 'default' | 'email-address';
}) {
  return (
    <View style={s.fieldWrap}>
      <Text style={s.fieldLabel}>{label}</Text>
      <TextInput
        style={s.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.inkFaint}
        autoCapitalize={autoCapitalize}
        autoCorrect={false}
        keyboardType={keyboardType}
      />
    </View>
  );
}

function PasswordField({ label, value, onChangeText, showPw, togglePw }: {
  label: string; value: string; onChangeText: (t: string) => void;
  showPw: boolean; togglePw: () => void;
}) {
  return (
    <View style={s.fieldWrap}>
      <Text style={s.fieldLabel}>{label}</Text>
      <View style={s.pwRow}>
        <TextInput
          style={[s.input, s.inputFlex]}
          value={value}
          onChangeText={onChangeText}
          placeholder="••••••••"
          placeholderTextColor={colors.inkFaint}
          secureTextEntry={!showPw}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <Pressable style={s.eyeBtn} onPress={togglePw}>
          <Ionicons name={showPw ? 'eye-off-outline' : 'eye-outline'} size={18} color={colors.inkFaint} />
        </Pressable>
      </View>
    </View>
  );
}

function MultilineField({ label, value, onChangeText, placeholder }: {
  label: string; value: string; onChangeText: (t: string) => void; placeholder?: string;
}) {
  return (
    <View style={s.fieldWrap}>
      <Text style={s.fieldLabel}>{label}</Text>
      <TextInput
        style={[s.input, s.multilineInput]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.inkFaint}
        multiline
        numberOfLines={4}
        textAlignVertical="top"
      />
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
// Sage-green accent (colors.sage) rather than the counsellor flow's blue, matching the sage color
// coding already used for peer-mentor UI elsewhere in the app (e.g. CommunityScreen's mentor CTA).
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  scroll: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
  },

  backBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: spacing.lg, paddingTop: spacing.md,
    paddingBottom: spacing.xs, alignSelf: 'flex-start',
  },
  backTxt:  { fontFamily: fonts.bodyMedium, fontSize: fontSizes.sm, color: colors.inkSoft },

  iconCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: colors.sageSoft,
    alignItems: 'center', justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: spacing.lg,
    ...shadow.sm,
  },

  heading: {
    fontFamily: fonts.display,
    fontSize: fontSizes.display,
    color: colors.ink,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  sub: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.sm,
    color: colors.inkSoft,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.sm,
  },

  pillRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
    gap: spacing.xs,
  },
  pill: {
    paddingHorizontal: spacing.md, paddingVertical: 6,
    borderRadius: radii.pill, borderWidth: 1.5,
  },
  pillActive:   { borderColor: colors.sage, backgroundColor: colors.sage },
  pillDone:     { borderColor: colors.sage, backgroundColor: colors.sageSoft },
  pillInactive: { borderColor: colors.line, backgroundColor: colors.surface },
  pillTxt:      { fontFamily: fonts.bodyBold, fontSize: fontSizes.xs, color: '#fff' },
  pillTxtDone:  { color: colors.sage },
  pillTxtInactive: { color: colors.inkFaint },
  pillLine:     { width: 24, height: 1.5, backgroundColor: colors.line },

  fieldWrap: { marginBottom: spacing.lg },
  fieldLabel: {
    fontFamily: fonts.bodyBold, fontSize: fontSizes.xs,
    color: colors.inkFaint, letterSpacing: 0.5,
    textTransform: 'uppercase', marginBottom: 8,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1.5, borderColor: colors.line,
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg, paddingVertical: 14,
    fontFamily: fonts.body, fontSize: fontSizes.base, color: colors.ink,
  },
  inputFlex: { flex: 1 },
  multilineInput: { height: 110, paddingTop: 14 },

  pwRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  eyeBtn: { width: 44, height: 48, alignItems: 'center', justifyContent: 'center' },

  btn: {
    flexDirection: 'row', gap: 6,
    backgroundColor: colors.sage,
    borderRadius: radii.pill,
    paddingVertical: 16,
    alignItems: 'center', justifyContent: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
    ...shadow.sm,
  },
  btnDisabled: { opacity: 0.45 },
  btnTxt: {
    fontFamily: fonts.bodyBold, fontSize: fontSizes.base,
    color: '#FFFFFF', letterSpacing: 0.3,
  },

  infoBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm,
    backgroundColor: colors.sageSoft,
    borderRadius: radii.md,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  infoText: {
    flex: 1,
    fontFamily: fonts.bodyMedium, fontSize: fontSizes.sm,
    color: colors.sageDeep,
    lineHeight: 22,
  },
});
