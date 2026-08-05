/**
 * PrivacyDataScreen
 *
 * Shows what data MoodMate collects, how it's used, and gives the user
 * controls over their data — including a request to permanently delete
 * their account.
 */
import React, { useState } from 'react';
import {
  View, Text, ScrollView, Pressable, StyleSheet, Alert, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { useAuthStore } from '@/state/useAuthStore';
import { ScreenHeader } from '@/components/ScreenHeader';
import { BACKEND_BASE_URL } from '@/config';
import { colors, fonts, fontSizes, radii, spacing, shadow } from '@/theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'PrivacyData'>;

// ── Data policy sections ───────────────────────────────────────────────────
const POLICY_SECTIONS = [
  {
    icon: 'person-circle-outline' as const,
    title: 'Account information',
    body: 'Your name, email address, and institution are stored to identify you and personalise your experience. We never sell your personal information.',
  },
  {
    icon: 'heart-outline' as const,
    title: 'Wellness & mood data',
    body: 'Mood check-ins, journal entries, habit logs, sleep logs, and goal completions are stored securely and used only to generate your personal insights. No one else can see your entries.',
  },
  {
    icon: 'chatbubble-ellipses-outline' as const,
    title: 'AI conversations',
    body: 'Messages you send to the AI companion are processed via Groq\'s API to generate responses. Conversation history is stored on our servers so your sessions are continuous. You can clear your AI history at any time from the AI Chat screen.',
  },
  {
    icon: 'people-outline' as const,
    title: 'Community posts',
    body: 'Posts and replies you submit to the Community feed are visible to other registered users. You can delete your own posts at any time.',
  },
  {
    icon: 'shield-checkmark-outline' as const,
    title: 'Counsellor interactions',
    body: 'If you engage with a counsellor, your messages are visible to that counsellor and platform administrators for safeguarding purposes.',
  },
  {
    icon: 'analytics-outline' as const,
    title: 'Usage analytics',
    body: 'We collect anonymous usage data (screen views, feature usage) to improve the app. This data cannot be linked back to you personally.',
  },
];

interface SectionCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  body: string;
}

function SectionCard({ icon, title, body }: SectionCardProps) {
  const [open, setOpen] = useState(false);
  return (
    <Pressable style={s.card} onPress={() => setOpen((v) => !v)}>
      <View style={s.cardHeader}>
        <View style={s.iconWrap}>
          <Ionicons name={icon} size={20} color={colors.coral} />
        </View>
        <Text style={s.cardTitle}>{title}</Text>
        <Ionicons
          name={open ? 'chevron-up' : 'chevron-down'}
          size={16}
          color={colors.inkFaint}
        />
      </View>
      {open && <Text style={s.cardBody}>{body}</Text>}
    </Pressable>
  );
}

export function PrivacyDataScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const token  = useAuthStore((s) => s.token) ?? '';
  const logout = useAuthStore((s) => s.logout);
  const [deleting, setDeleting] = useState(false);

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete account',
      'This will permanently delete your account, all your wellness data, journal entries, and habit logs. This cannot be undone.\n\nAre you absolutely sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete my account',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Final confirmation',
              'Type "DELETE" to confirm. Your data will be erased within 24 hours.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Confirm delete',
                  style: 'destructive',
                  onPress: async () => {
                    setDeleting(true);
                    try {
                      const res = await fetch(
                        `${BACKEND_BASE_URL}/api/users/me`,
                        { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } },
                      );
                      if (!res.ok && res.status !== 204) {
                        throw new Error('Server error - please contact orleansbarnes9@gmail.com');
                      }
                      await logout();
                      Alert.alert(
                        'Account deleted',
                        'Your account and all data have been queued for deletion. You\'ve been signed out.',
                        [{ text: 'OK', onPress: () => navigation.reset({ index: 0, routes: [{ name: 'RoleSelect' }] }) }],
                      );
                    } catch (err: unknown) {
                      Alert.alert('Could not delete account', String(err));
                    } finally {
                      setDeleting(false);
                    }
                  },
                },
              ],
            );
          },
        },
      ],
    );
  };

  return (
    <View style={s.root}>
      <View style={s.headerWrap}>
        <ScreenHeader title="Privacy & Data" onClose={() => navigation.goBack()} compact />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 40 }]}
      >
        {/* Hero */}
        <View style={s.heroCard}>
          <Ionicons name="shield-checkmark" size={36} color={colors.coral} />
          <Text style={s.heroTitle}>Your data is yours</Text>
          <Text style={s.heroBody}>
            MoodMate is built for your wellbeing. We collect only what we need,
            store it securely, and never share it with advertisers.
          </Text>
        </View>

        {/* Policy accordion */}
        <Text style={s.sectionLabel}>What we collect</Text>
        {POLICY_SECTIONS.map((sec) => (
          <SectionCard key={sec.title} {...sec} />
        ))}

        {/* Data rights */}
        <Text style={s.sectionLabel}>Your rights</Text>
        <View style={s.rightsCard}>
          {[
            { icon: 'download-outline' as const, text: 'Request a copy of your data - email orleansbarnes9@gmail.com' },
            { icon: 'pencil-outline' as const, text: 'Correct inaccurate information via Edit Profile' },
            { icon: 'eye-off-outline' as const, text: 'Opt out of analytics in your device\'s app settings' },
            { icon: 'trash-outline' as const, text: 'Request account deletion (below)' },
          ].map(({ icon, text }) => (
            <View key={text} style={s.rightRow}>
              <Ionicons name={icon} size={16} color={colors.coral} style={{ marginTop: 2 }} />
              <Text style={s.rightText}>{text}</Text>
            </View>
          ))}
        </View>

        {/* Retention */}
        <View style={s.retentionCard}>
          <Ionicons name="time-outline" size={16} color={colors.inkFaint} />
          <Text style={s.retentionText}>
            Data is retained while your account is active. Deleted accounts are
            purged within 30 days. Anonymised analytics are retained indefinitely.
          </Text>
        </View>

        {/* Danger zone */}
        <Text style={[s.sectionLabel, { color: colors.error }]}>Danger zone</Text>
        <View style={s.dangerCard}>
          <View style={s.dangerInfo}>
            <Text style={s.dangerTitle}>Delete my account</Text>
            <Text style={s.dangerBody}>
              Permanently removes your account, all wellness data, journal entries,
              mood history, and habit logs. This cannot be undone.
            </Text>
          </View>
          <Pressable
            style={[s.deleteBtn, deleting && s.deleteBtnDisabled]}
            onPress={handleDeleteAccount}
            disabled={deleting}
          >
            {deleting
              ? <ActivityIndicator size="small" color="#fff" />
              : <Text style={s.deleteBtnText}>Delete account</Text>}
          </Pressable>
        </View>

        <Text style={s.footer}>
          Questions? Contact us at{' '}
          <Text style={s.footerLink}>orleansbarnes9@gmail.com</Text>
        </Text>
      </ScrollView>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  headerWrap: { paddingHorizontal: spacing.lg },

  content: { padding: spacing.xl, gap: spacing.md },

  heroCard: {
    backgroundColor: colors.coralSoft, borderRadius: radii.xl,
    padding: spacing.xl, alignItems: 'center', gap: spacing.sm,
    borderWidth: 1, borderColor: 'rgba(87,158,101,0.2)',
  },
  heroTitle: { fontFamily: fonts.displaySemibold, fontSize: fontSizes.xl, color: colors.ink },
  heroBody: { fontFamily: fonts.body, fontSize: fontSizes.sm, color: colors.inkSoft, textAlign: 'center', lineHeight: 22 },

  sectionLabel: {
    fontFamily: fonts.displaySemibold, fontSize: fontSizes.md,
    color: colors.inkSoft, marginTop: spacing.sm,
  },

  card: {
    backgroundColor: colors.surface, borderRadius: radii.md, padding: spacing.lg, ...shadow.sm,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  iconWrap: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: colors.coralSoft, alignItems: 'center', justifyContent: 'center',
  },
  cardTitle: { fontFamily: fonts.bodyBold, fontSize: fontSizes.md, color: colors.ink, flex: 1 },
  cardBody: {
    fontFamily: fonts.body, fontSize: fontSizes.sm, color: colors.inkSoft,
    lineHeight: 22, marginTop: spacing.md,
  },

  rightsCard: {
    backgroundColor: colors.surface, borderRadius: radii.md,
    padding: spacing.lg, gap: spacing.md, ...shadow.sm,
  },
  rightRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  rightText: { fontFamily: fonts.body, fontSize: fontSizes.sm, color: colors.ink, flex: 1, lineHeight: 22 },

  retentionCard: {
    flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start',
    backgroundColor: 'rgba(0,0,0,0.03)', borderRadius: radii.md, padding: spacing.md,
  },
  retentionText: { fontFamily: fonts.body, fontSize: fontSizes.xs, color: colors.inkFaint, flex: 1, lineHeight: 18 },

  dangerCard: {
    backgroundColor: colors.errorSoft, borderRadius: radii.md,
    padding: spacing.lg, gap: spacing.md,
    borderWidth: 1, borderColor: 'rgba(214,69,69,0.2)',
  },
  dangerInfo: { gap: 4 },
  dangerTitle: { fontFamily: fonts.bodyBold, fontSize: fontSizes.md, color: colors.error },
  dangerBody: { fontFamily: fonts.body, fontSize: fontSizes.sm, color: colors.errorDeep, lineHeight: 20 },
  deleteBtn: {
    backgroundColor: colors.error, borderRadius: radii.md,
    paddingVertical: spacing.md, alignItems: 'center',
  },
  deleteBtnDisabled: { opacity: 0.5 },
  deleteBtnText: { fontFamily: fonts.bodyBold, fontSize: fontSizes.md, color: '#fff' },

  footer: { fontFamily: fonts.body, fontSize: fontSizes.xs, color: colors.inkFaint, textAlign: 'center', lineHeight: 18 },
  footerLink: { color: colors.coral, fontFamily: fonts.bodyMedium },
});
