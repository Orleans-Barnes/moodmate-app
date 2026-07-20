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
 */
import React, { useState } from 'react';
import {
  View, Text, Pressable, StyleSheet, ScrollView,
  TextInput, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { signup } from '@/api/auth';
import { submitMentorApplication } from '@/api/support';
import { ApiRequestError } from '@/api/client';
import { colors, fonts, fontSizes, spacing, radii, shadow } from '@/theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'PeerMentorSignup'>;

type Step = 'account' | 'profile' | 'done';

export function PeerMentorSignupScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();

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

  // ── Step 1 validation ────────────────────────────────────────────────────
  const step1Ready =
    fullName.trim().length > 0 &&
    email.trim().includes('@') &&
    password.length >= 8;

  // ── Step 2 validation ────────────────────────────────────────────────────
  const step2Ready = bio.trim().length > 20;

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

      setStep('done');
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
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {step !== 'done' && (
        <Pressable
          style={s.backBtn}
          onPress={() => step === 'profile' ? setStep('account') : navigation.goBack()}
          hitSlop={12}
        >
          <Text style={s.backIcon}>‹</Text>
          <Text style={s.backTxt}>{step === 'profile' ? 'Back' : 'Back to login'}</Text>
        </Pressable>
      )}

      <ScrollView
        contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + spacing.xxl }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={s.iconCircle}>
          <Text style={s.iconEmoji}>
            {step === 'done' ? '✅' : step === 'profile' ? '🤝' : '💚'}
          </Text>
        </View>

        <Text style={s.heading}>
          {step === 'done'
            ? 'Application submitted!'
            : step === 'profile'
            ? 'Your mentor profile'
            : 'Apply as a peer mentor'}
        </Text>
        <Text style={s.sub}>
          {step === 'done'
            ? "Once an admin reviews and approves your application, you'll be able to log in as a peer mentor."
            : step === 'profile'
            ? "Tell students a bit about yourself. This appears on your mentor card."
            : 'Create your account first, then tell us a bit about yourself.'}
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
          <>
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
              <Text style={s.btnTxt}>Next: Your profile →</Text>
            </Pressable>
          </>
        )}

        {step === 'profile' && (
          <>
            <MultilineField label="BIO (min 20 characters)"
              value={bio} onChangeText={setBio}
              placeholder="Share a bit about yourself and why you want to support other students..." />
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
          </>
        )}

        {step === 'done' && (
          <>
            <View style={s.infoBox}>
              <Text style={s.infoText}>
                📧 You'll receive confirmation once approved. Log in using the PEER MENTOR option on the role select screen.
              </Text>
            </View>
            <Pressable style={s.btn} onPress={() => navigation.replace('RoleSelect')}>
              <Text style={s.btnTxt}>Back to login</Text>
            </Pressable>
          </>
        )}
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
          <Text style={s.eyeIcon}>{showPw ? '🙈' : '👁️'}</Text>
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
  backIcon: { fontSize: 22, color: colors.inkSoft, lineHeight: 24 },
  backTxt:  { fontFamily: fonts.bodyMedium, fontSize: fontSizes.sm, color: colors.inkSoft },

  iconCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: colors.sageSoft,
    alignItems: 'center', justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: spacing.lg,
    ...shadow.sm,
  },
  iconEmoji: { fontSize: 36 },

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
  eyeIcon: { fontSize: 18 },

  btn: {
    backgroundColor: colors.sage,
    borderRadius: radii.pill,
    paddingVertical: 16,
    alignItems: 'center',
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
    backgroundColor: colors.sageSoft,
    borderRadius: radii.md,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  infoText: {
    fontFamily: fonts.bodyMedium, fontSize: fontSizes.sm,
    color: '#1B4F3A',
    lineHeight: 22,
  },
});
