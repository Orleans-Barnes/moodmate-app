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
  ActionSheetIOS, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { useAuthStore } from '@/state/useAuthStore';
import {
  searchAdminUsers, suspendUser, reinstateUser, changeUserRole,
  type AdminUserView, type AdminAssignableRole,
} from '@/api/auth';
import { overrideUserSubscription } from '@/api/support';
import { ApiRequestError } from '@/api/client';
import { FadeInItem } from '@/components/FadeInItem';
import { useKeyboardOffset } from '@/hooks/useKeyboardOffset';
import { colors, fonts, fontSizes, radii, spacing, shadow } from '@/theme/tokens';

const ASSIGNABLE_ROLES: AdminAssignableRole[] = ['STUDENT', 'COUNSELLOR', 'MENTOR'];

type Props = NativeStackScreenProps<RootStackParamList, 'AdminUserManagement'>;

const ROLE_COLORS: Record<string, string> = {
  STUDENT: colors.coral,
  COUNSELLOR: colors.blueDeep,
  MENTOR: colors.sageDeep,
  ADMIN: colors.warning,
};

export function AdminUserManagementScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const keyboardHeight = useKeyboardOffset();
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

  const applyRoleChange = async (user: AdminUserView, role: AdminAssignableRole) => {
    if (role === user.role) return;
    setActionId(user.id);
    try {
      const updated = await changeUserRole(token, user.id, role);
      setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, role: updated.role } : u));
    } catch (err) {
      Alert.alert('Error', err instanceof ApiRequestError ? err.message : 'Could not change this account\'s role.');
    } finally {
      setActionId(null);
    }
  };

  const handleChangeRole = (user: AdminUserView) => {
    const choices = ASSIGNABLE_ROLES.filter((r) => r !== user.role);
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: ['Cancel', ...choices], cancelButtonIndex: 0 },
        (idx) => { if (idx > 0) applyRoleChange(user, choices[idx - 1]); },
      );
    } else {
      Alert.alert(
        'Change role',
        `Current role: ${user.role}`,
        [
          ...choices.map((r) => ({ text: r, onPress: () => applyRoleChange(user, r) })),
          { text: 'Cancel', style: 'cancel' as const },
        ],
      );
    }
  };

  // Premium & Monetization (Milestone 3) - admin override, bypassing Paystack entirely. No
  // per-row Pro status is fetched here (would mean an extra cross-service call per user in the
  // list) - the confirm dialog states the action plainly instead.
  const applySubscriptionOverride = async (user: AdminUserView, status: 'ACTIVE' | 'EXPIRED') => {
    setActionId(user.id);
    try {
      await overrideUserSubscription(token, user.id, status, status === 'ACTIVE' ? 30 : undefined);
      Alert.alert('Done', status === 'ACTIVE'
        ? `${user.fullName} now has Pro for 30 days.`
        : `${user.fullName}'s Pro access has been revoked.`);
    } catch (err) {
      Alert.alert('Error', err instanceof ApiRequestError ? err.message : 'Could not update this account\'s subscription.');
    } finally {
      setActionId(null);
    }
  };

  const handleManagePro = (user: AdminUserView) => {
    const options = [
      { text: 'Grant Pro (30 days)', onPress: () => applySubscriptionOverride(user, 'ACTIVE') },
      { text: 'Revoke Pro', style: 'destructive' as const, onPress: () => applySubscriptionOverride(user, 'EXPIRED') },
    ];
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: ['Cancel', ...options.map((o) => o.text)], cancelButtonIndex: 0, destructiveButtonIndex: 2 },
        (idx) => { if (idx > 0) options[idx - 1].onPress(); },
      );
    } else {
      Alert.alert('Manage Pro status', `${user.fullName}`, [...options, { text: 'Cancel', style: 'cancel' as const }]);
    }
  };

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <LinearGradient colors={['#24412A', '#579E65']} style={s.header}
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

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 + keyboardHeight }}
      >
        {error ? (
          <View style={s.alertBanner}>
            <Ionicons name="warning-outline" size={18} color={colors.error} />
            <Text style={s.alertText}>{error}</Text>
          </View>
        ) : loading ? (
          <ActivityIndicator color={colors.coral} style={{ marginVertical: 40 }} />
        ) : users.length === 0 ? (
          <View style={s.emptyState}>
            <Ionicons name="person-outline" size={40} color={colors.inkFaint} />
            <Text style={s.emptyBody}>No users found.</Text>
          </View>
        ) : (
          users.map((u, idx) => (
            <FadeInItem key={u.id} index={idx} style={s.card}>
              <View style={s.cardHeader}>
                <View style={[s.avatarCircle, { backgroundColor: ROLE_COLORS[u.role] ?? colors.coral }]}>
                  <Text style={s.avatarText}>{u.fullName.charAt(0).toUpperCase()}</Text>
                </View>
                <View style={s.cardInfo}>
                  <Text style={s.cardName} numberOfLines={1}>{u.fullName}</Text>
                  <Text style={s.cardEmail} numberOfLines={1}>{u.email}</Text>
                </View>
                <View style={[s.roleBadge, { backgroundColor: (ROLE_COLORS[u.role] ?? colors.coral) + '22' }]}>
                  <Text style={[s.roleBadgeText, { color: ROLE_COLORS[u.role] ?? colors.coral }]}>{u.role}</Text>
                </View>
              </View>

              <View style={s.metaRow}>
                <Text style={s.metaText}>{u.institution ?? 'No institution'}</Text>
                {u.warningCount > 0 && <Text style={s.metaWarn}>{u.warningCount} warning{u.warningCount > 1 ? 's' : ''}</Text>}
              </View>

              {u.banned && (
                <View style={s.bannedBanner}>
                  <Text style={s.bannedText}>Suspended{u.bannedReason ? `: ${u.bannedReason}` : ''}</Text>
                </View>
              )}

              {u.role !== 'ADMIN' && (
                <View style={s.actionRow}>
                  <Pressable
                    style={[s.roleChangeBtn, actionId === u.id && s.btnDisabled]}
                    onPress={() => handleChangeRole(u)}
                    disabled={actionId === u.id}
                  >
                    <Text style={s.roleChangeBtnText}>Change role</Text>
                  </Pressable>
                  <Pressable
                    style={[s.proBtn, actionId === u.id && s.btnDisabled]}
                    onPress={() => handleManagePro(u)}
                    disabled={actionId === u.id}
                  >
                    <Text style={s.proBtnText}>Pro</Text>
                  </Pressable>
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
            </FadeInItem>
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
  searchBtnText: { fontFamily: fonts.bodyBold, fontSize: fontSizes.xs, color: colors.coral },

  alertBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: spacing.xl, marginTop: spacing.md,
    backgroundColor: colors.errorSoft, borderRadius: radii.md, padding: spacing.md,
    borderLeftWidth: 3, borderLeftColor: colors.error,
  },
  alertText: { fontFamily: fonts.bodyMedium, fontSize: fontSizes.sm, color: colors.errorDeep, flex: 1 },

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
  metaWarn: { fontFamily: fonts.bodyMedium, fontSize: fontSizes.xs, color: colors.warning },

  bannedBanner: {
    marginTop: spacing.sm, backgroundColor: colors.errorSoft, borderRadius: radii.sm,
    paddingHorizontal: spacing.sm, paddingVertical: 6,
  },
  bannedText: { fontFamily: fonts.bodyMedium, fontSize: fontSizes.xs, color: colors.error },

  actionRow: { marginTop: spacing.md, flexDirection: 'row', gap: spacing.sm },
  suspendBtn: {
    flex: 1, paddingVertical: spacing.sm, borderRadius: radii.md, borderWidth: 1.5,
    borderColor: colors.coral, alignItems: 'center', justifyContent: 'center',
  },
  suspendBtnText: { fontFamily: fonts.bodyBold, fontSize: fontSizes.sm, color: colors.coral },
  reinstateBtn: {
    flex: 1, paddingVertical: spacing.sm, borderRadius: radii.md, backgroundColor: colors.sage,
    alignItems: 'center', justifyContent: 'center',
  },
  reinstateBtnText: { fontFamily: fonts.bodyBold, fontSize: fontSizes.sm, color: '#fff' },
  roleChangeBtn: {
    flex: 1, paddingVertical: spacing.sm, borderRadius: radii.md, borderWidth: 1.5,
    borderColor: colors.coral, alignItems: 'center', justifyContent: 'center',
  },
  roleChangeBtnText: { fontFamily: fonts.bodyBold, fontSize: fontSizes.sm, color: colors.coral },
  proBtn: {
    flex: 1, paddingVertical: spacing.sm, borderRadius: radii.md, borderWidth: 1.5,
    borderColor: colors.premiumGold, alignItems: 'center', justifyContent: 'center',
  },
  proBtnText: { fontFamily: fonts.bodyBold, fontSize: fontSizes.sm, color: colors.premiumGold },
  btnDisabled: { opacity: 0.5 },
});
