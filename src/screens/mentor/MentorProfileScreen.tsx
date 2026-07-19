import React from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MentorTabParamList, RootStackParamList } from '@/navigation/types';
import { useAuthStore } from '@/state/useAuthStore';
import { hapticLight } from '@/utils/haptics';
import { colors, fonts, fontSizes, radii, spacing } from '@/theme/tokens';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MentorTabParamList, 'CounsellorProfile'>,
  NativeStackScreenProps<RootStackParamList>
>;

/** Phase 1G - a small, dedicated profile screen for the MENTOR-role tab set. Kept separate from
 * CounsellorProfileScreen.tsx rather than reused directly: that screen's Props type is pinned to
 * CounsellorTabParamList, and retyping or wrapping it to fit MentorTabParamList risked introducing
 * a type mismatch into a screen that already works, for a component whose `navigation` prop isn't
 * even used in its body (only `logout()` from the store is). Not worth that risk under a deadline
 * for a screen this small - if the two ever need to fully converge, that's a deliberate follow-up,
 * not something to rush here. */
export function MentorProfileScreen({}: Props) {
  const insets = useSafeAreaInsets();
  const user   = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const fullName = user?.fullName ?? 'Mentor';
  const initials = fullName.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
  const email = user?.email ?? '';

  return (
    <View style={s.root}>
      <LinearGradient
        colors={['#2D6A4F', '#40916C', '#74C69D']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[s.header, { paddingTop: insets.top + spacing.md }]}
      >
        <Text style={s.headerTitle}>My Profile</Text>
        <View style={s.avatar}>
          <Text style={s.avatarTxt}>{initials}</Text>
        </View>
        <Text style={s.name}>{fullName}</Text>
        <View style={s.rolePill}>
          <Text style={s.rolePillTxt}>🌱 Peer Mentor</Text>
        </View>
        <Text style={s.email}>{email}</Text>
      </LinearGradient>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 110 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.card}>
          <Text style={s.cardTitle}>About mentoring</Text>
          <Text style={s.bodyText}>
            You're supporting fellow students through the peer mentor request queue on your
            Dashboard tab - accept a request to start a conversation, decline if you can't take it
            on right now.
          </Text>
        </View>

        <Pressable
          style={s.logoutBtn}
          onPress={() => { hapticLight(); logout(); }}
        >
          <Text style={s.logoutTxt}>Sign Out</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F0FAF4' },
  header: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl, alignItems: 'center' },
  headerTitle: { fontFamily: fonts.bodyBold, fontSize: fontSizes.md, color: '#FFFFFF', alignSelf: 'flex-start', marginBottom: spacing.md },
  avatar: {
    width: 72, height: 72, borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)',
  },
  avatarTxt: { fontFamily: fonts.display, fontSize: fontSizes.xl, color: '#FFFFFF' },
  name: { fontFamily: fonts.display, fontSize: fontSizes.lg, color: '#FFFFFF', marginTop: spacing.sm },
  rolePill: {
    backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: radii.pill,
    paddingHorizontal: 12, paddingVertical: 5, marginTop: 6,
  },
  rolePillTxt: { fontFamily: fonts.bodyBold, fontSize: fontSizes.xs, color: '#FFFFFF' },
  email: { fontFamily: fonts.bodyMedium, fontSize: fontSizes.xs, color: 'rgba(255,255,255,0.7)', marginTop: 6 },
  scroll: { flex: 1 },
  content: { padding: spacing.lg, gap: spacing.md },
  card: {
    backgroundColor: '#FFFFFF', borderRadius: radii.lg,
    padding: spacing.lg, borderWidth: 1.5, borderColor: colors.line,
  },
  cardTitle: { fontFamily: fonts.bodyBold, fontSize: fontSizes.base, color: colors.ink, marginBottom: spacing.sm },
  bodyText: { fontFamily: fonts.bodyMedium, fontSize: fontSizes.sm, color: colors.inkSoft, lineHeight: 20 },
  logoutBtn: {
    alignItems: 'center', paddingVertical: 14,
    borderRadius: radii.md, borderWidth: 1.5, borderColor: '#F5B7B1',
    marginTop: spacing.sm,
  },
  logoutTxt: { fontFamily: fonts.bodyBold, fontSize: fontSizes.base, color: '#E74C3C' },
});
