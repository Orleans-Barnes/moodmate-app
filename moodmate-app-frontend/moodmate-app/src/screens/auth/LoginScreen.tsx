/**
 * LoginScreen — Calm Forest sign-in (Figma "08 Log In")
 *
 * Role theming (STUDENT/COUNSELLOR/MENTOR/ADMIN) is preserved — Figma's prototype only shows
 * the student path, but the app has four real sign-in destinations sharing this one screen, so
 * the heading/icon/badge still switch per role. The button stays the single Calm Forest green
 * for every role rather than each portal re-theming the CTA, matching the one-brand-color system
 * the rest of the redesign uses.
 */
import React, { useEffect, useState } from 'react';
import {
  Alert,
  View, Text, Pressable, StyleSheet, Image, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList, UserRole } from '@/navigation/types';
import { TextField } from '@/components/TextField';
import { useToast } from '@/state/useToast';
import { useAuthStore } from '@/state/useAuthStore';
import { login, refreshSession } from '@/api/auth';
import { ApiRequestError } from '@/api/client';
import type { AuthResponse } from '@/api/types';
import { useKeyboardOffset } from '@/hooks/useKeyboardOffset';
import { fonts, fontSizes, spacing, radii, calm } from '@/theme/tokens';
import { resolveRoleAccess } from './roleAccessMessaging';
import {
  biometricHardwareReady,
  findBiometricAccount,
  normalizeBiometricEmail,
  readBiometricRefreshToken,
  removeBiometricAccount,
  saveBiometricRefreshToken,
} from '@/utils/biometricCredentials';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

const logo = require('@/assets/moodmate-logo.png');

const ROLE_THEME: Record<UserRole, {
  heading: string; sub: string; icon: keyof typeof Ionicons.glyphMap; badge?: string; accent: string;
}> = {
  STUDENT: { heading: 'Welcome back', sub: 'Your tree missed you.', icon: 'leaf', accent: calm.primary },
  COUNSELLOR: { heading: 'Counsellor Portal', sub: 'Sign in to support your counselling sessions.', icon: 'heart', badge: 'Counsellor Portal', accent: calm.dustyBlue },
  MENTOR: { heading: 'Peer Mentor', sub: 'Sign in to support peers, one conversation at a time.', icon: 'people', badge: 'Peer Mentor Portal', accent: calm.mint },
  ADMIN: { heading: 'Admin Access', sub: 'Platform management & oversight.', icon: 'key', badge: 'Admin Access', accent: calm.dustyPurple },
};

const EMAIL_LABEL: Record<UserRole, string> = {
  STUDENT: 'Student email',
  COUNSELLOR: 'Counsellor email',
  MENTOR: 'Peer Mentor email',
  ADMIN: 'Admin email',
};

export function LoginScreen({ navigation, route }: Props) {
  const role = route.params?.role ?? 'STUDENT';
  const theme = ROLE_THEME[role];
  const insets = useSafeAreaInsets();
  const keyboardHeight = useKeyboardOffset();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [keepSignedIn, setKeepSignedIn] = useState(true);
  const [loading, setLoading] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const toast = useToast();
  const setSession = useAuthStore((s) => s.setSession);
  const loginAsGuest = useAuthStore((s) => s.loginAsGuest);

  const canSubmit = email.trim().length > 0 && password.trim().length > 0 && !loading;

  const finishLogin = async (session: AuthResponse) => {
    await setSession(session.token, session.refreshToken, session.user);
    if (session.user.role === 'ADMIN') navigation.replace('AdminDashboard');
    else navigation.replace('Main');
  };

  const continueAfterPasswordLogin = async (session: AuthResponse) => {
    const ready = await biometricHardwareReady();
    const existing = ready ? await findBiometricAccount(session.user.role, session.user.email) : null;
    if (!ready || existing) {
      await finishLogin(session);
      return;
    }

    Alert.alert(
      'Enable fingerprint sign-in?',
      'Save fingerprint unlock for this MoodMate account on this device.',
      [
        { text: 'Not now', style: 'cancel', onPress: () => { void finishLogin(session); } },
        {
          text: 'Enable',
          onPress: () => {
            saveBiometricRefreshToken(session.user, session.refreshToken)
              .then(() => toast('Fingerprint sign-in enabled'))
              .catch(() => toast('Could not enable fingerprint sign-in. You can still use your password.'))
              .finally(() => { void finishLogin(session); });
          },
        },
      ],
    );
  };

  const handleRoleResolution = (session: AuthResponse) => {
    const resolution = resolveRoleAccess(role, session.user.role);
    if (resolution.kind === 'allowed') return false;

    if (resolution.kind === 'pendingCounsellor') {
      Alert.alert(resolution.title, resolution.message, [
        { text: resolution.primaryLabel, onPress: () => navigation.navigate('CounsellorSignup') },
        { text: resolution.secondaryLabel, onPress: () => { void finishLogin(session); } },
        { text: 'Not now', style: 'cancel' },
      ]);
      return true;
    }

    if (resolution.kind === 'continueMentorAcademy') {
      Alert.alert(resolution.title, resolution.message, [
        {
          text: resolution.primaryLabel,
          onPress: () =>
            navigation.replace('Academy', {
              isSignupFlow: true,
              token: session.token,
              email: session.user.email,
            }),
        },
        { text: resolution.secondaryLabel, onPress: () => { void finishLogin(session); } },
        { text: 'Not now', style: 'cancel' },
      ]);
      return true;
    }

    if (resolution.kind === 'wrongPortal') {
      Alert.alert(resolution.title, resolution.message, [
        {
          text: `Open ${resolution.targetLabel}`,
          onPress: () => navigation.replace('Login', { role: resolution.targetRole }),
        },
        { text: 'Not now', style: 'cancel' },
      ]);
      return true;
    }

    Alert.alert(resolution.title, resolution.message, [
      { text: 'Set up admin', onPress: () => navigation.navigate('AdminSetup') },
      { text: 'Use another account', style: 'cancel' },
    ]);
    return true;
  };

  useEffect(() => {
    let isMounted = true;
    (async () => {
      const ready = await biometricHardwareReady();
      if (isMounted) setBiometricAvailable(ready);
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleLogin = async () => {
    if (!canSubmit) return;
    setLoading(true);
    try {
      const session = await login({ email: email.trim().toLowerCase(), password });
      if (handleRoleResolution(session)) return;
      await continueAfterPasswordLogin(session);
    } catch (err) {
      toast(err instanceof ApiRequestError ? err.message : 'Could not sign in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGuest = () => {
    loginAsGuest();
    navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
  };

  const handleBiometricLogin = async () => {
    if (loading) return;
    try {
      if (!await biometricHardwareReady()) {
        toast(Platform.OS === 'web'
          ? 'Fingerprint sign-in is not available on web. Use your password instead.'
          : 'Set up fingerprint unlock on this device first.');
        return;
      }

      const account = await findBiometricAccount(role, email);
      if (!account) {
        toast(email.trim()
          ? 'No fingerprint sign-in is saved for this account. Log in with your password once to enable it.'
          : 'Log in with your password once to enable fingerprint sign-in.');
        return;
      }

      const storedRefreshToken = await readBiometricRefreshToken(account);
      if (!storedRefreshToken) {
        toast('Fingerprint sign-in is no longer available. Log in with your password to enable it again.');
        return;
      }

      setLoading(true);
      const session = await refreshSession(storedRefreshToken);
      const sessionEmail = normalizeBiometricEmail(session.user.email);
      if (sessionEmail !== account.email || session.user.role !== account.role) {
        await removeBiometricAccount(account);
        toast('That saved fingerprint sign-in did not match this account. Please log in with your password.');
        return;
      }
      try {
        await saveBiometricRefreshToken(session.user, session.refreshToken);
      } catch {
        // Non-fatal: the current sign-in can continue even if the rotated biometric token fails to persist.
      }
      if (handleRoleResolution(session)) return;
      await finishLogin(session);
    } catch (err) {
      toast(err instanceof ApiRequestError ? err.message : 'Fingerprint sign-in failed. Use your password instead.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={s.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        contentContainerStyle={[
          s.scroll,
          {
            paddingTop: insets.top + spacing.lg,
            paddingBottom: insets.bottom + spacing.xl + keyboardHeight,
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {role !== 'STUDENT' && (
          <Pressable
            style={s.changeRole}
            onPress={() => (navigation.canGoBack() ? navigation.goBack() : navigation.replace('RoleSelect'))}
          >
            <Text style={s.changeRoleText}>‹ Change role</Text>
          </Pressable>
        )}

        <View style={s.logoWrap}>
          <Image source={logo} style={s.logo} resizeMode="contain" />
          {theme.badge && (
            <View style={[s.badge, { backgroundColor: theme.accent + '22' }]}>
              <Text style={[s.badgeText, { color: theme.accent }]}>{theme.badge}</Text>
            </View>
          )}
        </View>

        <Text style={s.title}>{theme.heading}</Text>
        <Text style={s.sub}>{theme.sub}</Text>

        <View style={s.form}>
          <TextField label={EMAIL_LABEL[role]} placeholder="you@example.com" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
          <TextField label="Password" placeholder="••••••••••" isPassword value={password} onChangeText={setPassword} />
        </View>

        <View style={s.rememberRow}>
          <Pressable style={s.rememberLeft} onPress={() => setKeepSignedIn((v) => !v)}>
            <View style={[s.checkbox, keepSignedIn && { backgroundColor: theme.accent }]}>
              {keepSignedIn && <Ionicons name="checkmark" size={13} color="#FFFFFF" />}
            </View>
            <Text style={s.rememberText}>Keep me signed in</Text>
          </Pressable>
          <Pressable onPress={() => navigation.navigate('ForgotPassword', { email })}>
            <Text style={[s.forgotText, { color: theme.accent }]}>Forgot password?</Text>
          </Pressable>
        </View>

        <Pressable style={[s.cta, !canSubmit && s.ctaDisabled]} disabled={!canSubmit} onPress={handleLogin}>
          <Text style={s.ctaText}>{loading ? 'Signing in…' : 'Log in'}</Text>
        </Pressable>

        {biometricAvailable ? (
          <Pressable style={s.biometric} onPress={handleBiometricLogin} disabled={loading}>
            <Ionicons name="finger-print-outline" size={18} color={calm.mint} />
            <Text style={s.biometricText}>Use fingerprint</Text>
          </Pressable>
        ) : null}

        <View style={s.footer}>
          {role === 'STUDENT' && (
            <Pressable onPress={() => navigation.navigate('Signup')}>
              <Text style={s.footerLink}>New to MoodMate?  <Text style={{ color: calm.forest }}>Create an account</Text></Text>
            </Pressable>
          )}
          {role === 'COUNSELLOR' && (
            <Pressable onPress={() => navigation.navigate('CounsellorSignup')}>
              <Text style={s.footerLink}>New counsellor?  <Text style={{ color: calm.forest }}>Apply to join</Text></Text>
            </Pressable>
          )}
          {role === 'MENTOR' && (
            <Pressable onPress={() => navigation.navigate('PeerMentorSignup')}>
              <Text style={s.footerLink}>New peer mentor?  <Text style={{ color: calm.forest }}>Apply to join</Text></Text>
            </Pressable>
          )}
          {role === 'ADMIN' && (
            <Pressable onPress={() => navigation.navigate('AdminSetup')}>
              <Text style={s.footerLink}>First time here?  <Text style={{ color: calm.forest }}>Set up admin account</Text></Text>
            </Pressable>
          )}
          {role === 'STUDENT' && (
            <Pressable onPress={handleGuest} style={s.guestLink}>
              <Text style={s.guestText}>Explore without an account</Text>
            </Pressable>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: calm.bg },
  scroll: { paddingHorizontal: spacing.xl },

  changeRole: { marginBottom: spacing.lg },
  changeRoleText: { fontFamily: fonts.bodyMedium, fontSize: fontSizes.sm, color: calm.muted },

  logoWrap: { alignItems: 'center', marginBottom: spacing.lg, gap: spacing.sm },
  logo: { width: 90, height: 50 },
  badge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: radii.pill },
  badgeText: { fontFamily: fonts.bodyBold, fontSize: fontSizes.xs },

  title: {
    fontFamily: fonts.displayExtraBold,
    fontSize: fontSizes.xxl + 6,
    color: calm.forest,
    letterSpacing: -0.48,
  },
  sub: {
    fontFamily: fonts.body,
    fontSize: fontSizes.md - 1,
    color: calm.muted,
    marginTop: 4,
    marginBottom: spacing.xxl,
  },

  form: { gap: spacing.lg, marginBottom: spacing.lg },

  rememberRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.xl },
  rememberLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  checkbox: {
    width: 20, height: 20, borderRadius: 6,
    borderWidth: 1.5, borderColor: calm.border,
    alignItems: 'center', justifyContent: 'center',
  },
  rememberText: { fontFamily: fonts.body, fontSize: fontSizes.base - 1, color: calm.muted },
  forgotText: { fontFamily: fonts.bodyBold, fontSize: fontSizes.base - 1 },

  cta: {
    backgroundColor: calm.primary,
    borderRadius: radii.pill,
    paddingVertical: 19,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  ctaDisabled: { opacity: 0.45 },
  ctaText: { fontFamily: fonts.bodyBold, fontSize: fontSizes.md, color: '#FFFFFF' },

  biometric: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: calm.forest,
    borderRadius: radii.pill,
    paddingVertical: 17,
    marginBottom: spacing.xxl,
  },
  biometricText: { fontFamily: fonts.bodyBold, fontSize: fontSizes.base, color: calm.bg },

  footer: { alignItems: 'center', gap: spacing.lg },
  footerLink: { fontFamily: fonts.bodyBold, fontSize: fontSizes.base - 1, color: calm.muted },
  guestLink: { paddingVertical: 4 },
  guestText: { fontFamily: fonts.bodyMedium, fontSize: fontSizes.xs + 1, color: calm.faint },
});
