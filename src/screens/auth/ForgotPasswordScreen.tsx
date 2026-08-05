import React, { useRef, useState } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet,
  KeyboardAvoidingView, Platform, Animated, Easing,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { forgotPassword } from '@/api/auth';
import { useToast } from '@/state/useToast';
import { ApiRequestError } from '@/api/client';
import { colors, fonts, fontSizes, radii, spacing, shadow } from '@/theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'ForgotPassword'>;

export function ForgotPasswordScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const toast  = useToast();
  const [email, setEmail]     = useState(route.params?.email ?? '');
  const [loading, setLoading] = useState(false);
  const [sent, setSent]       = useState(false);

  // Shake animation for invalid submit
  const shakeX = useRef(new Animated.Value(0)).current;
  const shake  = () => {
    Animated.sequence([
      Animated.timing(shakeX, { toValue: -8, duration: 60, useNativeDriver: true, easing: Easing.linear }),
      Animated.timing(shakeX, { toValue:  8, duration: 60, useNativeDriver: true, easing: Easing.linear }),
      Animated.timing(shakeX, { toValue: -6, duration: 60, useNativeDriver: true, easing: Easing.linear }),
      Animated.timing(shakeX, { toValue:  0, duration: 60, useNativeDriver: true, easing: Easing.linear }),
    ]).start();
  };

  const canSubmit = email.trim().includes('@') && !loading;

  const handleSend = async () => {
    if (!canSubmit) { shake(); return; }
    setLoading(true);
    try {
      await forgotPassword(email.trim().toLowerCase());
      setSent(true);
    } catch (err) {
      toast(err instanceof ApiRequestError ? err.message : 'Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[s.root, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Back */}
      <Pressable style={s.backBtn} onPress={() => navigation.goBack()} hitSlop={12}>
        <Text style={s.backIcon}>‹</Text>
        <Text style={s.backTxt}>Back</Text>
      </Pressable>

      <View style={s.body}>
        {/* Icon */}
        <View style={s.iconCircle}>
          <Text style={s.iconEmoji}>{sent ? '📬' : '🔐'}</Text>
        </View>

        {/* Heading */}
        <Text style={s.heading}>{sent ? 'Check your email' : 'Forgot password?'}</Text>
        <Text style={s.sub}>
          {sent
            ? `We sent a 6-digit code to\n${email.trim().toLowerCase()}\n\nIt expires in 15 minutes.`
            : "No worries. Enter your email and we'll\nsend you a reset code."}
        </Text>

        {!sent ? (
          <>
            {/* Email field */}
            <Animated.View style={[s.fieldWrap, { transform: [{ translateX: shakeX }] }]}>
              <Text style={s.fieldLabel}>EMAIL ADDRESS</Text>
              <TextInput
                style={s.input}
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor={colors.inkFaint}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                returnKeyType="send"
                onSubmitEditing={handleSend}
              />
            </Animated.View>

            {/* Submit */}
            <Pressable
              style={[s.btn, !canSubmit && s.btnDisabled]}
              onPress={handleSend}
              disabled={!canSubmit}
            >
              <Text style={s.btnTxt}>{loading ? 'Sending…' : 'Send reset code'}</Text>
            </Pressable>
          </>
        ) : (
          <>
            {/* CTA to enter code */}
            <Pressable
              style={s.btn}
              onPress={() => navigation.replace('ResetPassword', { email: email.trim().toLowerCase() })}
            >
              <Text style={s.btnTxt}>Enter my code →</Text>
            </Pressable>

            {/* Resend */}
            <Pressable style={s.resendBtn} onPress={() => setSent(false)}>
              <Text style={s.resendTxt}>Didn't get it? Resend</Text>
            </Pressable>
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    alignSelf: 'flex-start',
  },
  backIcon: { fontSize: 22, color: colors.inkSoft, lineHeight: 24 },
  backTxt:  { fontFamily: fonts.bodyMedium, fontSize: fontSizes.sm, color: colors.inkSoft },

  body: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
  },

  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.coralSoft,
    alignItems: 'center',
    justifyContent: 'center',
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

  fieldWrap: { width: '100%', marginBottom: spacing.xl },
  fieldLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.xs,
    color: colors.inkFaint,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  input: {
    width: '100%',
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.line,
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    fontFamily: fonts.body,
    fontSize: fontSizes.base,
    color: colors.ink,
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
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.base,
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },

  resendBtn: { marginTop: spacing.lg, paddingVertical: 8 },
  resendTxt: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.sm,
    color: colors.coral,
    textAlign: 'center',
  },
});
