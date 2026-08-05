/**
 * HelpSupportScreen
 *
 * FAQ accordion + contact options.
 * Pure frontend — no API calls needed.
 */
import React, { useState } from 'react';
import {
  View, Text, ScrollView, Pressable, StyleSheet, Linking, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { colors, fonts, fontSizes, radii, spacing, shadow } from '@/theme/tokens';
import Constants from 'expo-constants';

type Props = NativeStackScreenProps<RootStackParamList, 'HelpSupport'>;

// ── FAQ content ────────────────────────────────────────────────────────────
const FAQS = [
  {
    q: 'How does the streak system work?',
    a: 'You earn a streak day when you complete all of today\'s wellness activities (check-in, journal, gratitude, breathing, and grounding). Complete all five before midnight each day to keep your streak alive. Missing a day resets it to zero — unless you have a Streak Shield active.',
  },
  {
    q: 'What is a Streak Shield?',
    a: 'A Streak Shield protects your streak from one missed day. Buy it in the streak calendar on your Home screen for 10 leaves. When you have a shield and miss a day, the shield is consumed instead of your streak resetting.',
  },
  {
    q: 'How do I earn leaves?',
    a: 'Leaves are awarded when you complete wellness goals, check in with your mood, add gratitude entries, and play the wellness game. You can also purchase leaf packs from the Tree Shop (payment coming soon).',
  },
  {
    q: 'Is my journal private?',
    a: 'Yes. Your journal entries, mood logs, and AI conversations are private to you. Counsellors only see messages you send them directly via the chat feature. Admins can see anonymised platform statistics but not your personal entries.',
  },
  {
    q: 'How does the AI companion work?',
    a: 'The AI companion is powered by Groq (a fast inference API running Llama 3). It draws on your recent mood check-ins and journal activity to personalise responses. It is not a substitute for professional mental health support.',
  },
  {
    q: 'How do I talk to a counsellor?',
    a: 'Go to the Support tab and start a conversation. Counsellors on our platform are approved professionals. Response times vary — typically within a few hours during business days.',
  },
  {
    q: 'Can I delete my journal entries?',
    a: 'You can delete individual journal entries by tapping the three-dot menu on any entry in the Journal screen.',
  },
  {
    q: 'How do I reset my password?',
    a: 'On the Login screen, tap "Forgot password?" and enter your email address. You\'ll receive a 6-digit OTP to verify your identity, then you can set a new password.',
  },
  {
    q: 'What is the MoodBird?',
    a: 'MoodBird is your wellness companion on the Home screen. It evolves through stages — Egg → Chick → Robin → Peacock — as you earn XP from completing activities. It\'s a fun visual reminder of your progress.',
  },
  {
    q: 'How do I change my tree skin?',
    a: 'Go to Profile → Tree Shop. Skins you\'ve purchased appear there and can be equipped at any time. New skins are bought with leaves.',
  },
];

const CONTACT_OPTIONS = [
  {
    icon: 'mail-outline' as const,
    label: 'Email support',
    sub: 'support@moodmate.app',
    action: () => Linking.openURL('mailto:support@moodmate.app?subject=MoodMate%20Support'),
  },
  {
    icon: 'logo-instagram' as const,
    label: 'Instagram',
    sub: '@moodmateapp',
    action: () => Linking.openURL('https://instagram.com/moodmateapp').catch(() =>
      Alert.alert('Could not open link', 'Visit instagram.com/moodmateapp in your browser.')),
  },
  {
    icon: 'chatbubble-outline' as const,
    label: 'Send feedback',
    sub: 'Tell us what to improve',
    action: () => Linking.openURL('mailto:feedback@moodmate.app?subject=MoodMate%20Feedback'),
  },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <Pressable style={s.faqCard} onPress={() => setOpen((v) => !v)}>
      <View style={s.faqHeader}>
        <Text style={s.faqQ}>{q}</Text>
        <Ionicons name={open ? 'remove-circle-outline' : 'add-circle-outline'} size={20} color={colors.lavender} />
      </View>
      {open && <Text style={s.faqA}>{a}</Text>}
    </Pressable>
  );
}

export function HelpSupportScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const version = Constants.expoConfig?.version ?? '—';

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={s.header}>
        <Pressable style={s.backBtn} onPress={() => navigation.goBack()} hitSlop={10}>
          <Ionicons name="chevron-back" size={22} color={colors.ink} />
        </Pressable>
        <Text style={s.headerTitle}>Help & Support</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 40 }]}
      >
        {/* Hero */}
        <View style={s.heroCard}>
          <Ionicons name="help-buoy-outline" size={36} color={colors.lavender} />
          <Text style={s.heroTitle}>How can we help?</Text>
          <Text style={s.heroBody}>
            Browse common questions below or get in touch directly.
          </Text>
        </View>

        {/* Contact options */}
        <Text style={s.sectionLabel}>Contact us</Text>
        <View style={s.contactGrid}>
          {CONTACT_OPTIONS.map((opt) => (
            <Pressable key={opt.label} style={s.contactCard} onPress={opt.action}>
              <View style={s.contactIcon}>
                <Ionicons name={opt.icon} size={22} color={colors.lavender} />
              </View>
              <Text style={s.contactLabel}>{opt.label}</Text>
              <Text style={s.contactSub}>{opt.sub}</Text>
            </Pressable>
          ))}
        </View>

        {/* FAQ */}
        <Text style={s.sectionLabel}>Frequently asked questions</Text>
        {FAQS.map((faq) => (
          <FaqItem key={faq.q} {...faq} />
        ))}

        {/* Version info */}
        <View style={s.versionCard}>
          <Ionicons name="information-circle-outline" size={16} color={colors.inkFaint} />
          <Text style={s.versionText}>MoodMate v{version} · Built with care for student wellbeing</Text>
        </View>
      </ScrollView>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: fonts.displaySemibold, fontSize: fontSizes.lg, color: colors.ink },

  content: { padding: spacing.xl, gap: spacing.md },

  heroCard: {
    backgroundColor: 'rgba(167,139,250,0.08)', borderRadius: radii.xl,
    padding: spacing.xl, alignItems: 'center', gap: spacing.sm,
    borderWidth: 1, borderColor: 'rgba(167,139,250,0.2)',
  },
  heroTitle: { fontFamily: fonts.displaySemibold, fontSize: fontSizes.xl, color: colors.ink },
  heroBody: { fontFamily: fonts.body, fontSize: fontSizes.sm, color: colors.inkSoft, textAlign: 'center' },

  sectionLabel: {
    fontFamily: fonts.displaySemibold, fontSize: fontSizes.md,
    color: colors.inkSoft, marginTop: spacing.sm,
  },

  contactGrid: { flexDirection: 'row', gap: spacing.md },
  contactCard: {
    flex: 1, backgroundColor: colors.surface, borderRadius: radii.lg,
    padding: spacing.lg, alignItems: 'center', gap: spacing.sm, ...shadow.sm,
  },
  contactIcon: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(167,139,250,0.12)', alignItems: 'center', justifyContent: 'center',
  },
  contactLabel: { fontFamily: fonts.bodyBold, fontSize: fontSizes.sm, color: colors.ink, textAlign: 'center' },
  contactSub: { fontFamily: fonts.body, fontSize: fontSizes.xs, color: colors.inkFaint, textAlign: 'center' },

  faqCard: {
    backgroundColor: colors.surface, borderRadius: radii.md, padding: spacing.lg, ...shadow.sm,
  },
  faqHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  faqQ: { fontFamily: fonts.bodyBold, fontSize: fontSizes.sm, color: colors.ink, flex: 1, lineHeight: 22 },
  faqA: {
    fontFamily: fonts.body, fontSize: fontSizes.sm, color: colors.inkSoft,
    lineHeight: 22, marginTop: spacing.md,
  },

  versionCard: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.03)', borderRadius: radii.md,
    padding: spacing.md, marginTop: spacing.sm,
  },
  versionText: { fontFamily: fonts.body, fontSize: fontSizes.xs, color: colors.inkFaint, flex: 1 },
});
