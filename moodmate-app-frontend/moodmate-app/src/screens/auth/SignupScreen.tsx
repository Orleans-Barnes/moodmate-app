/**
 * SignupScreen — Calm Forest email sign-up (Figma "07 Sign Up · Email")
 *
 * Single polished flow: forest hero with curve, then the email form.
 * Google/Apple OAuth removed — student email is the only path.
 */
import React, { useState, useEffect, useRef } from 'react';
import {
  Alert,
  View, Text, Pressable, StyleSheet, ScrollView,
  KeyboardAvoidingView, Platform, Animated, Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { TextField } from '@/components/TextField';
import { PressScale } from '@/components/PressScale';
import { useToast } from '@/state/useToast';
import { useAuthStore } from '@/state/useAuthStore';
import { signup } from '@/api/auth';
import { ApiRequestError } from '@/api/client';
import { fonts, fontSizes, spacing, radii, calm } from '@/theme/tokens';
import { InstitutionPicker } from '@/components/InstitutionPicker';
import { loadInstitutions, OTHER_INSTITUTION_ID, type Institution } from '@/data/institutions';
import { CurvedForestHeader } from '@/components/CurvedForestHeader';
import { useKeyboardOffset } from '@/hooks/useKeyboardOffset';
import { biometricHardwareReady, saveBiometricRefreshToken } from '@/utils/biometricCredentials';

function resolveInstitutionId(institution: Institution | null): number | undefined {
  if (!institution || institution.id === OTHER_INSTITUTION_ID) return undefined;
  const n = Number(institution.id);
  return Number.isFinite(n) ? n : undefined;
}

type Props = NativeStackScreenProps<RootStackParamList, 'Signup'>;

function strengthOf(password: string): { bars: number; label: string } {
  if (password.length === 0) return { bars: 0, label: '' };
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[0-9]/.test(password) && /[a-zA-Z]/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;
  const bars = Math.max(1, score);
  const label = bars <= 1 ? 'Weak password' : bars === 2 ? 'Fair password' : bars === 3 ? 'Good password' : 'Strong password';
  return { bars, label };
}

export function SignupScreen({ navigation }: Props) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [institution, setInstitution] = useState<Institution | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const setSession = useAuthStore((s) => s.setSession);
  const loginAsGuest = useAuthStore((s) => s.loginAsGuest);
  const keyboardHeight = useKeyboardOffset();

  const formOpacity = useRef(new Animated.Value(0)).current;
  const formY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    loadInstitutions();
    Animated.parallel([
      Animated.timing(formOpacity, { toValue: 1, duration: 480, delay: 120, useNativeDriver: true }),
      Animated.timing(formY, { toValue: 0, duration: 480, delay: 120, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, [formOpacity, formY]);

  const canSubmit = name.trim().length > 0 && email.trim().length > 0 && institution !== null && password.length >= 8;
  const strength = strengthOf(password);

  const handleSignup = async () => {
    if (!canSubmit || loading) return;
    setLoading(true);
    try {
      const { token, refreshToken, user } = await signup({
        email: email.trim(),
        password,
        fullName: name.trim(),
        institution: institution?.shortName ?? undefined,
        institutionId: resolveInstitutionId(institution),
      });
      await setSession(token, refreshToken, user);
      const continueOnboarding = () => {
        toast('Welcome to MoodMate!');
        navigation.replace('Onboarding');
      };

      if (await biometricHardwareReady()) {
        Alert.alert(
          'Enable fingerprint sign-in?',
          'Save fingerprint unlock for this MoodMate account on this device.',
          [
            { text: 'Not now', style: 'cancel', onPress: continueOnboarding },
            {
              text: 'Enable',
              onPress: () => {
                saveBiometricRefreshToken(user, refreshToken)
                  .then(() => toast('Fingerprint sign-in enabled'))
                  .catch(() => toast('Could not enable fingerprint sign-in. You can still use your password.'))
                  .finally(continueOnboarding);
              },
            },
          ],
        );
      } else {
        continueOnboarding();
      }
    } catch (err) {
      toast(err instanceof ApiRequestError ? err.message : 'Could not create your account.');
    } finally {
      setLoading(false);
    }
  };

  const handleGuest = () => {
    loginAsGuest();
    navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
  };

  return (
    <KeyboardAvoidingView style={s.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={[s.scroll, { paddingBottom: spacing.xxxl + keyboardHeight }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <CurvedForestHeader onBack={() => navigation.goBack()} bottomPadding={spacing.md}>
          <View style={s.heroCopy}>
            <View style={s.iconRing}>
              <Ionicons name="leaf" size={28} color={calm.mint} />
            </View>
            <Text style={s.heroTitle}>Create your account</Text>
            <Text style={s.heroSub}>Free for every KNUST student.</Text>
          </View>
        </CurvedForestHeader>

        <Animated.View style={[s.formSection, { opacity: formOpacity, transform: [{ translateY: formY }] }]}>
          <View style={s.form}>
            <TextField label="Full name" placeholder="Marvelous Ajao" value={name} onChangeText={setName} />
            <TextField
              label="Student email"
              placeholder="maajao@st.knust.edu.gh"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
            <TextField label="Password" placeholder="At least 8 characters" isPassword value={password} onChangeText={setPassword} />

            <View style={s.fieldGroup}>
              <Text style={s.fieldLabel}>Institution</Text>
              <Pressable style={s.institutionInput} onPress={() => setPickerOpen(true)}>
                <Text style={[s.institutionText, !institution && s.institutionPlaceholder]} numberOfLines={1}>
                  {institution ? institution.name : 'Select your institution'}
                </Text>
                <Ionicons name="chevron-down" size={16} color={calm.muted} />
              </Pressable>
            </View>
          </View>

          {password.length > 0 && (
            <View style={s.strengthBlock}>
              <View style={s.strengthRow}>
                {[0, 1, 2, 3].map((i) => (
                  <View key={i} style={[s.strengthBar, i < strength.bars && s.strengthBarFilled]} />
                ))}
              </View>
              <Text style={s.strengthLabel}>{strength.label}</Text>
            </View>
          )}

          <PressScale
            style={[s.ctaWrap, (!canSubmit || loading) && s.ctaDisabled]}
            onPress={handleSignup}
            disabled={!canSubmit || loading}
          >
            <LinearGradient
              colors={[calm.primary, calm.primaryDeep]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={s.cta}
            >
              <Text style={s.ctaText}>{loading ? 'Creating account…' : 'Create account'}</Text>
            </LinearGradient>
          </PressScale>

          <Text style={s.legal}>
            By creating an account you agree to our Terms of Service and{' '}
            <Text style={s.legalLink} onPress={() => navigation.navigate('PrivacyPolicy')}>
              Privacy Policy
            </Text>
            .
          </Text>

          <Pressable onPress={() => navigation.navigate('Login', { role: 'STUDENT' })}>
            <Text style={s.loginLink}>
              Already have an account?  <Text style={s.loginBold}>Log in</Text>
            </Text>
          </Pressable>

          <Pressable onPress={handleGuest} style={s.guestLink}>
            <Text style={s.guestText}>Continue as guest</Text>
          </Pressable>
        </Animated.View>
      </ScrollView>

      <InstitutionPicker
        visible={pickerOpen}
        selectedId={institution?.id ?? null}
        onSelect={setInstitution}
        onClose={() => setPickerOpen(false)}
      />
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: calm.bg },
  scroll: { flexGrow: 1, paddingBottom: spacing.xxxl },

  heroCopy: { alignItems: 'center', paddingBottom: spacing.sm },
  iconRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  heroTitle: {
    fontFamily: fonts.displayExtraBold,
    fontSize: fontSizes.xxl,
    color: '#FFFFFF',
    letterSpacing: -0.4,
    textAlign: 'center',
  },
  heroSub: {
    fontFamily: fonts.body,
    fontSize: fontSizes.base,
    color: calm.mutedOnDark,
    textAlign: 'center',
    marginTop: spacing.xs,
  },

  formSection: { paddingHorizontal: spacing.xl, marginTop: spacing.lg },
  form: { gap: spacing.md, marginBottom: spacing.md },
  fieldGroup: { gap: spacing.sm },
  fieldLabel: { fontFamily: fonts.bodyMedium, fontSize: fontSizes.sm, color: calm.muted },
  institutionInput: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1.5, borderColor: calm.border, borderRadius: radii.lg,
    paddingVertical: 19, paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
  },
  institutionText: { fontFamily: fonts.body, fontSize: fontSizes.md - 1, color: calm.ink, flex: 1 },
  institutionPlaceholder: { color: calm.faint },

  strengthBlock: { marginBottom: spacing.lg },
  strengthRow: { flexDirection: 'row', gap: spacing.sm, height: 6, marginBottom: spacing.sm },
  strengthBar: { flex: 1, borderRadius: 3, backgroundColor: calm.track },
  strengthBarFilled: { backgroundColor: calm.primary },
  strengthLabel: { fontFamily: fonts.bodyMedium, fontSize: fontSizes.xs + 1, color: calm.primary },

  ctaWrap: { marginBottom: spacing.lg },
  ctaDisabled: { opacity: 0.45 },
  cta: {
    borderRadius: radii.pill,
    paddingVertical: 19,
    alignItems: 'center',
  },
  ctaText: { fontFamily: fonts.bodyBold, fontSize: fontSizes.md, color: '#FFFFFF' },

  legal: {
    fontFamily: fonts.body,
    fontSize: fontSizes.xs + 1,
    color: calm.muted,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: spacing.xl,
  },
  legalLink: { fontFamily: fonts.bodyBold, color: calm.primary },
  loginLink: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.base - 1,
    color: calm.forest,
    textAlign: 'center',
  },
  loginBold: { color: calm.primary },
  guestLink: { marginTop: spacing.lg, alignItems: 'center' },
  guestText: { fontFamily: fonts.bodyMedium, fontSize: fontSizes.sm, color: calm.muted },
});
