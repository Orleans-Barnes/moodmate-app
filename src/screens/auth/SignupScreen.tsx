/**
 * SignupScreen — Premium warm onboarding
 *
 * Upgrades:
 *  • Floating orbs in header (coral + sage)
 *  • Step indicator chips (Personal Info / Security)
 *  • Upgraded ghost button (dashed border style)
 *  • Unified background color
 *  • Hardcoded #1A1A2E replaced with colors.ink
 */
import React, { useRef, useState } from 'react';
import {
  View, Text, Pressable, StyleSheet, ScrollView,
  Animated, KeyboardAvoidingView, Platform, Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { LiquidBackground } from '@/components/LiquidBackground';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { TextField } from '@/components/TextField';
import { useToast } from '@/state/useToast';
import { useAuthStore } from '@/state/useAuthStore';
import { signup } from '@/api/auth';
import { ApiRequestError } from '@/api/client';
import { colors, fonts, fontSizes, radii, spacing, shadow, gradients, glow } from '@/theme/tokens';
import { Ionicons } from '@expo/vector-icons';
import { InstitutionPicker } from '@/components/InstitutionPicker';
import { loadInstitutions, type Institution, type InstitutionSource } from '@/data/institutions';

type Props = NativeStackScreenProps<RootStackParamList, 'Signup'>;

// Small floating orb for the header
function HeaderOrb({ color, size, x, y, dur, delay = 0 }: {
  color: string; size: number; x: string | number; y: number; dur: number; delay?: number;
}) {
  const anim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: dur, delay, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: dur, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    ).start();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const ty = anim.interpolate({ inputRange: [0, 1], outputRange: [0, -16] });
  return (
    <Animated.View pointerEvents="none" style={{
      position: 'absolute',
      left: typeof x === 'string' ? undefined : x,
      right: typeof x === 'string' ? 0 : undefined,
      top: y,
      width: size, height: size, borderRadius: size / 2,
      backgroundColor: color, opacity: 0.22,
      transform: [{ translateY: ty }],
    }} />
  );
}

export function SignupScreen({ navigation }: Props) {
  const [name, setName]               = useState('');
  const [email, setEmail]             = useState('');
  const [institution, setInstitution] = useState<Institution | null>(null);
  const [pickerOpen, setPickerOpen]   = useState(false);
  const [password, setPassword]       = useState('');
  const [confirm, setConfirm]         = useState('');
  const [loading, setLoading]         = useState(false);
  const toast      = useToast();
  const setSession = useAuthStore((s) => s.setSession);
  const loginAsGuest = useAuthStore((s) => s.loginAsGuest);
  const insets     = useSafeAreaInsets();
  const btnScale   = useRef(new Animated.Value(1)).current;

  // Institution Management (Milestone) - loads the live backend catalogue once on mount; falls
  // back to a local cache, then the bundled list, if the network is unavailable (see
  // src/data/institutions/index.ts's loadInstitutions doc comment for the full fallback chain).
  // null while the very first attempt is in flight so the offline notice below doesn't flash
  // before we actually know whether it's needed.
  const [institutionsSource, setInstitutionsSource] = useState<InstitutionSource | null>(null);
  const refreshInstitutions = () => { loadInstitutions().then(setInstitutionsSource); };
  React.useEffect(() => { refreshInstitutions(); }, []);

  const mismatch  = password.length > 0 && confirm.length > 0 && password !== confirm;
  const canSubmit =
    name.trim().length > 0 &&
    email.trim().length > 0 &&
    institution !== null &&
    password.length >= 8 &&
    confirm.length > 0 &&
    !mismatch;

  const pressBtn = () => {
    Animated.sequence([
      Animated.timing(btnScale, { toValue: 0.96, duration: 80, useNativeDriver: true }),
      Animated.spring(btnScale, { toValue: 1, useNativeDriver: true, friction: 4 }),
    ]).start();
  };

  const handleSignup = async () => {
    pressBtn();
    setLoading(true);
    try {
      const { token, refreshToken, user } = await signup({
        email: email.trim(),
        password,
        fullName: name.trim(),
        institution: institution?.shortName ?? undefined,
      });
      await setSession(token, refreshToken, user);
      toast('Welcome to MoodMate! 🌱');
      navigation.replace('Onboarding');
    } catch (err) {
      toast(err instanceof ApiRequestError ? err.message : 'Could not create your account.');
    } finally {
      setLoading(false);
    }
  };

  // Uses the same session-only, no-backend guest path as LoginScreen (see useAuthStore.loginAsGuest)
  // rather than the real /api/auth/guest account this used to call — that created a persisted DB
  // user but wasn't recognized by any of the screens that special-case guests for the local-only
  // "feel the value first, gate once" experience (GratitudeJar, JournalEntry, BreathingSession,
  // etc.), so a signup-flow guest got a worse, inconsistent experience than a login-flow guest.
  // One guest implementation now, matching "Explore without an account" everywhere.
  const handleGuest = () => {
    loginAsGuest();
    navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
  };

  return (
    <KeyboardAvoidingView
      style={s.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* ── Header with orbs ── */}
      <LinearGradient
        colors={gradients.signup}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={[s.header, { paddingTop: insets.top + spacing.lg }]}
      >
        {/* Floating header orbs */}
        <HeaderOrb color={colors.coral}  size={80}  x={-20}   y={20}  dur={3800} />
        <HeaderOrb color={colors.sage}   size={60}  x="right" y={40}  dur={4200} delay={500} />

        <Pressable onPress={() => navigation.goBack()} style={s.backBtn} hitSlop={12}>
          <Ionicons name="arrow-back" size={18} color="rgba(255,255,255,0.9)" />
        </Pressable>

        <LinearGradient
          colors={['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.12)']}
          style={s.logoRing}
        >
          <Ionicons name="leaf" size={34} color="#FFFFFF" />
        </LinearGradient>
        <Text style={s.headline}>Create account</Text>
        <Text style={s.subline}>Your wellness journey starts here</Text>

        {/* Step indicator */}
        <View style={s.stepRow}>
          <View style={[s.stepChip, s.stepChipActive]}>
            <Text style={[s.stepTxt, s.stepTxtActive]}>1  Personal info</Text>
          </View>
          <View style={s.stepDash} />
          <View style={s.stepChip}>
            <Text style={s.stepTxt}>2  Security</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={[s.form, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Personal info card */}
        <BlurView intensity={65} tint="light" style={s.card}>
          <Text style={s.cardLabel}>Personal info</Text>
          <TextField
            label="Full name"
            placeholder="e.g. Ama Boateng"
            value={name}
            onChangeText={setName}
          />
          <TextField
            label="Email or Student ID"
            placeholder="ama@knust.edu.gh"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />

          {/* Institution picker */}
          <Text style={s.fieldLabel}>Institution</Text>
          <Pressable
            style={s.picker}
            onPress={() => setPickerOpen(true)}
            accessibilityRole="button"
            accessibilityLabel={institution ? `Institution: ${institution.name}` : 'Select your institution'}
          >
            <Text style={[s.pickerTxt, !institution && s.pickerPlaceholder]} numberOfLines={1}>
              {institution ? institution.name : 'Select your institution'}
            </Text>
            <Ionicons name="chevron-forward" size={18} color={colors.inkFaint} />
          </Pressable>
          {institutionsSource && institutionsSource !== 'live' && (
            <Pressable style={s.offlineRow} onPress={refreshInstitutions} accessibilityRole="button">
              <Ionicons name="cloud-offline-outline" size={13} color={colors.inkFaint} />
              <Text style={s.offlineTxt}>
                {institutionsSource === 'cached' ? 'Showing saved institution list · ' : 'Showing offline institution list · '}
                <Text style={s.offlineRetry}>Retry</Text>
              </Text>
            </Pressable>
          )}
        </BlurView>

        {/* Security card */}
        <BlurView intensity={65} tint="light" style={s.card}>
          <Text style={s.cardLabel}>Security</Text>
          <TextField
            label="Password"
            placeholder="At least 6 characters"
            isPassword
            value={password}
            onChangeText={setPassword}
          />
          <TextField
            label="Confirm password"
            placeholder="Repeat password"
            isPassword
            value={confirm}
            onChangeText={setConfirm}
          />
          {mismatch && (
            <View style={s.errorRow}>
              <View style={{flexDirection:"row",alignItems:"center",gap:6}}><Ionicons name="warning-outline" size={14} color={colors.coralDeep}/><Text style={s.errorTxt}>Passwords don't match</Text></View>
            </View>
          )}
        </BlurView>

        {/* Submit */}
        <Animated.View style={{ transform: [{ scale: btnScale }] }}>
          <Pressable onPress={handleSignup} disabled={!canSubmit || loading}>
            <LinearGradient
              colors={canSubmit ? ['#FF6F4D', '#FF5C35'] : ['#CCCCCC', '#AAAAAA']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[s.submitBtn, canSubmit && s.submitBtnActive]}
            >
              <Text style={s.submitTxt}>
                {loading ? 'Creating account…' : 'Create my account'}
              </Text>
            </LinearGradient>
          </Pressable>
        </Animated.View>

        {/* Divider */}
        <View style={s.dividerRow}>
          <View style={s.dividerLine} />
          <Text style={s.dividerTxt}>or</Text>
          <View style={s.dividerLine} />
        </View>

        {/* Guest mode — dashed border */}
        <Pressable style={s.guestBtn} onPress={handleGuest} disabled={loading}>
          <Text style={s.guestTxt}>Continue as guest</Text>
        </Pressable>

        {/* Login link */}
        <View style={s.loginRow}>
          <Text style={s.loginTxt}>Already have an account? </Text>
          <Pressable onPress={() => navigation.navigate('RoleSelect')}>
            <Text style={s.loginLink}>Log in</Text>
          </Pressable>
        </View>
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
  root: { flex: 1, backgroundColor: colors.bg },

  header: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl + 8,
    overflow: 'hidden',
  },
  backBtn: { alignSelf: 'flex-start', marginBottom: spacing.md, zIndex: 2 },
  backTxt: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.sm,
    color: 'rgba(255,255,255,0.9)',
  },
  logoRing: {
    width: 76, height: 76, borderRadius: 38,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.md,
    shadowColor: glow.coral,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
  },
  logoEmoji: { fontSize: 34 },
  headline: {
    fontFamily: fonts.display,
    fontSize: fontSizes.xxl + 2,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  subline: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.sm,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: spacing.lg,
  },

  // Step indicator
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: 4 },
  stepChip: {
    paddingHorizontal: 12, paddingVertical: 5,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  stepChipActive: {
    backgroundColor: 'rgba(255,255,255,0.32)',
    borderColor: 'rgba(255,255,255,0.5)',
  },
  stepTxt: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.xs,
    color: 'rgba(255,255,255,0.65)',
  },
  stepTxtActive: { color: '#FFFFFF', fontFamily: fonts.bodyBold },
  stepDash: { width: 16, height: 1.5, backgroundColor: 'rgba(255,255,255,0.3)' },

  // Form
  scroll: { flex: 1 },
  form: { padding: spacing.lg, gap: spacing.md },

  card: {
    backgroundColor: 'rgba(255,255,255,0.55)',
    borderRadius: 20,
    padding: spacing.lg,
    gap: spacing.sm,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.75)',
    ...shadow.sm,
  },
  cardLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.xs,
    color: colors.inkFaint,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.xs,
  },
  fieldLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.xs,
    color: colors.inkSoft,
    marginTop: spacing.xs,
    marginBottom: 5,
  },
  picker: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.bg,
    borderWidth: 1.5, borderColor: colors.line,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md, paddingVertical: 13,
  },
  pickerTxt: { fontFamily: fonts.bodyMedium, fontSize: fontSizes.sm, color: colors.ink },
  pickerPlaceholder: { color: colors.inkFaint },
  pickerChev: { fontFamily: fonts.bodyBold, fontSize: 18, color: colors.inkFaint },
  offlineRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 6 },
  offlineTxt: { fontFamily: fonts.bodyMedium, fontSize: 11, color: colors.inkFaint },
  offlineRetry: { fontFamily: fonts.bodyBold, color: colors.coral },

  errorRow: {
    backgroundColor: colors.coralSoft, borderRadius: 10,
    paddingHorizontal: spacing.md, paddingVertical: 8,
  },
  errorTxt: { fontFamily: fonts.bodyBold, fontSize: fontSizes.xs, color: colors.coralDeep },

  submitBtn: {
    borderRadius: radii.pill,
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitBtnActive: {
    shadowColor: glow.coral,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.9,
    shadowRadius: 16,
    elevation: 8,
  },
  submitTxt: {
    fontFamily: fonts.bodyBold, fontSize: fontSizes.base,
    color: '#FFFFFF', letterSpacing: 0.3,
  },

  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.line },
  dividerTxt: { fontFamily: fonts.bodyMedium, fontSize: fontSizes.xs, color: colors.inkFaint },

  // Ghost / dashed style guest button
  guestBtn: {
    borderWidth: 1.5,
    borderColor: colors.inkFaint,
    borderRadius: radii.pill,
    borderStyle: 'dashed',
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  guestTxt: { fontFamily: fonts.bodyBold, fontSize: fontSizes.base, color: colors.inkSoft },

  loginRow: { flexDirection: 'row', justifyContent: 'center', paddingTop: spacing.xs },
  loginTxt: { fontFamily: fonts.bodyMedium, fontSize: fontSizes.sm, color: colors.inkSoft },
  loginLink: { fontFamily: fonts.bodyBold, fontSize: fontSizes.sm, color: colors.coral },
});
