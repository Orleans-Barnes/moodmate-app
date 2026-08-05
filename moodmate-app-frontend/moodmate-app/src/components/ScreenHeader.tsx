import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, darkPalette, fonts, fontSizes, spacing, radii } from '@/theme/tokens';
import { useResolvedAppearance } from '@/hooks/useResolvedAppearance';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  onClose?: () => void;
  rightSlot?: React.ReactNode;
  /** Extra top padding — pass 0 when the parent already handles safe-area (e.g. modals with insetTop). Defaults to safe-area inset. */
  paddingTop?: number;
  /**
   * Thinner variant with a chevron-back instead of a circular ✕ button and a
   * hairline bottom border — for settings-style screens (Notifications,
   * Privacy, Help) that sit deeper in a stack rather than presenting as a
   * standalone modal. Same title/rightSlot API either way.
   */
  compact?: boolean;
}

/** Header used inside modal screens (Check-in, Wellness Tree, SOS, etc.) */
export function ScreenHeader({ title, subtitle, onClose, rightSlot, paddingTop, compact = false }: ScreenHeaderProps) {
  const insets = useSafeAreaInsets();
  const { isDark } = useResolvedAppearance();
  // On iOS modals the system gives a small drag handle area (~20pt); add a sensible default
  // so the close button doesn't sit right at the screen edge.
  const topPad = paddingTop !== undefined ? paddingTop : Math.max(insets.top, spacing.md);

  return (
    <View style={[
      styles.row,
      { paddingTop: topPad },
      compact && styles.rowCompact,
      compact && isDark && styles.rowCompactDark,
    ]}>
      {onClose ? (
        <Pressable
          onPress={onClose}
          style={compact ? styles.backBtn : styles.closeBtn}
          accessibilityRole="button"
          accessibilityLabel={compact ? 'Back' : 'Close'}
          hitSlop={8}
        >
          {compact ? (
            <Ionicons name="chevron-back" size={24} color={isDark ? darkPalette.text : colors.ink} />
          ) : (
            <Ionicons name="close" size={20} color={isDark ? darkPalette.textSoft : colors.inkSoft} />
          )}
        </Pressable>
      ) : (
        <View style={styles.spacer} />
      )}
      <View style={styles.titleBlock}>
        <Text style={[styles.title, isDark && styles.titleDark, compact && styles.titleCompact]} accessibilityRole="header">{title}</Text>
        {subtitle ? <Text style={[styles.subtitle, isDark && styles.subtitleDark]}>{subtitle}</Text> : null}
      </View>
      {rightSlot ?? <View style={styles.spacer} />}
    </View>
  );
}

const SIZE = 38;

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: spacing.md,
    paddingHorizontal: 2,
  },
  rowCompact: {
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    marginBottom: spacing.xs,
  },
  rowCompactDark: {
    borderBottomColor: darkPalette.border,
  },
  backBtn: {
    width: SIZE,
    height: SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backLabel: {
    fontSize: 26,
    lineHeight: 28,
    color: colors.ink,
  },
  titleCompact: {
    fontSize: fontSizes.md,
  },
  closeBtn: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeLabel: {
    fontSize: fontSizes.base,
    color: colors.ink,
  },
  spacer: {
    width: SIZE,
  },
  title: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.base,
    color: colors.ink,
  },
  titleDark: { color: darkPalette.text },
  titleBlock: {
    flex: 1,
    alignItems: 'center',
  },
  subtitle: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.xs,
    color: colors.inkSoft,
    marginTop: 2,
  },
  subtitleDark: { color: darkPalette.textMuted },
});
