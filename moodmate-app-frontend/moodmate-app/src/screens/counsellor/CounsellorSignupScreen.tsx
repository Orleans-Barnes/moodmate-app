/**
 * CounsellorSignupScreen
 *
 * Two-step flow for counsellors applying to join MoodMate:
 *   Step 1 — Account details (name, email, password)
 *   Step 2 — Professional profile (title, bio, specialties)
 *
 * On submit it:
 *   1. Signs up a standard account (POST /api/auth/signup)
 *   2. Immediately submits a counsellor application (POST /api/support/counsellor-requests)
 *   3. Shows a "pending approval" confirmation — counsellor logs in once admin approves
 */
import React, { useState } from 'react';
import {
  View, Text, Pressable, StyleSheet, ScrollView,
  TextInput, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { signup } from '@/api/auth';
import { submitCounsellorRequest } from '@/api/support';
import { ApiRequestError } from '@/api/client';
import { colors, fonts, fontSizes, spacing, radii, shadow } from '@/theme/tokens';
import { useKeyboardOffset } from '@/hooks/useKeyboardOffset';

type Props = NativeStackScreenProps<RootStackParamList, 'CounsellorSignup'>;

type Step = 'account' | 'profile' | 'done';

export function CounsellorSignupScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const keyboardHeight = useKeyboardOffset();

  // Step 1 — account
  const [fullName, setFullName]   = useState('');
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [showPw, setShowPw]       = useState(false);

  // Step 2 — profile
  const [title, setTitle]         = useState('');
  const [bio, setBio]             = useState('');
  const [specialties, setSpecialties] = useState('');

  const [step, setStep]     = useState<Step>('account');
  const [loading, setLoading] = useState(false);

  // ── Step 1 validation ────────────────────────────────────────────────────
  const step1Ready =
    fullName.trim().length > 0 &&
    email.trim().includes('@') &&
    password.length >= 8;

  // ── Step 2 validation ────────────────────────────────────────────────────
  const step2Ready = title.trim().length > 0 && bio.trim().length >= 10;

  // ── Submit ───────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!step2Ready) return;
    setLoading(true);
    try {
      // 1. Create student account
      const { token } = await signup({
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        password,
      });

      // 2. Submit counsellor application
      await submitCounsellorRequest(token, {
        title: title.trim(),
        bio: bio.trim(),
        specialties: specialties.trim() || undefined,
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
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Back */}
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
        contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + spacing.xxl + keyboardHeight }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Icon */}
        <View style={s.iconCircle}>
          <Ionicons
            name={step === 'done' ? 'checkmark-circle' : step === 'profile' ? 'school-outline' : 'heart-outline'}
            size={32}
            color={colors.coral}
          />
        </View>

        {/* Heading */}
        <Text style={s.heading}>
          {step === 'done'
            ? 'Application submitted!'
            : step === 'profile'
            ? 'Your professional profile'
            : 'Apply as a counsellor'}
        </Text>
        <Text style={s.sub}>
          {step === 'done'
            ? "Once an admin reviews and approves your application, you'll be able to log in as a counsellor."
            : step === 'profile'
            ? "Tell the MoodMate community about your background. This appears on your counsellor card."
            : "Create your account first, then share your counselling background for admin review."}
        </Text>

        {/* ── Progress pills ── */}
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

        {/* ── Step 1 — Account ── */}
        {step === 'account' && (
          <>
            <Field label="FULL NAME" value={fullName} onChangeText={setFullName}
              placeholder="Ama Mensah" autoCapitalize="words" />
            <Field label="EMAIL" value={email} onChangeText={setEmail}
              placeholder="you@example.com" autoCapitalize="none" keyboardType="email-address" />
            <PasswordField label="PASSWORD (min 8 characters)" value={password}
              onChangeText={setPassword} showPw={showPw} togglePw={() => setShowPw(v => !v)} />

            <Pressable
              style={[s.btn, !step1Ready && s.btnDisabled]}
              disabled={!step1Ready}
              onPress={() => setStep('profile')}
            >
              <Text style={s.btnTxt}>Next: Professional profile</Text>
            </Pressable>
          </>
        )}

        {/* ── Step 2 — Profile ── */}
        {step === 'profile' && (
          <>
            <Field label="PROFESSIONAL TITLE"
              value={title} onChangeText={setTitle}
              placeholder="e.g. Licensed counsellor, campus wellbeing specialist" />
            <MultilineField label="BIO (min 10 characters)"
              value={bio} onChangeText={setBio}
              placeholder="Share your background, approach, and what you specialise in..." />
            <Field label="SPECIALTIES (optional)"
              value={specialties} onChangeText={setSpecialties}
              placeholder="e.g. Anxiety, grief, academic stress" />

            <Pressable
              style={[s.btn, (!step2Ready || loading) && s.btnDisabled]}
              disabled={!step2Ready || loading}
              onPress={handleSubmit}
            >
              <Text style={s.btnTxt}>{loading ? 'Submitting…' : 'Submit application'}</Text>
            </Pressable>
          </>
        )}

        {/* ── Done ── */}
        {step === 'done' && (
          <>
            <View style={s.infoBox}>
              <Ionicons name="mail-outline" size={16} color={colors.inkSoft} />
              <Text style={s.infoText}>
                Your application is now waiting for admin approval. Once approved, use the Counsellor option to log in.
              </Text>
            </View>
            <Pressable style={s.btn} onPress={() => navigation.replace('Login', { role: 'COUNSELLOR' })}>
              <Text style={s.btnTxt}>Back to Counsellor login</Text>
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
    backgroundColor: colors.coralSoft,
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
  pillActive:   { borderColor: '#579E65', backgroundColor: '#579E65' },
  pillDone:     { borderColor: '#579E65', backgroundColor: '#E9F2EC' },
  pillInactive: { borderColor: colors.line, backgroundColor: colors.surface },
  pillTxt:      { fontFamily: fonts.bodyBold, fontSize: fontSizes.xs, color: '#fff' },
  pillTxtDone:  { color: '#579E65' },
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
    backgroundColor: '#579E65',
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
    flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm,
    backgroundColor: colors.coralSoft,
    borderRadius: radii.md,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  infoText: {
    flex: 1,
    fontFamily: fonts.bodyMedium, fontSize: fontSizes.sm,
    color: colors.coralDeep, lineHeight: 22,
  },
});
