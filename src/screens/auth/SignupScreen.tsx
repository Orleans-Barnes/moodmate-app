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
  View, Text, Pressable, StyleSheet, Modal, ScrollView,
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
import { signup, loginAsGuest } from '@/api/auth';
import { ApiRequestError } from '@/api/client';
import { colors, fonts, fontSizes, radii, spacing, shadow, gradients, glow } from '@/theme/tokens';
import { Ionicons } from '@expo/vector-icons';

type Props = NativeStackScreenProps<RootStackParamList, 'Signup'>;

const INSTITUTIONS = [
  'KNUST',
  'University of Ghana',
  'UCC',
  'University of Education, Winneba',
  'Ghana Institute of Management',
  'Ashesi University',
  'Other',
];

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
  const [institution, setInstitution] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen]   = useState(false);
  const [password, setPassword]       = useState('');
  const [confirm, setConfirm]         = useState('');
  const [loading, setLoading]         = useState(false);
  const toast      = useToast();
  const setSession = useAuthStore((s) => s.setSession);
  const insets     = useSafeAreaInsets();
  const btnScale   = useRef(new Animated.Value(1)).current;

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
      const { token, user } = await signup({
        email: email.trim(),
        password,
        fullName: name.trim(),
        institution: institution ?? undefined,
      });
      await setSession(token, user);
      toast('Welcome to MoodMate! 🌱');
      navigation.replace('Onboarding');
    } catch (err) {
      toast(err instanceof ApiRequestError ? err.message : 'Could not create your account.');
    } finally {
      setLoading(false);
    }
  };

  const handleGuest = async () => {
    setLoading(true);
    try {
      const { token, user } = await loginAsGuest();
      await setSession(token, user);
      navigation.replace('Main');
    } catch (err) {
      toast(err instanceof ApiRequestError ? err.message : 'Could not continue as guest.');
    } finally {
      setLoading(false);
    }
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
          <Pressable style={s.picker} onPress={() => setPickerOpen(true)}>
            <Text style={[s.pickerTxt, !institution && s.pickerPlaceholder]}>
              {institution ?? 'Select your institution'}
            </Text>
            <Ionicons name="chevron-forward" size={18} color={colors.inkFaint} />
          </Pressable>
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

      {/* Institution bottom sheet */}
      <Modal
        visible={pickerOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setPickerOpen(false)}
      >
        <Pressable style={s.overlay} onPress={() => setPickerOpen(false)}>
          <View style={[s.sheet, { paddingBottom: insets.bottom + spacing.lg }]}>
            <View style={s.sheetHandle} />
            <Text style={s.sheetTitle}>Select your institution</Text>
            {INSTITUTIONS.map((inst, i) => (
              <Pressable
                key={inst}
                style={[s.sheetRow, i < INSTITUTIONS.length - 1 && s.sheetDivider]}
                onPress={() => { setInstitution(inst); setPickerOpen(false); }}
              >
                <Text style={[s.sheetRowTxt, institution === inst && s.sheetRowActive]}>
                  {inst}
                </Text>
                {institution === inst && <Ionicons name="checkmark" size={18} color={colors.coral} />}
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
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

  // Bottom sheet
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: spacing.lg, paddingTop: spacing.md,
  },
  sheetHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: colors.line, alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  sheetTitle: { fontFamily: fonts.bodyBold, fontSize: fontSizes.md, color: colors.ink, marginBottom: spacing.sm },
  sheetRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 15,
  },
  sheetDivider: { borderBottomWidth: 1, borderBottomColor: colors.line },
  sheetRowTxt: { fontFamily: fonts.bodyMedium, fontSize: fontSizes.base, color: colors.ink },
  sheetRowActive: { fontFamily: fonts.bodyBold, color: colors.coral },
  sheetCheck: { fontFamily: fonts.bodyBold, fontSize: fontSizes.base, color: colors.coral },
});
