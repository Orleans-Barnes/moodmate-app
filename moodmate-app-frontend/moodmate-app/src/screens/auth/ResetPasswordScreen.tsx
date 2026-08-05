/**
 * ResetPasswordScreen
 *
 * Design pattern: single hidden TextInput captures the 6-digit OTP; we render
 * individual styled boxes on top (Stripe / Apple ID style). Tap anywhere on
 * the box row to focus the hidden input. Auto-advances visually as the user
 * types. Paste-aware — pasting "123456" fills all boxes instantly.
 */
import React, { useRef, useState } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet, ScrollView,
  KeyboardAvoidingView, Platform, Animated, Easing,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { resetPassword } from '@/api/auth';
import { useToast } from '@/state/useToast';
import { ApiRequestError } from '@/api/client';
import { useKeyboardOffset } from '@/hooks/useKeyboardOffset';
import { colors, fonts, fontSizes, radii, spacing, shadow } from '@/theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'ResetPassword'>;

const OTP_LENGTH = 6;

// ── OTP digit boxes ───────────────────────────────────────────────────────────
function OtpBoxes({
  value, focused, onPress, hasError,
}: {
  value: string; focused: boolean; onPress: () => void; hasError: boolean;
}) {
  const digits = value.split('').concat(Array(OTP_LENGTH).fill('')).slice(0, OTP_LENGTH);
  const activeIdx = Math.min(value.length, OTP_LENGTH - 1);

  return (
    <Pressable style={ob.row} onPress={onPress} accessibilityRole="button">
      {digits.map((d, i) => {
        const isActive = focused && i === activeIdx && value.length < OTP_LENGTH;
        const isFilled = i < value.length;
        return (
          <View
            key={i}
            style={[
              ob.box,
              isFilled && ob.boxFilled,
              isActive && ob.boxActive,
              hasError && ob.boxError,
            ]}
          >
            <Text style={[ob.digit, isFilled && ob.digitFilled]}>{d || ''}</Text>
            {isActive && <View style={ob.cursor} />}
          </View>
        );
      })}
    </Pressable>
  );
}

const ob = StyleSheet.create({
  row: { flexDirection: 'row', gap: 10, justifyContent: 'center' },
  box: {
    width: 46, height: 54,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxFilled: { borderColor: colors.coral, backgroundColor: colors.coralSoft },
  boxActive: { borderColor: colors.coral, backgroundColor: '#FFFFFF', ...shadow.sm },
  boxError:  { borderColor: colors.error, backgroundColor: colors.errorSoft },
  digit: {
    fontFamily: fonts.display,
    fontSize: 22,
    color: colors.inkFaint,
  },
  digitFilled: { color: colors.coral },
  cursor: {
    position: 'absolute',
    bottom: 10, width: 2, height: 22,
    backgroundColor: colors.coral,
    borderRadius: 1,
  },
});

// ── Screen ────────────────────────────────────────────────────────────────────
export function ResetPasswordScreen({ navigation, route }: Props) {
  const { email } = route.params;
  const insets    = useSafeAreaInsets();
  const toast     = useToast();
  const keyboardHeight = useKeyboardOffset();

  const [otp, setOtp]         = useState('');
  const [pw, setPw]           = useState('');
  const [showPw, setShowPw]   = useState(false);
  const [loading, setLoading] = useState(false);
  const [otpError, setOtpError] = useState(false);
  const [focused, setFocused] = useState(false);
  const [step, setStep]       = useState<'otp' | 'password'>('otp');

  const hiddenRef = useRef<TextInput>(null);
  const shakeX    = useRef(new Animated.Value(0)).current;

  const shake = () => {
    setOtpError(true);
    Animated.sequence([
      Animated.timing(shakeX, { toValue: -10, duration: 55, useNativeDriver: true, easing: Easing.linear }),
      Animated.timing(shakeX, { toValue:  10, duration: 55, useNativeDriver: true, easing: Easing.linear }),
      Animated.timing(shakeX, { toValue:  -7, duration: 55, useNativeDriver: true, easing: Easing.linear }),
      Animated.timing(shakeX, { toValue:   0, duration: 55, useNativeDriver: true, easing: Easing.linear }),
    ]).start(() => setTimeout(() => setOtpError(false), 600));
  };

  const handleOtpChange = (text: string) => {
    const cleaned = text.replace(/\D/g, '').slice(0, OTP_LENGTH);
    setOtpError(false);
    setOtp(cleaned);
    if (cleaned.length === OTP_LENGTH) {
      // All digits entered — advance to password step
      setTimeout(() => setStep('password'), 180);
    }
  };

  const canSubmit = otp.length === OTP_LENGTH && pw.length >= 8 && !loading;

  const handleReset = async () => {
    if (otp.length < OTP_LENGTH) { shake(); return; }
    if (!canSubmit) return;
    setLoading(true);
    try {
      await resetPassword(email, otp, pw);
      toast('Password updated! Sign in with your new password.');
      navigation.reset({ index: 0, routes: [{ name: 'RoleSelect' }] });
    } catch (err) {
      const msg = err instanceof ApiRequestError ? err.message : 'Could not reset password.';
      shake();
      toast(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={s.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          s.scroll,
          { paddingTop: insets.top, paddingBottom: insets.bottom + spacing.xl + keyboardHeight },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
      {/* Back */}
      <Pressable style={s.backBtn} onPress={() => navigation.goBack()} hitSlop={12}>
        <Text style={s.backIcon}>‹</Text>
        <Text style={s.backTxt}>Back</Text>
      </Pressable>

      <View style={s.body}>
        {/* Icon */}
        <View style={s.iconCircle}>
          <Ionicons name={step === 'otp' ? 'keypad-outline' : 'lock-closed-outline'} size={32} color={colors.coral} />
        </View>

        {/* Heading */}
        <Text style={s.heading}>
          {step === 'otp' ? 'Enter your code' : 'New password'}
        </Text>
        <Text style={s.sub}>
          {step === 'otp'
            ? `We sent a 6-digit code to\n${email}`
            : 'Choose something strong — at least 8 characters.'}
        </Text>

        {step === 'otp' ? (
          <>
            {/* Hidden real input */}
            <TextInput
              ref={hiddenRef}
              style={s.hiddenInput}
              value={otp}
              onChangeText={handleOtpChange}
              keyboardType="number-pad"
              maxLength={OTP_LENGTH}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              caretHidden
              importantForAutofill="yes"
              textContentType="oneTimeCode"
              autoComplete="one-time-code"
            />

            {/* Visual boxes */}
            <Animated.View style={{ transform: [{ translateX: shakeX }], marginBottom: spacing.xxl }}>
              <OtpBoxes
                value={otp}
                focused={focused}
                hasError={otpError}
                onPress={() => hiddenRef.current?.focus()}
              />
            </Animated.View>

            <Pressable
              style={[s.btn, otp.length < OTP_LENGTH && s.btnDisabled]}
              disabled={otp.length < OTP_LENGTH}
              onPress={() => {
                if (otp.length === OTP_LENGTH) setStep('password');
                else shake();
              }}
            >
              <Text style={s.btnTxt}>Continue →</Text>
            </Pressable>

            <Pressable style={s.secondaryBtn} onPress={() => navigation.goBack()}>
              <Text style={s.secondaryTxt}>Request a new code</Text>
            </Pressable>
          </>
        ) : (
          <>
            {/* Password field */}
            <View style={s.fieldWrap}>
              <Text style={s.fieldLabel}>NEW PASSWORD</Text>
              <View style={s.inputRow}>
                <TextInput
                  style={s.input}
                  value={pw}
                  onChangeText={setPw}
                  placeholder="Minimum 8 characters"
                  placeholderTextColor={colors.inkFaint}
                  secureTextEntry={!showPw}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoFocus
                  returnKeyType="done"
                  onSubmitEditing={handleReset}
                />
                <Pressable style={s.eyeBtn} onPress={() => setShowPw(v => !v)}>
                  <Ionicons name={showPw ? 'eye-off-outline' : 'eye-outline'} size={18} color={colors.inkFaint} />
                </Pressable>
              </View>
              {pw.length > 0 && pw.length < 8 && (
                <Text style={s.pwHint}>Minimum 8 characters</Text>
              )}
            </View>

            <Pressable
              style={[s.btn, !canSubmit && s.btnDisabled]}
              disabled={!canSubmit}
              onPress={handleReset}
            >
              <Text style={s.btnTxt}>{loading ? 'Updating…' : 'Set new password'}</Text>
            </Pressable>

            <Pressable style={s.secondaryBtn} onPress={() => setStep('otp')}>
              <Text style={s.secondaryTxt}>← Change code</Text>
            </Pressable>
          </>
        )}
      </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  scroll: { flexGrow: 1 },

  backBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: spacing.lg, paddingTop: spacing.md,
    paddingBottom: spacing.sm, alignSelf: 'flex-start',
  },
  backIcon: { fontSize: 22, color: colors.inkSoft, lineHeight: 24 },
  backTxt:  { fontFamily: fonts.bodyMedium, fontSize: fontSizes.sm, color: colors.inkSoft },

  body: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
  },

  iconCircle: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: colors.coralSoft,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.xl,
    ...shadow.sm,
  },
  iconEmoji: { fontSize: 40 },

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
    marginBottom: spacing.xxl,
  },

  hiddenInput: {
    position: 'absolute', width: 1, height: 1, opacity: 0,
  },

  fieldWrap: { width: '100%', marginBottom: spacing.xl },
  fieldLabel: {
    fontFamily: fonts.bodyBold, fontSize: fontSizes.xs,
    color: colors.inkFaint, letterSpacing: 0.5,
    textTransform: 'uppercase', marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1.5, borderColor: colors.line,
    borderRadius: radii.md,
    overflow: 'hidden',
  },
  input: {
    flex: 1,
    paddingHorizontal: spacing.lg, paddingVertical: 14,
    fontFamily: fonts.body, fontSize: fontSizes.base, color: colors.ink,
  },
  eyeBtn: { width: 44, alignItems: 'center', justifyContent: 'center', alignSelf: 'stretch' },
  eyeIcon: { fontSize: 16 },
  pwHint: {
    fontFamily: fonts.bodyMedium, fontSize: fontSizes.xs,
    color: colors.error, marginTop: 6,
  },

  btn: {
    width: '100%',
    backgroundColor: colors.coral,
    borderRadius: radii.pill,
    paddingVertical: 16,
    alignItems: 'center',
    ...shadow.sm,
  },
  btnDisabled: { opacity: 0.45 },
  btnTxt: {
    fontFamily: fonts.bodyBold, fontSize: fontSizes.base,
    color: '#FFFFFF', letterSpacing: 0.3,
  },

  secondaryBtn: { marginTop: spacing.lg, paddingVertical: 8 },
  secondaryTxt: {
    fontFamily: fonts.bodyMedium, fontSize: fontSizes.sm,
    color: colors.coral, textAlign: 'center',
  },
});
