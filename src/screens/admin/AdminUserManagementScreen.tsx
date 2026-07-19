/**
 * AdminUserManagementScreen — Phase 1H (Admin Portal - User Management).
 *
 * Search the full user table (name/email), suspend/reinstate an account. Reuses the same
 * banned/bannedReason fields Feature 7's community-moderation flow already writes - this is a
 * second, general-purpose entry point into that same action, not a new moderation system.
 */
import React, { useCallback, useState } from 'react';
import {
  View, Text, Pressable, StyleSheet, ActivityIndicator, ScrollView, TextInput, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { useAuthStore } from '@/state/useAuthStore';
import { searchAdminUsers, suspendUser, reinstateUser, type AdminUserView } from '@/api/auth';
import { ApiRequestError } from '@/api/client';
import { colors, fonts, fontSizes, radii, spacing, shadow } from '@/theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'AdminUserManagement'>;

const ROLE_COLORS: Record<string, string> = {
  STUDENT: '#5B2FA0',
  COUNSELLOR: '#2980B9',
  MENTOR: '#2D6A4F',
  ADMIN: '#E67E22',
};

export function AdminUserManagementScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const token = useAuthStore((s) => s.token) ?? '';

  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<AdminUserView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionId, setActionId] = useState<number | null>(null);

  const load = useCallback(async (q: string) => {
    setLoading(true);
    setError(null);
    try {
      const page = await searchAdminUsers(token, q);
      setUsers(page.content);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Could not load users.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  React.useEffect(() => { load(''); }, [load]);

  const handleSuspend = (user: AdminUserView) => {
    Alert.alert(
      'Suspend account?',
      `${user.fullName} (${user.email}) will no longer be able to log in.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Suspend', style: 'destructive',
          onPress: async () => {
            setActionId(user.id);
            try {
              await suspendUser(token, user.id, 'Suspended by admin via User Management');
              setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, banned: true } : u));
            } catch (err) {
              Alert.alert('Error', err instanceof ApiRequestError ? err.message : 'Could not suspend this account.');
            } finally {
              setActionId(null);
            }
          },
        },
      ],
    );
  };

  const handleReinstate = async (user: AdminUserView) => {
    setActionId(user.id);
    try {
      await reinstateUser(token, user.id);
      setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, banned: false, bannedReason: null } : u));
    } catch (err) {
      Alert.alert('Error', err instanceof ApiRequestError ? err.message : 'Could not reinstate this account.');
    } finally {
      setActionId(null);
    }
  };

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <LinearGradient colors={['#2C1654', '#5B2FA0', '#2980B9']} style={s.header}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <Pressable style={s.backBtn} onPress={() => navigation.goBack()} hitSlop={10}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </Pressable>
        <Text style={s.headerTitle}>User Management</Text>
        <View style={{ width: 34 }} />
      </LinearGradient>

      <View style={s.searchRow}>
        <Ionicons name="search-outline" size={18} color={colors.inkFaint} />
        <TextInput
          style={s.searchInput}
          placeholder="Search by name or email…"
          placeholderTextColor={colors.inkFaint}
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={() => load(query)}
          autoCapitalize="none"
          returnKeyType="search"
        />
        <Pressable style={s.searchBtn} onPress={() => load(query)}>
          <Text style={s.searchBtnText}>Search</Text>
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}>
        {error ? (
          <View style={s.alertBanner}>
            <Ionicons name="warning-outline" size={18} color="#C0392B" />
            <Text style={s.alertText}>{error}</Text>
          </View>
        ) : loading ? (
          <ActivityIndicator color={colors.lavender} style={{ marginVertical: 40 }} />
        ) : users.length === 0 ? (
          <View style={s.emptyState}>
            <Ionicons name="person-outline" size={40} color={colors.inkFaint} />
            <Text style={s.emptyBody}>No users found.</Text>
          </View>
        ) : (
          users.map((u) => (
            <View key={u.id} style={s.card}>
              <View style={s.cardHeader}>
                <View style={[s.avatarCircle, { backgroundColor: ROLE_COLORS[u.role] ?? colors.lavender }]}>
                  <Text style={s.avatarText}>{u.fullName.charAt(0).toUpperCase()}</Text>
                </View>
                <View style={s.cardInfo}>
                  <Text style={s.cardName} numberOfLines={1}>{u.fullName}</Text>
                  <Text style={s.cardEmail} numberOfLines={1}>{u.email}</Text>
                </View>
                <View style={[s.roleBadge, { backgroundColor: (ROLE_COLORS[u.role] ?? colors.lavender) + '22' }]}>
                  <Text style={[s.roleBadgeText, { color: ROLE_COLORS[u.role] ?? colors.lavender }]}>{u.role}</Text>
                </View>
              </View>

              <View style={s.metaRow}>
                <Text style={s.metaText}>{u.institution ?? 'No institution'}</Text>
                {u.warningCount > 0 && <Text style={s.metaWarn}>⚠️ {u.warningCount} warning{u.warningCount > 1 ? 's' : ''}</Text>}
              </View>

              {u.banned && (
                <View style={s.bannedBanner}>
                  <Text style={s.bannedText}>Suspended{u.bannedReason ? `: ${u.bannedReason}` : ''}</Text>
                </View>
              )}

              {u.role !== 'ADMIN' && (
                <View style={s.actionRow}>
                  {u.banned ? (
                    <Pressable
                      style={[s.reinstateBtn, actionId === u.id && s.btnDisabled]}
                      onPress={() => handleReinstate(u)}
                      disabled={actionId === u.id}
                    >
                      {actionId === u.id
                        ? <ActivityIndicator size="small" color="#fff" />
                        : <Text style={s.reinstateBtnText}>Reinstate</Text>}
                    </Pressable>
                  ) : (
                    <Pressable
                      style={[s.suspendBtn, actionId === u.id && s.btnDisabled]}
                      onPress={() => handleSuspend(u)}
                      disabled={actionId === u.id}
                    >
                      {actionId === u.id
                        ? <ActivityIndicator size="small" color={colors.coral} />
                        : <Text style={s.suspendBtnText}>Suspend</Text>}
                    </Pressable>
                  )}
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.lg,
  },
  backBtn: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: fonts.displaySemibold, fontSize: fontSizes.lg, color: '#fff' },

  searchRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: spacing.xl, marginTop: spacing.lg, marginBottom: spacing.md,
    backgroundColor: colors.surface, borderRadius: radii.md, paddingHorizontal: spacing.md,
    ...shadow.sm,
  },
  searchInput: { flex: 1, fontFamily: fonts.body, fontSize: fontSizes.sm, color: colors.ink, paddingVertical: spacing.sm },
  searchBtn: { paddingVertical: 6, paddingHorizontal: 10 },
  searchBtnText: { fontFamily: fonts.bodyBold, fontSize: fontSizes.xs, color: colors.lavender },

  alertBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: spacing.xl, marginTop: spacing.md,
    backgroundColor: '#FEF0EE', borderRadius: radii.md, padding: spacing.md,
    borderLeftWidth: 3, borderLeftColor: '#C0392B',
  },
  alertText: { fontFamily: fonts.bodyMedium, fontSize: fontSizes.sm, color: '#7B1010', flex: 1 },

  emptyState: { alignItems: 'center', paddingVertical: spacing.xxl, gap: 10, marginHorizontal: spacing.xl },
  emptyBody: { fontFamily: fonts.bodyMedium, fontSize: fontSizes.sm, color: colors.inkSoft, textAlign: 'center' },

  card: {
    backgroundColor: colors.surface, borderRadius: radii.md, padding: spacing.lg,
    marginHorizontal: spacing.xl, marginBottom: spacing.md, ...shadow.sm,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  avatarCircle: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: fonts.display, fontSize: fontSizes.md, color: '#fff' },
  cardInfo: { flex: 1 },
  cardName: { fontFamily: fonts.bodyBold, fontSize: fontSizes.md, color: colors.ink },
  cardEmail: { fontFamily: fonts.body, fontSize: fontSizes.xs, color: colors.inkSoft },
  roleBadge: { borderRadius: radii.pill, paddingHorizontal: spacing.sm, paddingVertical: 3 },
  roleBadgeText: { fontFamily: fonts.bodyBold, fontSize: 9, letterSpacing: 0.5 },

  metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.sm },
  metaText: { fontFamily: fonts.body, fontSize: fontSizes.xs, color: colors.inkFaint },
  metaWarn: { fontFamily: fonts.bodyMedium, fontSize: fontSizes.xs, color: '#E67E22' },

  bannedBanner: {
    marginTop: spacing.sm, backgroundColor: '#FEF0EE', borderRadius: radii.sm,
    paddingHorizontal: spacing.sm, paddingVertical: 6,
  },
  bannedText: { fontFamily: fonts.bodyMedium, fontSize: fontSizes.xs, color: '#C0392B' },

  actionRow: { marginTop: spacing.md },
  suspendBtn: {
    paddingVertical: spacing.sm, borderRadius: radii.md, borderWidth: 1.5,
    borderColor: colors.coral, alignItems: 'center', justifyContent: 'center',
  },
  suspendBtnText: { fontFamily: fonts.bodyBold, fontSize: fontSizes.sm, color: colors.coral },
  reinstateBtn: {
    paddingVertical: spacing.sm, borderRadius: radii.md, backgroundColor: colors.sage,
    alignItems: 'center', justifyContent: 'center',
  },
  reinstateBtnText: { fontFamily: fonts.bodyBold, fontSize: fontSizes.sm, color: '#fff' },
  btnDisabled: { opacity: 0.5 },
});
