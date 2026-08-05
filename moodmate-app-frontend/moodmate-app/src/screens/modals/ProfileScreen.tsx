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
import type { AppearanceMode } from '@/state/useAppearanceStore';
import { useResolvedAppearance } from '@/hooks/useResolvedAppearance';
import { useToast } from '@/state/useToast';
import { ApiRequestError } from '@/api/client';
import { BACKEND_BASE_URL } from '@/config';
import { AppIcon } from '@/components/AppIcon';
import { DEFAULT_AVATAR_ICON, DEFAULT_TREE_ICON, resolveIcon } from '@/theme/iconMap';
import { colors, calm, darkPalette, fonts, fontSizes, radii, spacing, shadow, gradients } from '@/theme/tokens';
import { useGamificationStore } from '@/state/useGamificationStore';
import {
  requestNotificationPermission,
  scheduleDailyReminder,
  cancelDailyReminder,
  REMINDER_TIMES,
} from '@/utils/notifications';
import { openProUpgrade } from '@/utils/openProUpgrade';

type Props = NativeStackScreenProps<RootStackParamList, 'Profile'>;

const JOURNEY_STAGES = ['Roots', 'Sprout', 'Bloom', 'Canopy'];

const MENU_SECTIONS: Array<{
  items: Array<{ icon: keyof typeof Ionicons.glyphMap; tint: string; label: string; action: string }>;
}> = [
  {
    items: [
      { icon: 'bar-chart-outline',   tint: calm.mintBg, label: 'Mood history',   action: 'MoodHistory' },
      { icon: 'create-outline',      tint: calm.mintBg, label: 'Edit profile',   action: 'EditProfile' },
      { icon: 'storefront-outline',  tint: calm.mintBg, label: 'Tree shop',      action: 'Shop' },
    ],
  },
  {
    items: [
      { icon: 'notifications-outline', tint: calm.mintBg, label: 'Notifications',  action: 'notifications' },
      { icon: 'contrast-outline',      tint: calm.mintBg, label: 'Appearance',     action: 'appearance' },
      { icon: 'lock-closed-outline',   tint: calm.mintBg, label: 'Privacy & data', action: 'PrivacyData' },
      { icon: 'help-circle-outline',   tint: calm.mintBg, label: 'Help & support', action: 'HelpSupport' },
    ],
  },
];

const APPEARANCE_OPTIONS: Array<{
  mode: AppearanceMode;
  label: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
}> = [
  { mode: 'system', label: 'System', description: 'Follow this device', icon: 'phone-portrait-outline' },
  { mode: 'light', label: 'Light', description: 'Soft daytime theme', icon: 'sunny-outline' },
  { mode: 'dark', label: 'Dark', description: 'Low-light calm theme', icon: 'moon-outline' },
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
  const {
    mode: appearanceMode,
    effective: effectiveAppearance,
    isDark,
    setMode: setAppearanceMode,
  } = useResolvedAppearance();
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
    toast('Logged out');
    navigation.reset({ index: 0, routes: [{ name: 'RoleSelect' }] });
  };

  const handleMenu = (action: string) => {
    if (action === 'MoodHistory') navigation.navigate('MoodHistory');
    else if (action === 'EditProfile') navigation.navigate('EditProfile');
    else if (action === 'Shop') navigation.navigate('Shop');
    else if (action === 'PrivacyData') navigation.navigate('PrivacyData');
    else if (action === 'HelpSupport') navigation.navigate('HelpSupport');
    else if (action === 'notifications') setShowReminder((v) => !v);
    else toast(action === 'soon' ? 'Coming soon' : action);
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
      style={[s.root, isDark && s.rootDark]}
      contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Calm profile header ── */}
      <LinearGradient
        colors={isDark ? ['#050605', '#063A25'] : [calm.forest, calm.forest]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[s.header, { paddingTop: insets.top + spacing.lg }]}
      >
        {/* Back/close - positioned relative to insets.top explicitly, not just the header's
            paddingTop, since an absolutely-positioned child ignores its parent's padding and was
            landing right under the status bar/notch (overlapping the battery icon on some
            devices) before this fix. */}
        <Pressable
          onPress={() => navigation.goBack()}
          style={[s.closeBtn, { top: insets.top + spacing.lg }]}
          hitSlop={10}
        >
          <Ionicons name="close" size={22} color="rgba(255,255,255,0.9)" />
        </Pressable>

        {/* Avatar */}
        <View style={s.avatarWrap}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={s.avatarImg} />
          ) : (
            <AppIcon
              name={user?.avatarEmoji ?? DEFAULT_AVATAR_ICON}
              size={44}
              color="rgba(255,255,255,0.95)"
              fallback={DEFAULT_AVATAR_ICON}
            />
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
              <Ionicons name="leaf-outline" size={24} color={calm.primary} />
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
        <View style={[s.statsStrip, isDark && s.surfaceDark]}>
          <View style={s.statItem}>
            <View style={{flexDirection:'row',alignItems:'center',gap:3}}><Ionicons name="flame" size={14} color={calm.amber} /><Text style={[s.statVal, isDark && s.textDark]}>{streakCount}</Text></View>
            <Text style={[s.statLab, isDark && s.subTextDark]}>Day streak</Text>
          </View>
          <View style={[s.statDivider, isDark && s.dividerDark]} />
          <View style={s.statItem}>
            <View style={{flexDirection:'row',alignItems:'center',gap:3}}>
              <Ionicons name="journal-outline" size={14} color={isDark ? darkPalette.accent : calm.primary} />
              <Text style={[s.statVal, isDark && s.textDark]}>{entryCount}</Text>
            </View>
            <Text style={[s.statLab, isDark && s.subTextDark]}>Journal entries</Text>
          </View>
          <View style={[s.statDivider, isDark && s.dividerDark]} />
          <View style={s.statItem}>
            <View style={{flexDirection:'row',alignItems:'center',gap:3}}>
              <Ionicons name="leaf" size={14} color={isDark ? darkPalette.accent : calm.primary} />
              <Text style={[s.statVal, isDark && s.textDark]}>{treeStage}</Text>
            </View>
            <Text style={[s.statLab, isDark && s.subTextDark]}>Tree stage</Text>
          </View>
        </View>
      )}

      {/* ── Leaves / wallet ── */}
      <View style={s.body}>
        <Pressable style={[s.leafCard, isDark && s.surfaceDark]} onPress={() => navigation.navigate('Shop')}>
          <View style={s.leafLeft}>
            <View style={[s.leafIconWrap, isDark && s.iconWrapDark]}><Ionicons name="leaf" size={22} color={isDark ? darkPalette.accent : calm.primary} /></View>
            <View>
              <Text style={[s.leafTitle, isDark && s.textDark]}>Leaf balance</Text>
              <Text style={[s.leafSub, isDark && s.subTextDark]}>Earn more by completing goals</Text>
            </View>
          </View>
          <View style={[s.leafChip, isDark && s.leafChipDark]}>
            <Text style={[s.leafCount, isDark && s.accentTextDark]}>{leafBalance}</Text>
          </View>
        </Pressable>

        {/* ── Pro upgrade card ── */}
        <Pressable onPress={() => openProUpgrade(navigation, 'profile')}>
          <LinearGradient
            colors={gradients.sun}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={s.proCard}
          >
            <View style={s.proLeft}>
              <View style={{flexDirection:'row',alignItems:'center',gap:6}}><Ionicons name="star" size={16} color={colors.sunText} /><Text style={s.proTitle}>Upgrade to Pro</Text></View>
              <Text style={s.proSub}>AI coach · analytics · video calls</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.sunText} />
          </LinearGradient>
        </Pressable>

        {/* ── Menu sections ── */}
        {MENU_SECTIONS.map((section, si) => (
          <View key={`section-${si}`} style={[s.menuCard, isDark && s.darkCard]}>
            {section.items.map((row, ri) => {
              const isAppearanceRow = row.action === 'appearance';
              const rowStyle = [
                s.menuRow,
                isAppearanceRow && s.appearanceRow,
                ri < section.items.length - 1 && s.menuDivider,
                isDark && ri < section.items.length - 1 && s.menuDividerDark,
              ];

              if (isAppearanceRow) {
                return (
                  <View key={row.label} style={rowStyle}>
                    <View style={[s.menuIconWrap, isDark ? s.iconWrapDark : { backgroundColor: row.tint }]}>
                      <Ionicons name={row.icon} size={18} color={isDark ? darkPalette.accent : calm.forest} />
                    </View>
                    <View style={s.flex}>
                      <View style={s.appearanceHeaderLine}>
                        <Text style={[s.menuLabel, isDark && s.menuLabelDark]}>{row.label}</Text>
                        <Text style={[s.appearanceCurrent, isDark && s.accentTextDark]}>
                          {appearanceMode === 'system'
                            ? `System: ${effectiveAppearance === 'dark' ? 'Dark' : 'Light'}`
                            : APPEARANCE_OPTIONS.find((option) => option.mode === appearanceMode)?.label}
                        </Text>
                      </View>
                      <View style={[s.appearanceSegment, isDark && s.appearanceSegmentDark]}>
                        {APPEARANCE_OPTIONS.map((option) => {
                          const active = option.mode === appearanceMode;
                          return (
                            <Pressable
                              key={option.mode}
                              style={[
                                s.appearanceSegmentItem,
                                isDark && s.appearanceSegmentItemDark,
                                active && s.appearanceSegmentItemActive,
                                isDark && active && s.appearanceSegmentItemActiveDark,
                              ]}
                              onPress={() => {
                                setAppearanceMode(option.mode);
                                toast(`Appearance set to ${option.label}`);
                              }}
                              accessibilityRole="radio"
                              accessibilityLabel={`Use ${option.label} appearance`}
                              accessibilityState={{ checked: active }}
                            >
                              <Ionicons
                                name={option.icon}
                                size={14}
                                color={active ? (isDark ? darkPalette.accent : calm.primaryDeep) : (isDark ? darkPalette.muted : calm.muted)}
                              />
                              <Text
                                style={[
                                  s.appearanceSegmentText,
                                  isDark && s.appearanceSegmentTextDark,
                                  active && s.appearanceSegmentTextActive,
                                  isDark && active && s.accentTextDark,
                                ]}
                              >
                                {option.label}
                              </Text>
                            </Pressable>
                          );
                        })}
                      </View>
                    </View>
                  </View>
                );
              }

              return (
                <Pressable
                  key={row.label}
                  style={rowStyle}
                  onPress={() => handleMenu(row.action)}
                >
                  <View style={[s.menuIconWrap, isDark ? s.iconWrapDark : { backgroundColor: row.tint }]}>
                    <Ionicons name={row.icon} size={18} color={isDark ? darkPalette.accent : calm.forest} />
                  </View>
                  <Text style={[s.menuLabel, isDark && s.menuLabelDark, s.flex]}>{row.label}</Text>
                  <Ionicons
                    name="chevron-forward"
                    size={18}
                    color={isDark ? darkPalette.muted : calm.faint}
                  />
                </Pressable>
              );
            })}
          </View>
        ))}

        {/* ── Daily Reminder expandable card ── */}
        {showReminder && (
          <View style={[s.reminderCard, isDark && s.surfaceDark]}>
            <View style={s.reminderHeader}>
              <View style={{flexDirection:'row',alignItems:'center',gap:6}}><Ionicons name="notifications" size={16} color={isDark ? darkPalette.accent : calm.primary} /><Text style={[s.reminderTitle, isDark && s.textDark]}>Daily Reminder</Text></View>
              <Switch
                value={reminderEnabled}
                onValueChange={handleReminderToggle}
                trackColor={{ false: calm.border, true: calm.primary }}
                thumbColor="#FFFFFF"
              />
            </View>
            {reminderEnabled && (
              <>
                <Text style={[s.reminderSub, isDark && s.subTextDark]}>Choose your reminder time:</Text>
                <View style={s.reminderTimes}>
                  {REMINDER_TIMES.map((rt: typeof REMINDER_TIMES[number]) => {
                    const active = rt.hour === reminderHour && rt.minute === reminderMinute;
                    return (
                      <Pressable
                        key={rt.label}
                        style={[s.timeChip, isDark && s.timeChipDark, active && s.timeChipActive, isDark && active && s.timeChipActiveDark]}
                        onPress={() => handleReminderTime(rt.hour, rt.minute)}
                      >
                        <Text style={[s.timeChipTxt, isDark && s.subTextDark, active && s.timeChipTxtActive]}>
                          {rt.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
                <View style={s.reminderNoteRow}>
                  <Ionicons name="warning-outline" size={12} color={isDark ? darkPalette.muted : calm.muted} />
                  <Text style={[s.reminderNote, isDark && s.subTextDark]}>Requires a development build (not Expo Go) to deliver push notifications.
                  </Text>
                </View>
              </>
            )}
            <Pressable
              style={s.manageNotifLink}
              onPress={() => navigation.navigate('NotificationPreferences')}
            >
              <Text style={[s.manageNotifLinkTxt, isDark && s.accentTextDark]}>Manage reminder types & quiet hours →</Text>
            </Pressable>
          </View>
        )}

        {/* ── Switch Role ── */}
        <Pressable style={[s.switchRoleBtn, isDark && s.switchRoleBtnDark]} onPress={() => {
          logout();
          navigation.reset({ index: 0, routes: [{ name: 'RoleSelect' }] });
        }}>
          <View style={{flexDirection:'row',alignItems:'center',gap:8}}>
            <Ionicons name="swap-horizontal-outline" size={18} color={isDark ? darkPalette.accent : calm.primary} />
            <Text style={[s.switchRoleTxt, isDark && s.accentTextDark]}>Switch Role</Text>
          </View>
        </Pressable>

        {/* ── Logout ── */}
        <Pressable style={[s.logoutBtn, isDark && s.surfaceDark]} onPress={handleLogout}>
          <Text style={s.logoutTxt}>Log out</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const AVATAR_SIZE = 90;

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: calm.bg },
  rootDark: { backgroundColor: darkPalette.bg },
  flex: { flex: 1 },
  surfaceDark: {
    backgroundColor: darkPalette.surface,
    borderColor: darkPalette.border,
  },
  textDark: { color: darkPalette.text },
  subTextDark: { color: darkPalette.muted },
  accentTextDark: { color: darkPalette.accentText },
  dividerDark: { backgroundColor: darkPalette.border },

  // Header
  header: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl + 10,
  },
  closeBtn: {
    position: 'absolute',
    // top is set dynamically via insets.top at the call site - see the render's comment.
    right: spacing.lg,
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
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
    backgroundColor: calm.forest,
    marginHorizontal: spacing.lg,
    borderRadius: radii.lg,
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
  guestCardIconWrap: { width: 44, height: 44, borderRadius: 22, backgroundColor: calm.mintBg, alignItems: 'center' as const, justifyContent: 'center' as const },
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
    borderWidth: 1,
    borderColor: calm.border,
    ...shadow.md,
  },
  statItem: { flex: 1, alignItems: 'center', gap: 3 },
  statVal: { fontFamily: fonts.bodyBold, fontSize: fontSizes.base, color: calm.forest },
  statLab: { fontFamily: fonts.bodyMedium, fontSize: 10, color: calm.muted },
  statDivider: { width: 1, backgroundColor: calm.border },

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
    borderWidth: 1,
    borderColor: calm.border,
    ...shadow.sm,
  },
  leafLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  leafEmoji: { fontSize: 28 },
  leafIconWrap: { width: 36, height: 36, borderRadius: 18, backgroundColor: calm.mintBg, alignItems: 'center' as const, justifyContent: 'center' as const, marginBottom: 4 },
  iconWrapDark: { backgroundColor: darkPalette.surfaceGreen },
  leafTitle: { fontFamily: fonts.bodyBold, fontSize: fontSizes.base, color: calm.forest },
  leafSub: { fontFamily: fonts.bodyMedium, fontSize: fontSizes.xs, color: calm.muted, marginTop: 2 },
  leafChip: {
    backgroundColor: calm.mintBg,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radii.pill,
  },
  leafChipDark: { backgroundColor: darkPalette.surfaceGreen },
  leafCount: { fontFamily: fonts.bodyBold, fontSize: fontSizes.md, color: calm.primaryDeep },

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
  proSub: { fontFamily: fonts.bodyMedium, fontSize: fontSizes.xs, color: colors.sunText, marginTop: 2 },

  // Menu
  menuCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: calm.border,
    ...shadow.sm,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: spacing.md,
  },
  appearanceRow: {
    alignItems: 'flex-start',
    paddingVertical: 13,
  },
  menuDivider: { borderBottomWidth: 1, borderBottomColor: calm.border },
  menuDividerDark: { borderBottomColor: darkPalette.border },
  menuIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: calm.mintBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // menuIcon removed — replaced by Ionicons
  menuLabel: { fontFamily: fonts.bodyMedium, fontSize: fontSizes.base, color: calm.ink },
  menuLabelDark: { color: darkPalette.text },
  menuValue: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.xs,
    color: calm.primaryDeep,
  },
  appearanceHeaderLine: {
    minHeight: 36,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  appearanceCurrent: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.xs,
    color: calm.primaryDeep,
  },
  appearanceSegment: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    backgroundColor: calm.bg,
    borderRadius: radii.pill,
    padding: 3,
    borderWidth: 1,
    borderColor: calm.border,
    marginTop: 2,
  },
  appearanceSegmentDark: {
    backgroundColor: '#111211',
    borderColor: darkPalette.border,
  },
  appearanceSegmentItem: {
    flex: 1,
    minHeight: 34,
    borderRadius: radii.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  appearanceSegmentItemDark: {
    backgroundColor: 'transparent',
  },
  appearanceSegmentItemActive: {
    backgroundColor: calm.mintBg,
  },
  appearanceSegmentItemActiveDark: {
    backgroundColor: darkPalette.surfaceGreen,
  },
  appearanceSegmentText: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    color: calm.muted,
  },
  appearanceSegmentTextDark: {
    color: darkPalette.muted,
  },
  appearanceSegmentTextActive: {
    color: calm.primaryDeep,
  },

  darkCard: {
    backgroundColor: darkPalette.surface,
    borderColor: darkPalette.border,
  },

  switchRoleBtn: {
    borderRadius: radii.lg,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: calm.mintBg,
    borderWidth: 1.5,
    borderColor: calm.primary,
    marginBottom: 0,
  },
  switchRoleBtnDark: {
    backgroundColor: darkPalette.surfaceGreen,
    borderColor: darkPalette.accent,
  },
  switchRoleTxt: {
    fontFamily: fonts.bodyBold,
    fontSize: 15,
    color: calm.primaryDeep,
  },

  // Logout
  logoutBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: radii.md,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: calm.border,
    ...shadow.sm,
  },
  logoutTxt: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.base,
    color: calm.alertText,
  },

  reminderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radii.md,
    padding: spacing.lg,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: calm.border,
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
    color: calm.forest,
  },
  reminderSub: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.xs,
    color: calm.muted,
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
    backgroundColor: calm.bg,
    borderWidth: 1.5,
    borderColor: calm.border,
  },
  timeChipActive: {
    backgroundColor: calm.primary,
    borderColor: calm.primary,
  },
  timeChipDark: {
    backgroundColor: '#111211',
    borderColor: darkPalette.border,
  },
  timeChipActiveDark: {
    backgroundColor: darkPalette.surfaceGreen,
    borderColor: darkPalette.accent,
  },
  timeChipTxt: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.xs,
    color: calm.muted,
  },
  timeChipTxtActive: { color: '#FFFFFF' },
  reminderNoteRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 4, marginTop: 4 },
  reminderNote: {
    fontFamily: fonts.bodyMedium,
    fontSize: 10,
    color: calm.muted,
    lineHeight: 14,
    flex: 1,
  },
  manageNotifLink: { marginTop: spacing.sm, alignSelf: 'flex-start' },
  manageNotifLinkTxt: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.xs,
    color: calm.primaryDeep,
  },
});
