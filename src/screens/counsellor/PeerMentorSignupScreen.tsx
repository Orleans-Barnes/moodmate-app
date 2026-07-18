/**
 * PeerMentorSignupScreen — Phase 1B polished "not open yet" screen.
 *
 * IMPORTANT: per the user's explicit Phase 1B adjustment, this is NOT a real registration form
 * (Peer Mentor accounts don't exist in the backend yet - see Role.java, only STUDENT/COUNSELLOR/
 * ADMIN). It is intentionally a real, navigable, production-styled screen rather than a generic
 * "Coming Soon" placeholder, so the app never feels unfinished to a student exploring the flow.
 * Real registration functionality is scoped to a later phase (Peer Mentor system build-out).
 */
import React, { useEffect, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, Animated, Easing, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIsFocused } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { DarkGlassView } from '@/components/GlassView';
import { ROLE_ILLUSTRATIONS } from '@/constants/roleAssets';
import { fonts, fontSizes, spacing, radii } from '@/theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'PeerMentorSignup'>;

const STEPS = [
  { icon: 'school-outline' as const, label: 'Complete the university training programme' },
  { icon: 'ribbon-outline' as const, label: 'Get certified through the MoodMate Peer Mentor Academy' },
  { icon: 'checkmark-circle-outline' as const, label: 'Applications open to certified students' },
];

export function PeerMentorSignupScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();
  const fade = useRef(new Animated.Value(0)).current;
  const float = useRef(new Animated.Value(0)).current;
  const floatLoop = useRef<Animated.CompositeAnimation | null>(null);
  const Illustration = ROLE_ILLUSTRATIONS.counsellor;

  useEffect(() => {
    Animated.timing(fade, { toValue: 1, duration: 460, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [fade]);

  // Continuous float loop only runs while this screen is actually focused — stopped (not just
  // left running off-screen) when the user navigates away, so it doesn't drain battery in the
  // background.
  useEffect(() => {
    if (!isFocused) {
      floatLoop.current?.stop();
      return;
    }
    floatLoop.current = Animated.loop(
      Animated.sequence([
        Animated.timing(float, { toValue: 1, duration: 2600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(float, { toValue: 0, duration: 2600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );
    floatLoop.current.start();
    return () => floatLoop.current?.stop();
  }, [isFocused]); // eslint-disable-line react-hooks/exhaustive-deps

  const floatY = float.interpolate({ inputRange: [0, 1], outputRange: [0, -10] });

  return (
    <View style={s.root}>
      <LinearGradient colors={['#0D0D1A', '#12142B', '#1A1030']} style={StyleSheet.absoluteFill} />

      <View style={[s.content, { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing.lg }]}>
        <Pressable
          style={s.backBtn}
          onPress={() => navigation.goBack()}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <Ionicons name="chevron-back" size={22} color="rgba(255,255,255,0.75)" importantForAccessibility="no-hide-descendants" accessibilityElementsHidden />
          <Text style={s.backTxt}>Back</Text>
        </Pressable>

        {/* Scrollable body — keeps the illustration + copy + steps card from ever clipping on
            shorter devices; "Got it" stays pinned below, outside the scroll area. */}
        <ScrollView
          style={s.scroll}
          contentContainerStyle={s.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <Animated.View
            style={[s.illoWrap, { opacity: fade, transform: [{ translateY: floatY }] }]}
            importantForAccessibility="no-hide-descendants"
            accessibilityElementsHidden
          >
            <Illustration size={140} />
          </Animated.View>

          <Animated.View style={{ opacity: fade }}>
            <Text style={s.heading}>Peer Mentor Registration</Text>
            <Text style={s.body}>
              Peer Mentor applications will open after completing the university training and
              certification programme. Please check back soon or contact your institution.
            </Text>
          </Animated.View>

          <View
            accessible
            accessibilityRole="summary"
            accessibilityLabel={`Steps to become a Peer Mentor: ${STEPS.map((step) => step.label).join('. ')}`}
          >
            <DarkGlassView intensity={40} borderColor="rgba(255,255,255,0.12)" borderRadius={18} style={s.stepsCard}>
              <View style={s.stepsInner}>
                {STEPS.map((step, i) => (
                  <View key={step.label} style={[s.stepRow, i === STEPS.length - 1 && { marginBottom: 0 }]}>
                    <View style={s.stepIconCircle}>
                      <Ionicons name={step.icon} size={18} color="#8E7BC0" />
                    </View>
                    <Text style={s.stepLabel}>{step.label}</Text>
                  </View>
                ))}
              </View>
            </DarkGlassView>
          </View>
        </ScrollView>

        <Pressable style={s.primaryBtn} onPress={() => navigation.goBack()} accessibilityRole="button" accessibilityLabel="Got it">
          <Text style={s.primaryBtnTxt}>Got it</Text>
        </Pressable>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  content: { flex: 1, paddingHorizontal: spacing.lg },
  scroll: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 2, marginBottom: spacing.lg, alignSelf: 'flex-start' },
  backTxt: { fontFamily: fonts.bodyMedium, fontSize: fontSizes.sm, color: 'rgba(255,255,255,0.75)' },
  illoWrap: { alignItems: 'center', marginBottom: spacing.lg },
  heading: { fontFamily: fonts.display, fontSize: fontSizes.display, color: '#FFFFFF', textAlign: 'center', marginBottom: spacing.sm },
  body: {
    fontFamily: fonts.bodyMedium, fontSize: fontSizes.sm, color: 'rgba(255,255,255,0.6)',
    textAlign: 'center', lineHeight: 21, marginBottom: spacing.xl, paddingHorizontal: spacing.sm,
  },
  stepsCard: { width: '100%' },
  stepsInner: { padding: spacing.lg },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.md },
  stepIconCircle: {
    width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(142,123,192,0.16)',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  stepLabel: { flex: 1, fontFamily: fonts.bodyMedium, fontSize: fontSizes.xs, color: 'rgba(255,255,255,0.75)', lineHeight: 18 },
  primaryBtn: {
    backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)',
    borderRadius: radii.pill, paddingVertical: spacing.md, alignItems: 'center', marginTop: spacing.lg,
  },
  primaryBtnTxt: { fontFamily: fonts.bodyBold, fontSize: fontSizes.base, color: '#FFFFFF' },
});
