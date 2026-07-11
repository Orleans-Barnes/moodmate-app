import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, fontSizes, spacing, radii } from '@/theme/tokens';

interface ScreenHeaderProps {
  title: string;
  onClose?: () => void;
  rightSlot?: React.ReactNode;
  /** Extra top padding — pass 0 when the parent already handles safe-area (e.g. modals with insetTop). Defaults to safe-area inset. */
  paddingTop?: number;
}

/** Header used inside modal screens (Check-in, Wellness Tree, SOS, etc.) */
export function ScreenHeader({ title, onClose, rightSlot, paddingTop }: ScreenHeaderProps) {
  const insets = useSafeAreaInsets();
  // On iOS modals the system gives a small drag handle area (~20pt); add a sensible default
  // so the close button doesn't sit right at the screen edge.
  const topPad = paddingTop !== undefined ? paddingTop : Math.max(insets.top, spacing.md);

  return (
    <View style={[styles.row, { paddingTop: topPad }]}>
      {onClose ? (
        <Pressable
          onPress={onClose}
          style={styles.closeBtn}
          accessibilityRole="button"
          accessibilityLabel="Close"
          hitSlop={8}
        >
          <Text style={styles.closeLabel}>✕</Text>
        </Pressable>
      ) : (
        <View style={styles.spacer} />
      )}
      <Text style={styles.title} accessibilityRole="header">{title}</Text>
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
});
