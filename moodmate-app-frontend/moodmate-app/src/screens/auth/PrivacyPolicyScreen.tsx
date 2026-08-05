import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { ScreenHeader } from '@/components/ScreenHeader';
import { calm, colors, fonts, fontSizes, radii, spacing, shadow } from '@/theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'PrivacyPolicy'>;

const SUPPORT_EMAIL = 'orleansbarnes9@gmail.com';

const POLICY_SECTIONS = [
  {
    title: 'Information we collect',
    body:
      'We may collect your account details, institution, profile information, wellness check-ins, journal entries, support requests, appointments, messages, reviews, device details, and permissions you choose to allow.',
  },
  {
    title: 'How we use your information',
    body:
      'We use your information to create and manage your account, personalize MoodMate, save your wellness progress, connect you with counsellors and peer mentors, manage appointments, send helpful notifications, improve reliability, and protect users from abuse or unsafe activity.',
  },
  {
    title: 'Sensitive wellness data',
    body:
      'Your journal entries, mood records, chats, and support activity may include sensitive personal information. MoodMate limits access by role. Students can access their own information. Counsellors and peer mentors only access information needed to provide support. Admins may access limited information for approvals, moderation, safety, and platform management.',
  },
  {
    title: 'AI features',
    body:
      'MoodMate may use AI to provide wellness insights, journaling support, or helpful suggestions. AI responses are not medical advice, diagnosis, or emergency care. If you are in danger or need urgent help, contact emergency services or a trusted person immediately.',
  },
  {
    title: 'Biometric login',
    body:
      'If you enable fingerprint login, MoodMate does not receive or store your actual fingerprint. Your device handles biometric verification. MoodMate only stores a secure login token linked to your account on that device.',
  },
  {
    title: 'Camera, microphone, audio, and media',
    body:
      'MoodMate only asks for camera or microphone permission when you use features like voice journaling, audio, video calls, or image uploads. You can deny or disable these permissions in your device settings.',
  },
  {
    title: 'Sharing your information',
    body:
      'We do not sell your personal information. We may share information only when needed to provide MoodMate services, work with secure service providers, support safety workflows, comply with law, or protect users and the platform.',
  },
  {
    title: 'Data security and retention',
    body:
      'We use reasonable safeguards including secure authentication, restricted access, encrypted connections where supported, and role-based access controls. We keep information only as long as needed to provide the app, maintain records, meet safety or legal obligations, resolve disputes, or improve the service.',
  },
  {
    title: 'Your choices',
    body:
      'You can update your profile, choose what wellness information you enter, disable notifications or permissions, sign out, and request support for account or data concerns.',
  },
];

export function PrivacyPolicyScreen({ navigation }: Props) {
  return (
    <View style={s.root}>
      <View style={s.headerWrap}>
        <ScreenHeader title="Privacy Policy" onClose={() => navigation.goBack()} compact />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.content}>
        <View style={s.hero}>
          <View style={s.iconWrap}>
            <Ionicons name="shield-checkmark-outline" size={28} color={calm.primary} />
          </View>
          <Text style={s.title}>MoodMate Privacy Policy</Text>
          <Text style={s.updated}>Last updated: August 5, 2026</Text>
          <Text style={s.intro}>
            MoodMate is a student wellness and support app designed to help students access
            journaling tools, AI wellness insights, counsellors, peer mentors, appointments,
            and supportive resources.
          </Text>
        </View>

        {POLICY_SECTIONS.map((section) => (
          <View key={section.title} style={s.section}>
            <Text style={s.sectionTitle}>{section.title}</Text>
            <Text style={s.body}>{section.body}</Text>
          </View>
        ))}

        <View style={s.note}>
          <Ionicons name="heart-outline" size={18} color={calm.primary} />
          <Text style={s.noteText}>
            MoodMate is intended for students and approved users of supported institutions. If the
            app is used by minors, additional school, parent, guardian, or institutional
            requirements may apply.
          </Text>
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>Changes to this policy</Text>
          <Text style={s.body}>
            We may update this Privacy Policy as MoodMate grows. If we make important changes, we
            will notify users in the app or by another reasonable method.
          </Text>
        </View>

        <View style={s.contactCard}>
          <Text style={s.contactTitle}>Contact</Text>
          <Text style={s.body}>For privacy questions or data requests, contact MoodMate Support.</Text>
          <Text style={s.email}>{SUPPORT_EMAIL}</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: calm.bg },
  headerWrap: { paddingHorizontal: spacing.lg },
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.giant,
    gap: spacing.md,
  },
  hero: {
    backgroundColor: '#FFFFFF',
    borderRadius: radii.lg,
    padding: spacing.xl,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: calm.border,
    ...shadow.sm,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: calm.mintBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  title: {
    fontFamily: fonts.displayExtraBold,
    fontSize: fontSizes.xxl,
    color: calm.forest,
  },
  updated: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.xs + 1,
    color: calm.muted,
  },
  intro: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: calm.ink,
    lineHeight: 22,
    marginTop: spacing.xs,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: radii.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: calm.border,
  },
  sectionTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.md,
    color: calm.forest,
    marginBottom: spacing.sm,
  },
  body: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: calm.muted,
    lineHeight: 22,
  },
  note: {
    flexDirection: 'row',
    gap: spacing.sm,
    backgroundColor: calm.mintBg,
    borderRadius: radii.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(87,158,101,0.18)',
  },
  noteText: {
    flex: 1,
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.sm,
    color: colors.ink,
    lineHeight: 21,
  },
  contactCard: {
    backgroundColor: calm.forest,
    borderRadius: radii.lg,
    padding: spacing.xl,
    gap: spacing.sm,
  },
  contactTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.md,
    color: '#FFFFFF',
  },
  email: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.base,
    color: calm.mint,
  },
});
