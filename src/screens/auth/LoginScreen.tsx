import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, Pressable, StyleSheet, Animated, Easing,
  TextInput, ScrollView, Dimensions, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList, UserRole } from '@/navigation/types';
import { useToast } from '@/state/useToast';
import { useAuthStore } from '@/state/useAuthStore';
import { login } from '@/api/auth';
import { ApiRequestError } from '@/api/client';
import { colors, fonts, fontSizes, spacing, radii, shadow, glass, glow, gradients } from '@/theme/tokens';
import { GlassView } from '@/components/GlassView';
import { LiquidBackground } from '@/components/LiquidBackground';

const { width: SW, height: SH } = Dimensions.get('window');

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

// ── Role theming ─────────────────────────────────────────────────────────────
const ROLE_THEME = {
  STUDENT: {
    bg: colors.bg,
    heading: 'Welcome back 👋',
    sub: 'Your mental wellness journey continues',
    divEmoji: '💚',
    btnColor: colors.coral,
    shadowColor: '#8B5CF6',
    orbs: [
      { color: '#FF8A7A', size: 180, left: -60,    top: -40 },
      { color: '#C4B5FD', size: 140, left: SW - 80, top: 60 },
      { color: '#86EFAC', size: 120, left: 20,      top: SH * 0.45 },
      { color: '#FDE68A', size: 100, left: SW - 60, top: SH * 0.7 },
      { color: '#93C5FD', size: 80,  left: SW * 0.4, top: SH * 0.15 },
    ],
  },
  COUNSELLOR: {
    bg: '#F0F7FF',
    heading: 'Counsellor Portal 💙',
    sub: 'Support your students with care',
    divEmoji: '💙',
    btnColor: '#1B6CA8',
    shadowColor: '#1B4F72',
    orbs: [
      { color: '#5DBCFF', size: 200, left: -70,    top: -50 },
      { color: '#2980B9', size: 140, left: SW - 70, top: 80 },
      { color: '#A8D8F0', size: 120, left: 10,      top: SH * 0.45 },
      { color: '#C4E8FF', size: 100, left: SW - 50, top: SH * 0.65 },
      { color: '#74B9E8', size: 80,  left: SW * 0.3, top: SH * 0.2 },
    ],
  },
  ADMIN: {
    bg: '#F5F3FF',
    heading: 'Admin Access 🔑',
    sub: 'Platform management & oversight',
    divEmoji: '🔑',
    btnColor: '#4A1C96',
    shadowColor: '#2D1B69',
    orbs: [
      { color: '#C4A5FF', size: 200, left: -70,     top: -50 },
      { color: '#7C3AED', size: 140, left: SW - 70,  top: 80 },
      { color: '#DDD6FE', size: 110, left: 10,       top: SH * 0.45 },
      { color: '#8B5CF6', size: 90,  left: SW - 50,  top: SH * 0.65 },
      { color: '#A78BFA', size: 75,  left: SW * 0.3, top: SH * 0.2 },
    ],
  },
} satisfies Record<UserRole, {
  bg: string; heading: string; sub: string; divEmoji: string;
  btnColor: string; shadowColor: string;
  orbs: { color: string; size: number; left: number; top: number }[];
}>;

// ── Floating orb ─────────────────────────────────────────────────────────────
function FloatingOrb({ color, size, left, top }: {
  color: string; size: number; left: number; top: number;
}) {
  const y = useRef(new Animated.Value(0)).current;
  const x = useRef(new Animated.Value(0)).current;
  const dur = 3400 + Math.random() * 1200;
  const delay = Math.random() * 600;

  useEffect(() => {
    const floatY = 22 + Math.random() * 14;
    const floatX = 14 + Math.random() * 10;
    Animated.loop(Animated.sequence([
      Animated.timing(y, { toValue: -floatY, duration: dur, delay, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(y, { toValue:  floatY, duration: dur, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ])).start();
    Animated.loop(Animated.sequence([
      Animated.timing(x, { toValue:  floatX, duration: dur * 1.3, delay, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(x, { toValue: -floatX, duration: dur * 1.3, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ])).start();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Animated.View pointerEvents="none" style={{
      position: 'absolute', left, top,
      width: size, height: size, borderRadius: size / 2,
      backgroundColor: color, opacity: 0.4,
      transform: [{ translateY: y }, { translateX: x }],
    }} />
  );
}

// ── Animated text field ───────────────────────────────────────────────────────
function AnimatedField({ label, value, onChangeText, placeholder, secureTextEntry, rightSlot, focusColor }: {
  label: string; value: string; onChangeText: (t: string) => void;
  placeholder: string; secureTextEntry?: boolean;
  rightSlot?: React.ReactNode; focusColor: string;
}) {
  const border = useRef(new Animated.Value(0)).current;
  const onFocus = () => Animated.timing(border, { toValue: 1, duration: 200, useNativeDriver: false }).start();
  const onBlur  = () => Animated.timing(border, { toValue: 0, duration: 200, useNativeDriver: false }).start();
  const borderColor = border.interpolate({ inputRange: [0,1], outputRange: ['#E0E0E0', focusColor] });
  const borderWidth = border.interpolate({ inputRange: [0,1], outputRange: [1.5, 2] });

  return (
    <View style={s.fieldGroup}>
      <Text style={s.fieldLabel}>{label}</Text>
      <Animated.View style={[s.inputWrap, { borderColor, borderWidth }]}>
        <TextInput
          style={s.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.inkFaint}
          secureTextEntry={secureTextEntry}
          autoCapitalize="none"
          autoCorrect={false}
          onFocus={onFocus}
          onBlur={onBlur}
        />
        {rightSlot}
      </Animated.View>
    </View>
  );
}

// ── Login button ──────────────────────────────────────────────────────────────
function LoginButton({ label, disabled, onPress, btnColor }: {
  label: string; disabled: boolean; onPress: () => void; btnColor: string;
}) {
  const scale   = useRef(new Animated.Value(1)).current;
  const shimmer = useRef(new Animated.Value(-SW)).current;

  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.delay(1600),
      Animated.timing(shimmer, { toValue: SW,  duration: 800, easing: Easing.linear, useNativeDriver: true }),
      Animated.timing(shimmer, { toValue: -SW, duration: 0, useNativeDriver: true }),
    ])).start();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const pressIn  = () => Animated.spring(scale, { toValue: 0.96, speed: 50, bounciness: 0, useNativeDriver: true }).start();
  const pressOut = () => Animated.spring(scale, { toValue: 1,    speed: 30, bounciness: 5, useNativeDriver: true }).start();

  return (
    <Pressable onPressIn={pressIn} onPressOut={pressOut} onPress={onPress} disabled={disabled}>
      <Animated.View style={[s.loginBtn, { backgroundColor: disabled ? colors.inkFaint : btnColor }, { transform: [{ scale }] }]}>
        <Text style={s.loginBtnText}>{label}</Text>
        <Animated.View pointerEvents="none"
          style={[s.shimmer, { transform: [{ translateX: shimmer }] }]} />
      </Animated.View>
    </Pressable>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────
export function LoginScreen({ navigation, route }: Props) {
  const role    = route.params?.role ?? 'STUDENT';
  const theme   = ROLE_THEME[role];
  const insets  = useSafeAreaInsets();

  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const toast      = useToast();
  const setSession = useAuthStore((s) => s.setSession);

  // Entrance animations
  const logoAnim  = useRef(new Animated.Value(0)).current;
  const titleAnim = useRef(new Animated.Value(0)).current;
  const subAnim   = useRef(new Animated.Value(0)).current;
  const cardAnim  = useRef(new Animated.Value(0)).current;
  const footAnim  = useRef(new Animated.Value(0)).current;
  const breathe   = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.stagger(100, [logoAnim, titleAnim, subAnim, cardAnim, footAnim].map(v =>
      Animated.spring(v, { toValue: 1, friction: 7, tension: 50, useNativeDriver: true }),
    )).start();
    Animated.loop(Animated.sequence([
      Animated.timing(breathe, { toValue: 1.08, duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(breathe, { toValue: 1,    duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ])).start();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const slide = (anim: Animated.Value, offset = 28) => ({
    opacity: anim,
    transform: [{ translateY: anim.interpolate({ inputRange: [0,1], outputRange: [offset, 0] }) }],
  });

  const canSubmit = email.trim().length > 0 && password.trim().length > 0 && !loading;

  const handleLogin = async () => {
    if (!canSubmit) return;
    setLoading(true);
    try {
      const { token, user } = await login({ email: email.trim().toLowerCase(), password });

      // Validate role matches selection
      if (role === 'COUNSELLOR' && user.role !== 'COUNSELLOR') {
        toast('No counsellor account found with these credentials.');
        setLoading(false);
        return;
      }
      if (role === 'ADMIN' && user.role !== 'ADMIN') {
        toast('No admin account found with these credentials.');
        setLoading(false);
        return;
      }

      await setSession(token, user);

      if (user.role === 'ADMIN')       navigation.replace('AdminDashboard');
      else navigation.replace('Main');  // MainRouter handles COUNSELLOR vs STUDENT
    } catch (err) {
      toast(err instanceof ApiRequestError ? err.message : 'Could not sign in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const roleEmojis: Record<UserRole, string> = { STUDENT: '🌿', COUNSELLOR: '💙', ADMIN: '🔑' };

  return (
    <KeyboardAvoidingView style={[s.root, { backgroundColor: theme.bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

      <LiquidBackground preset="auth" opacityScale={0.7} />
      {/* Orbs */}
      {theme.orbs.map((orb, i) => (
        <FloatingOrb key={i} {...orb} />
      ))}

      <ScrollView
        contentContainerStyle={[s.scroll, { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing.xl }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Back */}
        <Animated.View style={[s.backRow, { opacity: logoAnim }]}>
          <Pressable style={s.backBtn} onPress={() => { if (navigation.canGoBack()) navigation.goBack(); else navigation.replace('RoleSelect'); }}>
            <Text style={s.backIcon}>‹</Text>
            <Text style={s.backText}>Change role</Text>
          </Pressable>
        </Animated.View>

        {/* Logo */}
        <Animated.View style={[s.logoWrap, slide(logoAnim, 40)]}>
          <Animated.View style={[s.logoCircle, { transform: [{ scale: breathe }] }]}>
            <Text style={s.logoEmoji}>{roleEmojis[role]}</Text>
          </Animated.View>
          <Text style={s.brand}>MoodMate</Text>
          {role !== 'STUDENT' && (
            <View style={[s.rolePill, { backgroundColor: theme.btnColor + '22' }]}>
              <Text style={[s.rolePillText, { color: theme.btnColor }]}>
                {role === 'COUNSELLOR' ? 'Counsellor Portal' : 'Admin Access'}
              </Text>
            </View>
          )}
        </Animated.View>

        {/* Heading */}
        <Animated.Text style={[s.heading, slide(titleAnim, 28)]}>{theme.heading}</Animated.Text>
        <Animated.Text style={[s.subheading, slide(subAnim, 22)]}>{theme.sub}</Animated.Text>

        {/* Divider */}
        <Animated.View style={[s.divRow, slide(subAnim, 18)]}>
          <View style={s.divLine} />
          <Text style={s.divEmoji}>{theme.divEmoji}</Text>
          <View style={s.divLine} />
        </Animated.View>

        {/* Form card */}
        <Animated.View style={[s.cardAnim, slide(cardAnim, 35)]}>
          <GlassView intensity={70} tint='light' overlayColor='rgba(255,255,255,0.52)' borderColor='rgba(255,255,255,0.75)' borderRadius={24} style={s.card}>
          <AnimatedField
            label="Email address"
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            focusColor={theme.btnColor}
          />
          <AnimatedField
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            secureTextEntry={!showPw}
            focusColor={theme.btnColor}
            rightSlot={
              <Pressable style={s.eyeBtn} onPress={() => setShowPw(v => !v)}>
                <Text style={s.eyeIcon}>{showPw ? '🙈' : '👁️'}</Text>
              </Pressable>
            }
          />
          <Pressable style={s.forgotRow} onPress={() => navigation.navigate('ForgotPassword', { email })}>
            <Text style={[s.forgotText, { color: theme.btnColor }]}>Forgot password?</Text>
          </Pressable>
          <LoginButton
            label={loading ? 'Signing in…' : 'Sign In'}
            disabled={!canSubmit}
            onPress={handleLogin}
            btnColor={theme.btnColor}
          />
          </GlassView>
        </Animated.View>

        {/* Footer */}
        <Animated.View style={[s.footerGroup, slide(footAnim, 20)]}>
          {role === 'STUDENT' && (
            <View style={s.footerRow}>
              <Text style={s.footerText}>New to MoodMate? </Text>
              <Pressable onPress={() => navigation.navigate('Signup')}>
                <Text style={[s.footerLink, { color: theme.btnColor }]}>Create account</Text>
              </Pressable>
            </View>
          )}
          {role === 'COUNSELLOR' && (
            <View style={s.footerRow}>
              <Text style={s.footerText}>New counsellor? </Text>
              <Pressable onPress={() => navigation.navigate('CounsellorSignup')}>
                <Text style={[s.footerLink, { color: theme.btnColor }]}>Apply to join</Text>
              </Pressable>
            </View>
          )}
          {role === 'ADMIN' && (
            <View style={s.footerRow}>
              <Text style={s.footerText}>First time here? </Text>
              <Pressable onPress={() => navigation.navigate('AdminSetup')}>
                <Text style={[s.footerLink, { color: theme.btnColor }]}>Set up admin account</Text>
              </Pressable>
            </View>
          )}
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, overflow: 'hidden' },
  scroll: { flexGrow: 1, alignItems: 'center' },

  backRow: { width: '100%', paddingHorizontal: spacing.lg, marginBottom: spacing.xs },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start' },
  backIcon: { fontSize: 22, color: colors.inkSoft, lineHeight: 24 },
  backText: { fontFamily: fonts.bodyMedium, fontSize: fontSizes.sm, color: colors.inkSoft },

  logoWrap: { alignItems: 'center', marginBottom: spacing.sm, gap: spacing.xs },
  logoCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#FFFFFF',
    alignItems: 'center', justifyContent: 'center',
    ...shadow.md,
  },
  logoEmoji: { fontSize: 36 },
  brand: {
    fontFamily: fonts.display,
    fontSize: fontSizes.lg,
    color: colors.ink,
    letterSpacing: 0.5,
  },
  rolePill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: radii.pill,
    marginTop: 2,
  },
  rolePillText: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.xs,
    letterSpacing: 0.3,
  },

  heading: {
    fontFamily: fonts.display,
    fontSize: fontSizes.display,
    color: colors.ink,
    textAlign: 'center',
    marginBottom: 6,
    paddingHorizontal: spacing.xxl,
  },
  subheading: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.sm,
    color: colors.inkSoft,
    textAlign: 'center',
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.xxl,
  },

  divRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.xxl * 2.5,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  divLine: { flex: 1, height: 1.5, borderRadius: 1, backgroundColor: '#E8D5C0' },
  divEmoji: { fontSize: 20 },

  cardAnim: {
    width: SW - spacing.xl * 2,
    marginBottom: spacing.lg,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 6,
  },
  card: {
    padding: spacing.xxl,
  },

  fieldGroup: { marginBottom: spacing.md },
  fieldLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.xs,
    color: colors.inkSoft,
    marginBottom: 7,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  inputWrap: {
    borderRadius: radii.md,
    backgroundColor: '#FAFAFA',
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 14,
    fontFamily: fonts.body,
    fontSize: fontSizes.base,
    color: colors.ink,
  },
  eyeBtn: { width: 44, alignItems: 'center', justifyContent: 'center', alignSelf: 'stretch' },
  eyeIcon: { fontSize: 16 },

  forgotRow: { alignSelf: 'flex-end', marginTop: 2, marginBottom: spacing.xl },
  forgotText: { fontFamily: fonts.bodyBold, fontSize: fontSizes.xs },

  loginBtn: {
    borderRadius: radii.pill,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: 'rgba(255,111,77,0.55)',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 18,
    elevation: 10,
  },
  loginBtnText: { fontFamily: fonts.bodyBold, fontSize: fontSizes.md, color: '#FFFFFF', letterSpacing: 0.5 },
  shimmer: {
    position: 'absolute', top: 0, bottom: 0,
    width: 120, backgroundColor: 'rgba(255,255,255,0.35)',
    borderRadius: 45, transform: [{ skewX: '-20deg' }],
  },

  footerGroup: { alignItems: 'center', gap: spacing.md },
  footerRow: { flexDirection: 'row', alignItems: 'center' },
  footerText: { fontFamily: fonts.bodyMedium, fontSize: fontSizes.sm, color: colors.inkSoft },
  footerLink: { fontFamily: fonts.bodyBold, fontSize: fontSizes.sm },
  footerNote: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.xs,
    color: colors.inkFaint,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
    lineHeight: 18,
  },
});
