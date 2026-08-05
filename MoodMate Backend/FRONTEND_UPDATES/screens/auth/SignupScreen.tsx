import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, Animated, KeyboardAvoidingView, Platform, StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { fonts, fontSizes, spacing } from '@/theme/tokens';
import { useAuthStore } from '@/state/useAuthStore';
import { useToast } from '@/state/useToast';

// ─── Design system ─────────────────────────────────────────────────────────
const BG     = '#F0EBFF';
const PURPLE = '#7C3AED';
const PL     = '#EDE9FE';
const PM     = '#C4B5FD';
const DARK   = '#1A0D40';
const MUTED  = '#8B6FC8';
const WHITE  = '#FFFFFF';
const GRAD_H = ['#1A0A3C', '#3B1275', '#7C3AED'] as const;
const CARD_SH = { shadowColor: PURPLE, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.10, shadowRadius: 12, elevation: 4 };

const INSTITUTIONS = ['University of Lagos', 'Covenant University', 'UI Ibadan', 'LASU', 'OAU', 'Other'];

export function SignupScreen() {
  const nav    = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const route  = useRoute<any>();
  const role   = route.params?.role ?? 'STUDENT';
  const toast  = useToast();

  const { signup, loginAsGuest, setSession } = useAuthStore();

  const [step, setStep]   = useState(0);
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw]   = useState(false);
  const [showInst, setShowInst] = useState(false);

  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', password: '',
    institution: '', studentId: '',
  });

  const stepAnim = useRef(new Animated.Value(0)).current;

  const next = () => {
    Animated.spring(stepAnim, { toValue: 1, friction: 7, tension: 120, useNativeDriver: true }).start();
    setStep(1);
  };

  const handleSubmit = async () => {
    if (!form.firstName || !form.email || !form.password) {
      toast('Please fill in all required fields'); return;
    }
    setLoading(true);
    try {
      const data = await signup({
        firstName: form.firstName, lastName: form.lastName,
        email: form.email, password: form.password,
        role, institution: form.institution, studentId: form.studentId,
      });
      setSession(data.token, data.user);
      nav.replace('Main');
    } catch (e: any) {
      toast(e?.message ?? 'Sign up failed');
    } finally { setLoading(false); }
  };

  const handleGuest = async () => {
    try {
      const data = await loginAsGuest();
      setSession(data.token, data.user);
      nav.replace('Main');
    } catch { toast('Guest login failed'); }
  };

  const F = (label: string, key: keyof typeof form, opts: any = {}) => (
    <View style={s.fieldWrap}>
      <Text style={s.label}>{label}</Text>
      <View style={s.inputBox}>
        <Ionicons name={opts.icon ?? 'person-outline'} size={18} color={MUTED} style={{ marginRight: 10 }} />
        <TextInput
          style={s.input}
          placeholder={opts.placeholder ?? label}
          placeholderTextColor={PM}
          value={form[key]}
          onChangeText={v => setForm(f => ({ ...f, [key]: v }))}
          secureTextEntry={opts.secure && !showPw}
          keyboardType={opts.keyboard ?? 'default'}
          autoCapitalize={opts.cap ?? 'sentences'}
        />
        {opts.secure && (
          <TouchableOpacity onPress={() => setShowPw(v => !v)}>
            <Ionicons name={showPw ? 'eye-off-outline' : 'eye-outline'} size={18} color={MUTED} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <LinearGradient colors={GRAD_H} style={[s.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity style={s.backBtn} onPress={() => step > 0 ? setStep(0) : nav.goBack()}>
          <Ionicons name="chevron-back" size={24} color={WHITE} />
        </TouchableOpacity>
        <View>
          <Text style={s.headerTitle}>{step === 0 ? 'Create Account' : 'Your Details'}</Text>
          <Text style={s.headerSub}>{step === 0 ? 'Join MoodMate today' : 'Almost there!'}</Text>
        </View>
        {/* Step indicator */}
        <View style={s.stepRow}>
          {[0, 1].map(i => (
            <View key={i} style={[s.stepDot, i === step && s.stepDotOn, i < step && s.stepDotDone]} />
          ))}
        </View>
        {/* XP teaser */}
        <View style={s.xpRow}>
          <Ionicons name="trophy-outline" size={14} color="#FCD34D" />
          <Text style={s.xpTxt}>Earn 100 XP just for signing up</Text>
        </View>
      </LinearGradient>

      <ScrollView style={{ backgroundColor: BG }} contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 40 }]}>
        {step === 0 ? (
          <View style={[s.card, CARD_SH]}>
            <Text style={s.sectionHdr}>Personal Information</Text>
            {F('First Name', 'firstName', { icon: 'person-outline', placeholder: 'Enter first name', cap: 'words' })}
            {F('Last Name', 'lastName', { icon: 'person-outline', placeholder: 'Enter last name', cap: 'words' })}
            {F('Email', 'email', { icon: 'mail-outline', placeholder: 'Enter email address', keyboard: 'email-address', cap: 'none' })}
            {F('Password', 'password', { icon: 'lock-closed-outline', placeholder: 'Create a password', secure: true, cap: 'none' })}

            <TouchableOpacity style={s.primaryBtn} onPress={next}>
              <LinearGradient colors={['#7C3AED', '#9333EA']} style={s.primaryGrad}>
                <Text style={s.primaryTxt}>Continue</Text>
                <Ionicons name="arrow-forward" size={18} color={WHITE} style={{ marginLeft: 8 }} />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={[s.card, CARD_SH]}>
            <Text style={s.sectionHdr}>Institution Details</Text>

            {/* Institution picker */}
            <View style={s.fieldWrap}>
              <Text style={s.label}>Institution</Text>
              <TouchableOpacity style={s.inputBox} onPress={() => setShowInst(v => !v)}>
                <Ionicons name="school-outline" size={18} color={MUTED} style={{ marginRight: 10 }} />
                <Text style={[s.input, { color: form.institution ? DARK : PM }]}>
                  {form.institution || 'Select your institution'}
                </Text>
                <Ionicons name={showInst ? 'chevron-up' : 'chevron-down'} size={16} color={MUTED} />
              </TouchableOpacity>
              {showInst && (
                <View style={s.dropdown}>
                  {INSTITUTIONS.map(inst => (
                    <TouchableOpacity key={inst} style={s.dropItem} onPress={() => { setForm(f => ({ ...f, institution: inst })); setShowInst(false); }}>
                      <Text style={[s.dropTxt, form.institution === inst && { color: PURPLE, fontFamily: fonts.bodyBold }]}>{inst}</Text>
                      {form.institution === inst && <Ionicons name="checkmark" size={16} color={PURPLE} />}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {F('Student ID (optional)', 'studentId', { icon: 'card-outline', placeholder: 'e.g. STU/2024/001' })}

            <TouchableOpacity style={s.primaryBtn} onPress={handleSubmit} disabled={loading}>
              <LinearGradient colors={['#7C3AED', '#9333EA']} style={s.primaryGrad}>
                <Ionicons name="checkmark-circle-outline" size={18} color={WHITE} style={{ marginRight: 8 }} />
                <Text style={s.primaryTxt}>{loading ? 'Creating account...' : 'Create Account'}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {/* Guest */}
        <TouchableOpacity style={s.guestBtn} onPress={handleGuest}>
          <Ionicons name="person-outline" size={16} color={MUTED} />
          <Text style={s.guestTxt}>Continue as Guest</Text>
        </TouchableOpacity>

        <TouchableOpacity style={s.loginLink} onPress={() => nav.navigate('Login', { role })}>
          <Text style={s.loginTxt}>Already have an account? <Text style={{ color: PURPLE, fontFamily: fonts.bodyBold }}>Log in</Text></Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  header:     { paddingHorizontal: 24, paddingBottom: 24 },
  backBtn:    { marginBottom: 16 },
  headerTitle:{ fontFamily: fonts.display, fontSize: 24, color: WHITE, marginBottom: 4 },
  headerSub:  { fontFamily: fonts.body, fontSize: fontSizes.base, color: 'rgba(255,255,255,0.65)', marginBottom: 16 },
  stepRow:    { flexDirection: 'row', gap: 6, marginBottom: 14 },
  stepDot:    { width: 28, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.25)' },
  stepDotOn:  { backgroundColor: WHITE },
  stepDotDone:{ backgroundColor: 'rgba(255,255,255,0.6)' },
  xpRow:      { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.12)', alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  xpTxt:      { fontFamily: fonts.bodyBold, fontSize: 11, color: '#FCD34D' },

  scroll:     { padding: 20 },
  card:       { backgroundColor: WHITE, borderRadius: 20, padding: 20, marginBottom: 16 },
  sectionHdr: { fontFamily: fonts.displaySemibold, fontSize: fontSizes.lg, color: DARK, marginBottom: 20 },

  fieldWrap: { marginBottom: 14 },
  label:     { fontFamily: fonts.bodyBold, fontSize: fontSizes.sm, color: DARK, marginBottom: 7 },
  inputBox:  { flexDirection: 'row', alignItems: 'center', backgroundColor: BG, borderRadius: 12, borderWidth: 1.5, borderColor: PL, paddingHorizontal: 14, paddingVertical: 13 },
  input:     { flex: 1, fontFamily: fonts.body, fontSize: fontSizes.base, color: DARK },

  dropdown: { backgroundColor: WHITE, borderRadius: 12, borderWidth: 1, borderColor: PL, marginTop: 4, overflow: 'hidden', shadowColor: PURPLE, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 10, elevation: 3 },
  dropItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: PL },
  dropTxt:  { fontFamily: fonts.body, fontSize: fontSizes.base, color: DARK },

  primaryBtn:  { marginTop: 8 },
  primaryGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 52, borderRadius: 14 },
  primaryTxt:  { fontFamily: fonts.bodyBold, fontSize: fontSizes.base, color: WHITE },

  guestBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: WHITE, borderRadius: 14, borderWidth: 1.5, borderColor: PL, borderStyle: 'dashed', height: 48, marginBottom: 16 },
  guestTxt: { fontFamily: fonts.bodyMedium, fontSize: fontSizes.base, color: MUTED },

  loginLink: { alignItems: 'center' },
  loginTxt:  { fontFamily: fonts.body, fontSize: fontSizes.base, color: MUTED },
});
