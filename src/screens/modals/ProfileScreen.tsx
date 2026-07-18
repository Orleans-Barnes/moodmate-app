import React, { useCallback, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
  View, Text, ScrollView, Pressable, StyleSheet, Image, Switch,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { useWellnessStore } from '@/state/useWellnessStore';
import { useJournalStore } from '@/state/useJournalStore';
import { useWalletStore } from '@/state/useWalletStore';
import { useAuthStore } from '@/state/useAuthStore';
import { useToast } from '@/state/useToast';
import { ApiRequestError } from '@/api/client';
import { BACKEND_BASE_URL } from '@/config';
import { colors, fonts, fontSizes, radii, spacing, shadow } from '@/theme/tokens';
import { useGamificationStore } from '@/state/useGamificationStore';
import {
  requestNotificationPermission,
  scheduleDailyReminder,
  cancelDailyReminder,
  REMINDER_TIMES,
} from '@/utils/notifications';

type Props = NativeStackScreenProps<RootStackParamList, 'Profile'>;

const JOURNEY_STAGES = ['Roots', 'Sprout', 'Bloom', 'Canopy'];

const MENU_SECTIONS: Array<{
  items: Array<{ icon: keyof typeof Ionicons.glyphMap; tint: string; label: string; action: string }>;
}> = [
  {
    items: [
      { icon: 'bar-chart-outline',   tint: '#EDE9FE', label: 'Mood history',   action: 'MoodHistory' },
      { icon: 'create-outline',      tint: '#E0F2FE', label: 'Edit profile',   action: 'EditProfile' },
      { icon: 'storefront-outline',  tint: '#DCFCE7', label: 'Tree shop',      action: 'Shop' },
    ],
  },
  {
    items: [
      { icon: 'notifications-outline', tint: '#FEF3C7', label: 'Notifications',  action: 'notifications' },
      { icon: 'lock-closed-outline',   tint: '#FEE2E2', label: 'Privacy & data', action: 'PrivacyData' },
      { icon: 'help-circle-outline',   tint: '#E0F2FE', label: 'Help & support', action: 'HelpSupport' },
    ],
  },
];

export function ProfileScreen({ navigation }: Props) {
  const streakCount  = useWellnessStore((s) => s.streakCount);
  const treeStage    = useWellnessStore((s) => s.treeStage);
  const treeSkinEmoji = useWellnessStore((s) => s.treeSkinEmoji);
  const loadWellness = useWellnessStore((s) => s.load);
  const leafBalance  = useWalletStore((s) => s.leafBalance);
  const loadWallet   = useWalletStore((s) => s.load);
  const entryCount   = useJournalStore((s) => s.entries.length);
  const token        = useAuthStore((s) => s.token);
  const user         = useAuthStore((s) => s.user);
  const logout       = useAuthStore((s) => s.logout);
  const isGuest      = user?.guest ?? false;
  const toast        = useToast();
  const reminderEnabled = useGamificationStore((s) => s.reminderEnabled);
  const reminderHour    = useGamificationStore((s) => s.reminderHour);
  const reminderMinute  = useGamificationStore((s) => s.reminderMinute);
  const setReminder     = useGamificationStore((s) => s.setReminder);
  const [showReminder, setShowReminder] = useState(false);
  const insets       = useSafeAreaInsets();
  const stageIndex   = JOURNEY_STAGES.indexOf(treeStage);

  const refresh = useCallback(() => {
    if (!token) return;
    loadWellness(token).catch((err) => {
      toast(err instanceof ApiRequestError ? err.message : 'Could not load your stats.');
    });
    loadWallet(token).catch(() => {});
  }, [token, loadWellness, loadWallet, toast]);

  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));

  const handleLogout = async () => {
    await logout();
    toast('Logged out 👋');
    navigation.reset({ index: 0, routes: [{ name: 'RoleSelect' }] });
  };

  const handleMenu = (action: string) => {
    if (action === 'MoodHistory') navigation.navigate('MoodHistory');
    else if (action === 'EditProfile') navigation.navigate('EditProfile');
    else if (action === 'Shop') navigation.navigate('Shop');
    else if (action === 'PrivacyData') navigation.navigate('PrivacyData');
    else if (action === 'HelpSupport') navigation.navigate('HelpSupport');
    else if (action === 'notifications') setShowReminder((v) => !v);
    else toast(`${action === 'soon' ? 'Coming soon' : action} 🔧`);
  };

  const handleReminderToggle = async (value: boolean) => {
    if (value) {
      const granted = await requestNotificationPermission();
      if (!granted) { toast('Please enable notifications in your device settings'); return; }
      await scheduleDailyReminder(reminderHour, reminderMinute);
    } else {
      await cancelDailyReminder();
    }
    setReminder(value, reminderHour, reminderMinute);
  };

  const handleReminderTime = async (hour: number, minute: number) => {
    setReminder(reminderEnabled, hour, minute);
    if (reminderEnabled) {
      await scheduleDailyReminder(hour, minute);
    }
  };

  const avatarUrl = user?.avatarUrl ? `${BACKEND_BASE_URL}${user.avatarUrl}` : null;

  return (
    <ScrollView
      style={s.root}
      contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Gradient header ── */}
      <LinearGradient
        colors={['#8E7BC0', '#A491D3', '#C5B8E8']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[s.header, { paddingTop: insets.top + spacing.lg }]}
      >
        {/* Back/close */}
        <Pressable onPress={() => navigation.goBack()} style={s.closeBtn} hitSlop={10}>
          <Ionicons name="close" size={22} color="rgba(255,255,255,0.9)" />
        </Pressable>

        {/* Avatar */}
        <View style={s.avatarWrap}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={s.avatarImg} />
          ) : (
            <Text style={s.avatarEmoji}>{user?.avatarEmoji ?? '👤'}</Text>
          )}
        </View>

        <Text style={s.name}>{user?.fullName ?? 'Guest'}</Text>
        <Text style={s.institution}>
          {user?.institution ?? (user?.guest ? 'Guest account' : 'MoodMate member')}
        </Text>

        {/* Edit button */}
        <Pressable
          style={s.editBtn}
          onPress={() => navigation.navigate('EditProfile')}
        >
          <Text style={s.editBtnText}>Edit profile</Text>
        </Pressable>
      </LinearGradient>

      {/* ── Stats strip / Guest identity card ── */}
      {isGuest ? (
        <View style={s.guestCard}>
          <View style={s.guestCardTop}>
            <View style={s.guestCardIconWrap}>
              <Ionicons name="leaf-outline" size={24} color="#22C55E" />
            </View>
            <View style={s.guestCardText}>
              <Text style={s.guestCardTitle}>Exploring as guest</Text>
              <Text style={s.guestCardSub}>Create an account to unlock everything</Text>
            </View>
          </View>
          <View style={s.guestFeatures}>
            {['Daily streaks', 'XP & levels', 'Badges', 'Mood history', 'Wellness tree', 'Community'].map((f) => (
              <View key={f} style={s.guestFeatureChip}>
                <Text style={s.guestFeatureTxt}>{f}</Text>
              </View>
            ))}
          </View>
        </View>
      ) : (
        <View style={s.statsStrip}>
          <View style={s.statItem}>
            <View style={{flexDirection:'row',alignItems:'center',gap:3}}><Ionicons name="flame" size={14} color="#F97316" /><Text style={s.statVal}>{streakCount}</Text></View>
            <Text style={s.statLab}>Day streak</Text>
          </View>
          <View style={s.statDivider} />
          <View style={s.statItem}>
            <View style={{flexDirection:'row',alignItems:'center',gap:3}}>
              <Ionicons name="journal-outline" size={14} color={colors.lavender} />
              <Text style={s.statVal}>{entryCount}</Text>
            </View>
            <Text style={s.statLab}>Journal entries</Text>
          </View>
          <View style={s.statDivider} />
          <View style={s.statItem}>
            <View style={{flexDirection:'row',alignItems:'center',gap:3}}>
              <Ionicons name="leaf" size={14} color="#16A34A" />
              <Text style={s.statVal}>{treeStage}</Text>
            </View>
            <Text style={s.statLab}>Tree stage</Text>
          </View>
        </View>
      )}

      {/* ── Leaves / wallet ── */}
      <View style={s.body}>
        <Pressable style={s.leafCard} onPress={() => navigation.navigate('Shop')}>
          <View style={s.leafLeft}>
            <View style={s.leafIconWrap}><Ionicons name="leaf" size={22} color="#16A34A" /></View>
            <View>
              <Text style={s.leafTitle}>Leaf balance</Text>
              <Text style={s.leafSub}>Earn more by completing goals</Text>
            </View>
          </View>
          <View style={s.leafChip}>
            <Text style={s.leafCount}>{leafBalance}</Text>
          </View>
        </Pressable>

        {/* ── Pro upgrade card ── */}
        <Pressable onPress={() => navigation.navigate('Pro')}>
          <LinearGradient
            colors={['#FFC857', '#FFD98C']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={s.proCard}
          >
            <View style={s.proLeft}>
              <View style={{flexDirection:'row',alignItems:'center',gap:6}}><Ionicons name="star" size={16} color="#F59E0B" /><Text style={s.proTitle}>Upgrade to Pro</Text></View>
              <Text style={s.proSub}>AI coach · analytics · video calls</Text>
            </View>
            <Text style={s.proArrow}>›</Text>
          </LinearGradient>
        </Pressable>

        {/* ── Menu sections ── */}
        {MENU_SECTIONS.map((section, si) => (
          <View key={`section-${si}`} style={s.menuCard}>
            {section.items.map((row, ri) => (
              <Pressable
                key={row.label}
                style={[s.menuRow, ri < section.items.length - 1 && s.menuDivider]}
                onPress={() => handleMenu(row.action)}
              >
                <View style={[s.menuIconWrap, { backgroundColor: row.tint }]}>
                  <Ionicons name={row.icon} size={18} color={colors.ink} />
                </View>
                <Text style={[s.menuLabel, s.flex]}>{row.label}</Text>
                <Text style={s.chevron}>›</Text>
              </Pressable>
            ))}
          </View>
        ))}

        {/* ── Daily Reminder expandable card ── */}
        {showReminder && (
          <View style={s.reminderCard}>
            <View style={s.reminderHeader}>
              <View style={{flexDirection:'row',alignItems:'center',gap:6}}><Ionicons name="notifications" size={16} color="#6366F1" /><Text style={s.reminderTitle}>Daily Reminder</Text></View>
              <Switch
                value={reminderEnabled}
                onValueChange={handleReminderToggle}
                trackColor={{ false: colors.line, true: '#8E7BC0' }}
                thumbColor="#FFFFFF"
              />
            </View>
            {reminderEnabled && (
              <>
                <Text style={s.reminderSub}>Choose your reminder time:</Text>
                <View style={s.reminderTimes}>
                  {REMINDER_TIMES.map((rt: typeof REMINDER_TIMES[number]) => {
                    const active = rt.hour === reminderHour && rt.minute === reminderMinute;
                    return (
                      <Pressable
                        key={rt.label}
                        style={[s.timeChip, active && s.timeChipActive]}
                        onPress={() => handleReminderTime(rt.hour, rt.minute)}
                      >
                        <Text style={[s.timeChipTxt, active && s.timeChipTxtActive]}>
                          {rt.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
                <View style={s.reminderNoteRow}>
                  <Ionicons name="warning-outline" size={12} color={colors.inkFaint} />
                  <Text style={s.reminderNote}>Requires a development build (not Expo Go) to deliver push notifications.
                  </Text>
                </View>
              </>
            )}
          </View>
        )}

        {/* ── Switch Role ── */}
        <Pressable style={s.switchRoleBtn} onPress={() => {
          logout();
          navigation.reset({ index: 0, routes: [{ name: 'RoleSelect' }] });
        }}>
          <View style={{flexDirection:'row',alignItems:'center',gap:8}}>
            <Ionicons name="swap-horizontal-outline" size={18} color="#2980B9" />
            <Text style={s.switchRoleTxt}>Switch Role</Text>
          </View>
        </Pressable>

        {/* ── Logout ── */}
        <Pressable style={s.logoutBtn} onPress={handleLogout}>
          <Text style={s.logoutTxt}>Log out</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const AVATAR_SIZE = 90;

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },

  // Header
  header: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl + 10,
  },
  closeBtn: {
    position: 'absolute',
    top: 0,
    right: spacing.lg,
    paddingTop: spacing.lg,
  },
  // closeTxt removed — replaced by Ionicons close icon
  avatarWrap: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  avatarEmoji: { fontSize: 40 },
  avatarImg: { width: AVATAR_SIZE, height: AVATAR_SIZE, borderRadius: AVATAR_SIZE / 2 },
  name: {
    fontFamily: fonts.display,
    fontSize: fontSizes.xl,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  institution: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.xs,
    color: 'rgba(255,255,255,0.75)',
    marginBottom: spacing.md,
  },
  editBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: spacing.lg,
    paddingVertical: 8,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  editBtnText: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.sm,
    color: '#FFFFFF',
  },

  // Guest identity card
  guestCard: {
    backgroundColor: '#1C1C2E',
    marginHorizontal: spacing.lg,
    borderRadius: 16,
    padding: spacing.lg,
    gap: spacing.md,
    marginTop: -20,
  },
  guestCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  guestCardIcon: { fontSize: 28 },
  guestCardIconWrap: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(34,197,94,0.12)', alignItems: 'center' as const, justifyContent: 'center' as const },
  guestCardText: { flex: 1, gap: 2 },
  guestCardTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.base,
    color: '#FFFFFF',
  },
  guestCardSub: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.xs,
    color: 'rgba(255,255,255,0.5)',
  },
  guestFeatures: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  guestFeatureChip: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  guestFeatureTxt: {
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
  },

  // Stats strip
  statsStrip: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginHorizontal: spacing.lg,
    borderRadius: radii.md,
    padding: spacing.md,
    marginTop: -20,
    ...shadow.md,
  },
  statItem: { flex: 1, alignItems: 'center', gap: 3 },
  statVal: { fontFamily: fonts.bodyBold, fontSize: fontSizes.base, color: colors.ink },
  statLab: { fontFamily: fonts.bodyMedium, fontSize: 10, color: colors.inkFaint },
  statDivider: { width: 1, backgroundColor: colors.line },

  // Body
  body: { padding: spacing.lg, gap: spacing.md },

  // Leaf card
  leafCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radii.md,
    padding: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...shadow.sm,
  },
  leafLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  leafEmoji: { fontSize: 28 },
  leafIconWrap: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#DCFCE7', alignItems: 'center' as const, justifyContent: 'center' as const, marginBottom: 4 },
  leafTitle: { fontFamily: fonts.bodyBold, fontSize: fontSizes.base, color: colors.ink },
  leafSub: { fontFamily: fonts.bodyMedium, fontSize: fontSizes.xs, color: colors.inkFaint, marginTop: 2 },
  leafChip: {
    backgroundColor: colors.sageSoft,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radii.pill,
  },
  leafCount: { fontFamily: fonts.bodyBold, fontSize: fontSizes.md, color: colors.sage },

  // Pro card
  proCard: {
    borderRadius: radii.md,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    ...shadow.sm,
  },
  proLeft: { flex: 1 },
  proTitle: { fontFamily: fonts.bodyBold, fontSize: fontSizes.base, color: colors.sunText },
  proSub: { fontFamily: fonts.bodyMedium, fontSize: fontSizes.xs, color: '#7A5C00', marginTop: 2 },
  proArrow: { fontSize: 22, color: colors.sunText, fontFamily: fonts.bodyBold },

  // Menu
  menuCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    ...shadow.sm,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: spacing.md,
  },
  menuDivider: { borderBottomWidth: 1, borderBottomColor: colors.line },
  menuIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // menuIcon removed — replaced by Ionicons
  menuLabel: { fontFamily: fonts.bodyMedium, fontSize: fontSizes.base, color: colors.ink },
  chevron: { color: colors.inkFaint, fontSize: 18, fontFamily: fonts.bodyBold },

  switchRoleBtn: {
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#EBF5FB',
    borderWidth: 1.5,
    borderColor: '#2980B9',
    marginBottom: 0,
  },
  switchRoleTxt: {
    fontFamily: fonts.bodyBold,
    fontSize: 15,
    color: '#2980B9',
  },

  // Logout
  logoutBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: radii.md,
    padding: spacing.lg,
    alignItems: 'center',
    ...shadow.sm,
  },
  logoutTxt: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.base,
    color: colors.coral,
  },

  reminderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radii.md,
    padding: spacing.lg,
    gap: spacing.sm,
    ...shadow.sm,
  },
  reminderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reminderTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.base,
    color: colors.ink,
  },
  reminderSub: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.xs,
    color: colors.inkFaint,
    marginTop: 4,
  },
  reminderTimes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  timeChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.pill,
    backgroundColor: colors.bg,
    borderWidth: 1.5,
    borderColor: colors.line,
  },
  timeChipActive: {
    backgroundColor: '#8E7BC0',
    borderColor: '#8E7BC0',
  },
  timeChipTxt: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.xs,
    color: colors.inkSoft,
  },
  timeChipTxtActive: { color: '#FFFFFF' },
  reminderNoteRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 4, marginTop: 4 },
  reminderNote: {
    fontFamily: fonts.bodyMedium,
    fontSize: 10,
    color: colors.inkFaint,
    lineHeight: 14,
    flex: 1,
  },
});
