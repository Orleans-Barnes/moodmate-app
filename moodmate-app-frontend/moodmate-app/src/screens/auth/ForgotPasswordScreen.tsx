/**
 * ForgotPasswordScreen — Calm Forest password recovery (Figma "09 Password Recovery")
 *
 * Figma's copy says "reset link" but the real backend flow sends a 6-digit code that the user
 * types into ResetPasswordScreen (see forgotPassword/resetPassword in api/auth.ts) — the copy
 * here describes what actually happens instead of copying Figma's wording verbatim.
 */
import React, { useRef, useState } from 'react';
import {
  View, Text, Pressable, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Animated, Easing,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { forgotPassword } from '@/api/auth';
import { useToast } from '@/state/useToast';
import { ApiRequestError } from '@/api/client';
import { BackButton } from '@/components/BackButton';
import { TextField } from '@/components/TextField';
import { useKeyboardOffset } from '@/hooks/useKeyboardOffset';
import { fonts, fontSizes, radii, spacing, calm } from '@/theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'ForgotPassword'>;

export function ForgotPasswordScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const keyboardHeight = useKeyboardOffset();
  const [email, setEmail] = useState(route.params?.email ?? '');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const shakeX = useRef(new Animated.Value(0)).current;
  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeX, { toValue: -8, duration: 60, useNativeDriver: true, easing: Easing.linear }),
      Animated.timing(shakeX, { toValue: 8, duration: 60, useNativeDriver: true, easing: Easing.linear }),
      Animated.timing(shakeX, { toValue: -6, duration: 60, useNativeDriver: true, easing: Easing.linear }),
      Animated.timing(shakeX, { toValue: 0, duration: 60, useNativeDriver: true, easing: Easing.linear }),
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
    <KeyboardAvoidingView style={s.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + spacing.xl + keyboardHeight }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={[s.header, { paddingTop: insets.top + spacing.lg }]}>
          <BackButton onPress={() => navigation.goBack()} />
        </View>

        <View style={s.body}>
        <Text style={s.title}>{sent ? 'Check your email' : 'Reset your password'}</Text>
        <Text style={s.sub}>
          {sent
            ? `We sent a 6-digit code to ${email.trim().toLowerCase()}. It expires in 15 minutes.`
            : "Enter your student email and we'll send you a 6-digit reset code. It expires in 15 minutes."}
        </Text>

        {!sent ? (
          <>
            <Animated.View style={{ width: '100%', transform: [{ translateX: shakeX }] }}>
              <TextField
                label="Student email"
                placeholder="you@st.knust.edu.gh"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                returnKeyType="send"
                onSubmitEditing={handleSend}
              />
            </Animated.View>

            <Pressable style={[s.cta, !canSubmit && s.ctaDisabled]} onPress={handleSend} disabled={!canSubmit}>
              <Text style={s.ctaText}>{loading ? 'Sending…' : 'Send reset code'}</Text>
            </Pressable>

            <View style={s.help}>
              <Text style={s.helpTitle}>Didn't get the email?</Text>
              <Text style={s.helpBody}>Check your spam folder, or contact the campus counselling office for manual verification.</Text>
            </View>
          </>
        ) : (
          <>
            <Pressable style={s.cta} onPress={() => navigation.replace('ResetPassword', { email: email.trim().toLowerCase() })}>
              <Text style={s.ctaText}>Enter my code →</Text>
            </Pressable>
            <Pressable style={s.resend} onPress={() => setSent(false)}>
              <Text style={s.resendText}>Didn't get it? Resend</Text>
            </Pressable>
          </>
        )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: calm.bg },
  scroll: { flexGrow: 1 },
  header: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxl },

  body: { paddingHorizontal: spacing.xl, gap: spacing.xl },

  title: {
    fontFamily: fonts.displayExtraBold,
    fontSize: fontSizes.xxl + 2,
    color: calm.forest,
    letterSpacing: -0.3,
  },
  sub: {
    fontFamily: fonts.body,
    fontSize: fontSizes.md - 1,
    color: calm.muted,
    lineHeight: 22,
    marginTop: -spacing.md,
  },

  cta: {
    backgroundColor: calm.primary,
    borderRadius: radii.pill,
    paddingVertical: 19,
    alignItems: 'center',
  },
  ctaDisabled: { opacity: 0.45 },
  ctaText: { fontFamily: fonts.bodyBold, fontSize: fontSizes.md, color: '#FFFFFF' },

  help: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: calm.border,
    borderRadius: radii.lg,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  helpTitle: { fontFamily: fonts.bodyBold, fontSize: fontSizes.base - 1, color: calm.forest },
  helpBody: { fontFamily: fonts.body, fontSize: fontSizes.sm, color: calm.muted, lineHeight: 20 },

  resend: { alignItems: 'center', paddingVertical: spacing.sm },
  resendText: { fontFamily: fonts.bodyMedium, fontSize: fontSizes.sm, color: calm.primary },
});
